import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DispositionDto, DispositionAction } from './rejections.dto';

@Injectable()
export class RejectionsService {
  constructor(private prisma: PrismaService) {}

  async getPendingRejections() {
    return this.prisma.stageMovementLog.findMany({
      where: {
        qtyRejected: { gt: 0 },
        qcReviewStatus: 'PENDING_QC',
      },
      include: {
        stage: {
          select: { name: true, code: true }
        },
        subJobCard: {
          include: {
            jobCard: {
              include: {
                product: {
                  select: { code: true, name: true }
                }
              }
            }
          }
        },
        createdBy: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async setDisposition(movementId: string, dto: DispositionDto, user: any) {
    const roleName = user?.roleName || user?.role || user?.role?.name;
    const isQcOrAdmin = ['SUPER_ADMIN', 'QC_OFFICER', 'admin', 'qc'].includes(roleName);

    if (!isQcOrAdmin) {
      throw new ForbiddenException('Only QC or Admin can set rejection disposition');
    }

    const movement = await this.prisma.stageMovementLog.findUnique({
      where: { id: movementId },
      include: {
        subJobCard: {
          include: {
            jobCard: true
          }
        }
      }
    });

    if (!movement) {
      throw new NotFoundException(`Movement log with ID ${movementId} not found`);
    }

    if (movement.qcReviewStatus !== 'PENDING_QC') {
      throw new BadRequestException('This rejection has already been reviewed');
    }

    if (dto.action === DispositionAction.REWORK && !dto.reworkStageId) {
      throw new BadRequestException('reworkStageId is required when disposition is REWORK');
    }

    const userId = user?.id || user?.sub || user?.userId;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update the movement log
      const updatedMovement = await tx.stageMovementLog.update({
        where: { id: movementId },
        data: {
          qcReviewStatus: dto.action === DispositionAction.SCRAP ? 'APPROVED_SCRAP' : 'APPROVED_REWORK',
          qcReviewedById: userId,
          qcReviewedAt: new Date(),
          qcRemarks: dto.qcRemarks || null,
        }
      });

      if (dto.action === DispositionAction.REWORK) {
        // Spawn a new SubJobCard for Rework
        const existingCount = await tx.subJobCard.count({
          where: { jobCardId: movement.subJobCard.jobCardId }
        });
        
        // Suffix -RW1, -RW2, etc. (Or just based on count)
        const reworkSuffix = `-RW${existingCount + 1}`;
        const reworkSubJobCardNo = `${movement.subJobCard.jobCard.jobCardNo}${reworkSuffix}`;
        
        const newReworkCard = await tx.subJobCard.create({
          data: {
            subJobCardNo: reworkSubJobCardNo,
            jobCardId: movement.subJobCard.jobCardId,
            parentSubJobCardId: movement.subJobCardId,
            currentStageId: dto.reworkStageId,
            qty: movement.qtyRejected,
            qtyReceived: movement.qtyRejected,
            qtyProcessed: 0,
            qtyHold: 0,
            qtyRejected: 0,
            status: 'IN_STAGE',
            qrCodeValue: `QR-${reworkSubJobCardNo}-${Date.now()}`,
            isRework: true,
            createdById: userId,
          }
        });

        // We also need to decrement the rejected quantity from the original subjobcard 
        // because it's no longer 'rejected/scrap', it's active WIP again as rework.
        await tx.subJobCard.update({
          where: { id: movement.subJobCardId },
          data: {
            qtyRejected: Math.max(0, movement.subJobCard.qtyRejected - movement.qtyRejected)
          }
        });

        return { movement: updatedMovement, newReworkCard };
      }

      return { movement: updatedMovement };
    });
  }
}
