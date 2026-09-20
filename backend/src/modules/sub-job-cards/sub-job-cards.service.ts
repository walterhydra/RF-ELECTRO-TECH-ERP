import { Injectable, NotFoundException, BadRequestException, HttpException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubJobCardStatus } from '@prisma/client';
import * as qrcode from 'qrcode';
import { StageUpdateDto } from './sub-job-cards.dto';

@Injectable()
export class SubJobCardsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const subCard = await this.prisma.subJobCard.findUnique({
      where: { id },
      include: {
        currentStage: true,
        jobCard: {
          include: {
            product: true,
            customerPO: {
              include: { customer: true },
            },
            processFlowMaster: {
              include: {
                steps: {
                  include: { stage: true },
                  orderBy: { stepOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!subCard) {
      throw new NotFoundException(`Sub Job Card with ID "${id}" not found`);
    }

    return subCard;
  }

  async findByQrValue(qrValue: string) {
    if (!qrValue) {
      throw new NotFoundException('QR Code value parameter is empty');
    }

    const cleanQuery = qrValue.trim();

    // 1. Exact or partial match on SubJobCard
    const subCards = await this.prisma.subJobCard.findMany({
      where: {
        OR: [
          { qrCodeValue: { equals: cleanQuery, mode: 'insensitive' } },
          { subJobCardNo: { equals: cleanQuery, mode: 'insensitive' } },
          { subJobCardNo: { contains: cleanQuery, mode: 'insensitive' } },
          { qrCodeValue: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      include: {
        currentStage: true,
        jobCard: {
          include: {
            product: true,
            customerPO: { include: { customer: true } },
            processFlowMaster: {
              include: {
                steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (subCards.length > 0) {
      return {
        type: 'SUB_JOB_CARD_LIST',
        count: subCards.length,
        data: subCards.length === 1 ? subCards[0] : subCards,
      };
    }

    // 2. Check Parent JobCard
    const jobCard = await this.prisma.jobCard.findFirst({
      where: {
        OR: [
          { qrCodeValue: { equals: cleanQuery, mode: 'insensitive' } },
          { jobCardNo: { equals: cleanQuery, mode: 'insensitive' } },
          { jobCardNo: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      include: {
        product: true,
        customerPO: { include: { customer: true } },
        processFlowMaster: {
          include: {
            steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } },
          },
        },
        subJobCards: {
          include: { currentStage: true },
          orderBy: { subJobCardNo: 'asc' },
        },
      },
    });

    if (jobCard) {
      return {
        type: 'JOB_CARD',
        data: jobCard,
      };
    }

    throw new NotFoundException(`No Job Card or Sub-Job Card found matching QR or Barcode "${cleanQuery}"`);
  }

  async getQrCodeImage(id: string) {
    const subCard = await this.prisma.subJobCard.findUnique({
      where: { id },
      include: {
        jobCard: {
          include: { product: true },
        },
      },
    });

    if (!subCard) {
      throw new NotFoundException(`Sub Job Card with ID "${id}" not found`);
    }

    const payload = {
      type: 'SUB_JOB_CARD',
      id: subCard.id,
      subJobCardNo: subCard.subJobCardNo,
      jobCardNo: subCard.jobCard.jobCardNo,
      productCode: subCard.jobCard.product.code,
      qty: subCard.qty,
      qrCodeValue: subCard.qrCodeValue,
    };

    const dataUrl = await qrcode.toDataURL(JSON.stringify(payload), {
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return {
      id: subCard.id,
      subJobCardNo: subCard.subJobCardNo,
      qrCodeValue: subCard.qrCodeValue,
      dataUrl,
      payload,
    };
  }

  async updateStatus(id: string, status: SubJobCardStatus) {
    const subCard = await this.prisma.subJobCard.findUnique({ where: { id } });
    if (!subCard) {
      throw new NotFoundException(`Sub Job Card with ID "${id}" not found`);
    }

    return this.prisma.subJobCard.update({
      where: { id },
      data: { status },
      include: {
        currentStage: true,
        jobCard: true,
      },
    });
  }

  async getCurrentStage(id: string) {
    const subCard: any = await this.findOne(id);
    const steps = subCard.jobCard?.processFlowMaster?.steps || [];
    const currentStep = steps.find((s: any) => s.stageId === subCard.currentStageId);

    return {
      subJobCardId: subCard.id,
      subJobCardNo: subCard.subJobCardNo,
      jobCardNo: subCard.jobCard?.jobCardNo,
      productCode: subCard.jobCard?.product?.code,
      status: subCard.status,
      currentStage: subCard.currentStage,
      stepOrder: currentStep?.stepOrder || 1,
      totalSteps: steps.length || 10,
      wip: {
        qtyTotal: subCard.qty,
        qtyReceived: subCard.qtyReceived || 0,
        qtyProcessed: subCard.qtyProcessed || 0,
        qtyHold: subCard.qtyHold || 0,
        qtyRejected: subCard.qtyRejected || 0,
        qtyAvailableToForward: Math.max(0, (subCard.qtyProcessed || 0) - (subCard.qtyHold || 0)),
      },
    };
  }

  async getTraceabilityHistory(id: string, user: any) {
    const subCard = await this.prisma.subJobCard.findUnique({ where: { id } });
    if (!subCard) {
      throw new NotFoundException(`Sub Job Card with ID "${id}" not found`);
    }

    const logs = await this.prisma.stageMovementLog.findMany({
      where: { subJobCardId: id },
      include: {
        stage: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!user) return logs;
    const roleName = user.roleName || user.role || user.role?.name;
    const isOperator = roleName === 'PROCESS_OPERATOR' || roleName === 'process_user';
    const isCustomer = roleName === 'CUSTOMER' || roleName === 'customer';

    let filtered: any[] = logs;
    if (isOperator && user.assignedStageId) {
      filtered = logs.filter((l) => l.stageId === user.assignedStageId);
    }

    if (isCustomer) {
      filtered = filtered.map((l: any) => ({
        ...l,
        createdBy: { id: 'hidden', name: 'Production Floor', email: 'hidden', role: { name: 'Staff' } },
      }));
    }

    return filtered;
  }

  async executeStageUpdate(id: string, dto: StageUpdateDto, user: any) {
    const subCard: any = await this.findOne(id);

    if (subCard.status === SubJobCardStatus.COMPLETED) {
      throw new BadRequestException('This Sub Job Card is already completed and cannot be updated');
    }

    if (dto.clientRequestId) {
      const existing = await this.prisma.stageMovementLog.findUnique({
        where: { clientRequestId: dto.clientRequestId },
      });
      if (existing) {
        throw new HttpException(
          {
            statusCode: 409,
            error: 'DUPLICATE_SUBMISSION',
            message: 'This update was already recorded',
            movementId: existing.id,
          },
          409,
        );
      }
    }

    const roleName = user?.roleName || user?.role || user?.role?.name;
    const isOperator = roleName === 'PROCESS_OPERATOR' || roleName === 'process_user';
    const isAdminOrPlanner =
      roleName === 'SUPER_ADMIN' ||
      roleName === 'PRODUCTION_PLANNER' ||
      roleName === 'admin' ||
      roleName === 'production_manager';

    if (isOperator && subCard.currentStageId && user?.assignedStageId !== subCard.currentStageId) {
      throw new HttpException(
        {
          statusCode: 403,
          error: 'STAGE_MISMATCH',
          message: `You are only authorized to log movements for your assigned process stage (ID: ${user?.assignedStageId}). This lot is currently at stage ID: ${subCard.currentStageId}.`,
        },
        403,
      );
    }

    const isOverride = Boolean(
      dto.isOverride || (isAdminOrPlanner && user?.assignedStageId && user?.assignedStageId !== subCard.currentStageId),
    );

    if (dto.qtyReceived > subCard.qty) {
      throw new BadRequestException('Received quantity cannot exceed Sub Job Card total lot quantity');
    }
    if (dto.qtyProcessed > dto.qtyReceived) {
      throw new BadRequestException('Processed quantity cannot exceed received quantity');
    }
    const totalOut = dto.qtyForwarded + (dto.qtyRejected || 0) + (dto.qtyHold || 0);
    if (totalOut > dto.qtyProcessed) {
      throw new BadRequestException('Sum of forwarded, rejected, and hold quantities cannot exceed processed quantity');
    }
    if (totalOut > subCard.qty) {
      throw new BadRequestException('Cannot forward or reject more than available lot quantity');
    }
    if ((dto.qtyRejected || 0) > 0 && !dto.rejectionReason) {
      throw new BadRequestException('rejectionReason is mandatory when rejected quantity is greater than 0');
    }

    const steps = subCard.jobCard?.processFlowMaster?.steps || [];
    const currentStep = steps.find((s: any) => s.stageId === subCard.currentStageId);
    const nextStep = currentStep ? steps.find((s: any) => s.stepOrder > currentStep.stepOrder) : null;
    const userId = user?.id || user?.sub || user?.userId || subCard.createdById;

    return this.prisma.$transaction(async (tx) => {
      const movementLog = await tx.stageMovementLog.create({
        data: {
          subJobCardId: subCard.id,
          stageId: subCard.currentStageId || subCard.jobCardId,
          qtyReceived: dto.qtyReceived,
          qtyProcessed: dto.qtyProcessed,
          qtyForwarded: dto.qtyForwarded,
          qtyRejected: dto.qtyRejected || 0,
          qtyHold: dto.qtyHold || 0,
          rejectionReason: dto.rejectionReason || null,
          remarks: dto.remarks || null,
          qcReviewStatus: (dto.qtyRejected || 0) > 0 ? 'PENDING_QC' : 'NOT_APPLICABLE',
          isOverride,
          clientRequestId: dto.clientRequestId || null,
          createdById: userId,
        },
      });

      let splitOccurred = false;
      let newSubJobCard = null;

      // Calculate exact 1 PCB SQM ratio (Total Area / Total PCB Qty)
      const totalJobPcbQty = subCard.jobCard?.totalPcbQty || subCard.jobCard?.totalQty || subCard.qty || 1;
      const totalJobSqmArea = subCard.jobCard?.prodPnlAreaSqm || subCard.prodPnlAreaSqm || 0;
      const sqmPerPcb = totalJobPcbQty > 0 ? totalJobSqmArea / totalJobPcbQty : 0;

      // Net Quantity moving forward to Next Stage (subtracting any PCB Rejections occurring during movement)
      const effectiveRejectedQty = dto.qtyRejected || 0;
      const netForwardedQty = Math.max(0, dto.qtyForwarded - effectiveRejectedQty);

      if (dto.qtyForwarded >= subCard.qty) {
        // FULL JOB MOVEMENT (Entire lot moving, minus any PCB Rejections occurring during full movement)
        const finalNextStageQty = Math.max(0, subCard.qty - effectiveRejectedQty);
        const finalNextStageSqm = Number((finalNextStageQty * sqmPerPcb).toFixed(2));

        if (nextStep) {
          await tx.subJobCard.update({
            where: { id: subCard.id },
            data: {
              currentStageId: nextStep.stageId,
              status: SubJobCardStatus.IN_STAGE,
              qty: finalNextStageQty,
              prodPnlQty: finalNextStageQty,
              prodPnlAreaSqm: finalNextStageSqm,
              custPnlAreaSqm: finalNextStageSqm,
              qtyReceived: 0,
              qtyProcessed: 0,
              qtyHold: 0,
              qtyRejected: subCard.qtyRejected + effectiveRejectedQty,
            },
          });
        } else {
          await tx.subJobCard.update({
            where: { id: subCard.id },
            data: {
              currentStageId: null,
              status: SubJobCardStatus.COMPLETED,
              qty: finalNextStageQty,
              prodPnlQty: finalNextStageQty,
              prodPnlAreaSqm: finalNextStageSqm,
              custPnlAreaSqm: finalNextStageSqm,
              qtyReceived: dto.qtyReceived,
              qtyProcessed: dto.qtyProcessed,
              qtyHold: dto.qtyHold || 0,
              qtyRejected: subCard.qtyRejected + effectiveRejectedQty,
            },
          });
          await this.checkAndUpdateParentJobCard(tx, subCard.jobCardId);
        }
      } else if (dto.qtyForwarded > 0) {
        // UNCOMPLETED / PARTIAL MOVEMENT (Keep exact same Job Card Number without A/B letter suffix)
        splitOccurred = true;
        const remainingQtyAtCurrentStage = Math.max(0, subCard.qty - dto.qtyForwarded - effectiveRejectedQty);
        const remainingSqmAtCurrentStage = Number((remainingQtyAtCurrentStage * sqmPerPcb).toFixed(2));
        const forwardedNextStageSqm = Number((netForwardedQty * sqmPerPcb).toFixed(2));

        // Update remaining WIP at current stage under same Job Card
        await tx.subJobCard.update({
          where: { id: subCard.id },
          data: {
            qty: remainingQtyAtCurrentStage,
            prodPnlQty: remainingQtyAtCurrentStage,
            prodPnlAreaSqm: remainingSqmAtCurrentStage,
            custPnlAreaSqm: remainingSqmAtCurrentStage,
            qtyReceived: Math.max(0, dto.qtyReceived - dto.qtyForwarded - effectiveRejectedQty),
            qtyProcessed: Math.max(0, dto.qtyProcessed - dto.qtyForwarded - effectiveRejectedQty),
            qtyHold: dto.qtyHold || 0,
            qtyRejected: subCard.qtyRejected + effectiveRejectedQty,
            status: (dto.qtyHold || 0) > 0 ? SubJobCardStatus.ON_HOLD : (remainingQtyAtCurrentStage === 0 ? SubJobCardStatus.COMPLETED : SubJobCardStatus.IN_STAGE),
          },
        });

        if (nextStep && netForwardedQty > 0) {
          const parentJobCard = subCard.jobCard || (await tx.jobCard.findUnique({
            where: { id: subCard.jobCardId },
            select: { jobCardNo: true },
          }));
          const baseJobCardNo = parentJobCard?.jobCardNo || subCard.subJobCardNo;

          const allExistingSubs = await tx.subJobCard.findMany({
            where: { jobCardId: subCard.jobCardId },
            select: { subJobCardNo: true },
          });

          const usedLetters = new Set<string>();
          for (const s of allExistingSubs) {
            if (s.subJobCardNo.startsWith(`${baseJobCardNo}-`)) {
              const suffix = s.subJobCardNo.slice(`${baseJobCardNo}-`.length).trim();
              if (/^[A-Z]+$/i.test(suffix)) {
                usedLetters.add(suffix.toUpperCase());
              }
            }
          }

          let nextLetter = 'A';
          for (let i = 0; i < 26; i++) {
            const char = String.fromCharCode(65 + i);
            if (!usedLetters.has(char)) {
              nextLetter = char;
              break;
            }
          }

          const newSubJobCardNo = `${baseJobCardNo}-${nextLetter}`;

          newSubJobCard = await tx.subJobCard.create({
            data: {
              subJobCardNo: newSubJobCardNo,
              jobCardId: subCard.jobCardId,
              parentSubJobCardId: subCard.id,
              currentStageId: nextStep.stageId,
              qty: netForwardedQty,
              prodPnlQty: netForwardedQty,
              prodPnlAreaSqm: forwardedNextStageSqm,
              custPnlAreaSqm: forwardedNextStageSqm,
              qtyReceived: 0,
              qtyProcessed: 0,
              qtyHold: 0,
              qtyRejected: 0,
              status: SubJobCardStatus.IN_STAGE,
              qrCodeValue: `RFE-JC-${newSubJobCardNo}-${nextStep.stageId.slice(0, 4)}-${Date.now().toString().slice(-4)}`,
              createdById: userId,
            },
          });
        }
        if (remainingQtyAtCurrentStage === 0 && !nextStep) {
          await this.checkAndUpdateParentJobCard(tx, subCard.jobCardId);
        }
      } else {
        const remainingQty = Math.max(0, subCard.qty - effectiveRejectedQty);
        const remainingSqm = Number((remainingQty * sqmPerPcb).toFixed(2));
        await tx.subJobCard.update({
          where: { id: subCard.id },
          data: {
            qty: remainingQty,
            prodPnlQty: remainingQty,
            prodPnlAreaSqm: remainingSqm,
            custPnlAreaSqm: remainingSqm,
            qtyReceived: dto.qtyReceived,
            qtyProcessed: dto.qtyProcessed,
            qtyHold: dto.qtyHold || 0,
            qtyRejected: subCard.qtyRejected + effectiveRejectedQty,
            status: (dto.qtyHold || 0) > 0 ? SubJobCardStatus.ON_HOLD : (remainingQty === 0 ? SubJobCardStatus.COMPLETED : SubJobCardStatus.IN_STAGE),
          },
        });
        if (remainingQty === 0) {
          await this.checkAndUpdateParentJobCard(tx, subCard.jobCardId);
        }
      }

      return {
        movementId: movementLog.id,
        splitOccurred,
        subJobCardStatus: (dto.qtyHold || 0) > 0 ? 'ON_HOLD' : 'IN_STAGE',
        newSubJobCard: newSubJobCard
          ? {
              id: newSubJobCard.id,
              subJobCardNo: newSubJobCard.subJobCardNo,
              qty: newSubJobCard.qty,
              currentStageId: newSubJobCard.currentStageId,
            }
          : null,
        remainingAtCurrentStage: {
          subJobCardNo: subCard.subJobCardNo,
          qty: Math.max(0, subCard.qty - dto.qtyForwarded - effectiveRejectedQty),
        },
      };
    });
  }

  private async checkAndUpdateParentJobCard(tx: any, jobCardId: string) {
    const allSubCards = await tx.subJobCard.findMany({ where: { jobCardId } });
    const allCompleted = allSubCards.every((c: any) => c.status === SubJobCardStatus.COMPLETED);
    if (allCompleted) {
      await tx.jobCard.update({
        where: { id: jobCardId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
  }
}
