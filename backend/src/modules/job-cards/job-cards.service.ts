import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobCardStatus, SubJobCardStatus, POStatus, RoleCode } from '@prisma/client';
import * as qrcode from 'qrcode';

@Injectable()
export class JobCardsService {
  constructor(private prisma: PrismaService) {}

  async generateFromPo(customerPoId: string, createdById: string) {
    if (!createdById) {
      const defaultUser = await this.prisma.user.findFirst();
      createdById = defaultUser?.id || '';
    }
    if (!customerPoId) {
      throw new BadRequestException('customerPoId is required');
    }

    const po = await this.prisma.customerPO.findUnique({
      where: { id: customerPoId },
      include: {
        product: true,
        customer: true,
        jobCards: true,
      },
    });

    if (!po) {
      throw new NotFoundException(`Customer PO with ID "${customerPoId}" not found`);
    }

    if (po.status === POStatus.CANCELLED || po.status === POStatus.CLOSED) {
      throw new BadRequestException(`Cannot generate Job Card for PO in status "${po.status}"`);
    }

    if (!po.product || !po.product.processFlowId) {
      throw new BadRequestException(`Product specification card attached to PO lacks a manufacturing process flow`);
    }

    // Generate sequential jobCardNo safely
    const lastJc = await this.prisma.jobCard.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let nextNum = 1;
    if (lastJc && lastJc.jobCardNo) {
      const match = lastJc.jobCardNo.match(/\d+$/);
      if (match) {
        const parsed = parseInt(match[0], 10);
        if (!isNaN(parsed)) {
          nextNum = parsed + 1;
        }
      }
    }
    const jobCardNo = `JC${String(nextNum).padStart(3, '0')}`;
    const qrCodeValue = `RFE-JC-${jobCardNo}-${Date.now().toString().slice(-4)}`;

    return this.prisma.$transaction(async (tx) => {
      const jobCard = await tx.jobCard.create({
        data: {
          jobCardNo,
          customerPoId,
          productId: po.productId,
          processFlowMasterId: po.product.processFlowId,
          totalQty: po.orderQty,
          status: JobCardStatus.CREATED,
          qrCodeValue,
          createdById,
        },
        include: {
          customerPO: {
            include: { customer: true },
          },
          product: true,
          processFlowMaster: true,
          subJobCards: true,
        },
      });

      // Update PO status
      await tx.customerPO.update({
        where: { id: customerPoId },
        data: { status: POStatus.IN_PRODUCTION },
      });

      return jobCard;
    });
  }

  async findAll(
    query?: {
      status?: JobCardStatus;
      customerPoId?: string;
      productId?: string;
      search?: string;
    },
    user?: any,
  ) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.customerPoId) where.customerPoId = query.customerPoId;
    if (query?.productId) where.productId = query.productId;
    if (query?.search) {
      where.OR = [
        { jobCardNo: { contains: query.search, mode: 'insensitive' } },
        { customerPO: { poNo: { contains: query.search, mode: 'insensitive' } } },
        { product: { name: { contains: query.search, mode: 'insensitive' } } },
        { product: { code: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const jobCards = await this.prisma.jobCard.findMany({
      where,
      include: {
        customerPO: {
          include: { customer: true },
        },
        product: true,
        processFlowMaster: true,
        subJobCards: {
          include: { currentStage: true },
          orderBy: { subJobCardNo: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-correct sub-job card PCB quantities & calculate rejection logs
    for (const jc of jobCards) {
      if (jc.subJobCards && jc.subJobCards.length > 0) {
        const masterPcbQty = jc.totalPcbQty || (jc.custPnlQty && jc.custPnlQty > 50 ? jc.custPnlQty : (jc.prodPnlQty ? jc.prodPnlQty * 4 : 160));

        jc.subJobCards.forEach((sub, subIdx) => {
          const subPcbQty = (sub.totalPcbQty && sub.totalPcbQty > 0) ? sub.totalPcbQty : (sub.qty && sub.qty > 0 ? sub.qty : masterPcbQty);

          let cleanNo = sub.subJobCardNo;

          // 1. If single lot: WIP No must match exact parent jobCardNo (e.g. 26-27-7151-80)
          if (jc.subJobCards.length <= 1) {
            cleanNo = jc.jobCardNo;
          } else {
            // 2. If multiple lots:
            // Lot 0 (main / remaining lot): keeps exact jc.jobCardNo if not letter-suffixed
            if (subIdx === 0 && (cleanNo === `${jc.jobCardNo}-1` || cleanNo === jc.jobCardNo || !cleanNo.startsWith(`${jc.jobCardNo}-`))) {
              cleanNo = jc.jobCardNo;
            } else if (subIdx > 0) {
              // Split lots: Must have exact base jobCardNo + letter suffix (e.g. 26-27-7151-80-A, 26-27-7151-80-B)
              const letter = String.fromCharCode(65 + (subIdx - 1));
              const suffix = cleanNo.startsWith(`${jc.jobCardNo}-`) ? cleanNo.slice(`${jc.jobCardNo}-`.length).trim() : '';
              if (!suffix || !/^[A-Z]+$/i.test(suffix)) {
                cleanNo = `${jc.jobCardNo}-${letter}`;
              }
            }
          }

          if (sub.totalPcbQty !== subPcbQty || sub.qty !== subPcbQty || sub.subJobCardNo !== cleanNo) {
            sub.totalPcbQty = subPcbQty;
            sub.qty = subPcbQty;
            sub.custPnlQty = subPcbQty;
            sub.prodPnlQty = Math.ceil(subPcbQty / 4);
            sub.subJobCardNo = cleanNo;
            this.prisma.subJobCard.update({
              where: { id: sub.id },
              data: {
                totalPcbQty: subPcbQty,
                qty: subPcbQty,
                custPnlQty: subPcbQty,
                prodPnlQty: Math.ceil(subPcbQty / 4),
                subJobCardNo: cleanNo,
              },
            }).catch(() => {});
          }
        });

        // Calculate live rejection statistics & logs from stageMovementLog
        const subCardIds = jc.subJobCards.map((s) => s.id);
        const rejectionLogs = await this.prisma.stageMovementLog.findMany({
          where: {
            subJobCardId: { in: subCardIds },
            qtyRejected: { gt: 0 },
          },
          include: { stage: true },
          orderBy: { createdAt: 'asc' },
        }).catch(() => []);

        let totalRejectedPcb = 0;
        let totalRejectedArea = 0;
        const formattedLogs = rejectionLogs.map((log) => {
          totalRejectedPcb += log.qtyRejected || 0;
          const sqm = jc.prodPnlAreaSqm && jc.totalPcbQty ? Number(((jc.prodPnlAreaSqm * log.qtyRejected) / jc.totalPcbQty).toFixed(2)) : 0;
          totalRejectedArea += sqm;
          return {
            stageName: log.stage?.name || '1. SHEARING',
            rejectedPcbQty: log.qtyRejected,
            rejectedAreaSqm: sqm,
            remark: log.remarks || 'Stage Rejection',
            timestamp: log.createdAt.toISOString(),
          };
        });

        (jc as any).rejectedPcbQty = totalRejectedPcb;
        (jc as any).rejectedAreaSqm = Number(totalRejectedArea.toFixed(2));
        (jc as any).rejectionLogs = formattedLogs;

        // Populate active stage info directly on job card object for client sync
        const sortedSubCards = [...(jc.subJobCards || [])].sort((a: any, b: any) => {
          const orderA = a.currentStage?.defaultOrder || 0;
          const orderB = b.currentStage?.defaultOrder || 0;
          return orderB - orderA;
        });
        const topSub = sortedSubCards[0];
        if (topSub && topSub.currentStage) {
          (jc as any).currentStageName = topSub.currentStage.name;
          (jc as any).currentStageIndex = Math.max(0, (topSub.currentStage.defaultOrder || 1) - 1);
        } else if (jc.status === JobCardStatus.COMPLETED) {
          (jc as any).currentStageName = '19. DISPATCH';
          (jc as any).currentStageIndex = 18;
        } else {
          (jc as any).currentStageName = '1. SHEARING';
          (jc as any).currentStageIndex = 0;
        }
      } else {
        if (jc.status === JobCardStatus.COMPLETED) {
          (jc as any).currentStageName = '19. DISPATCH';
          (jc as any).currentStageIndex = 18;
        } else {
          (jc as any).currentStageName = '1. SHEARING';
          (jc as any).currentStageIndex = 0;
        }
      }
    }



    // Filter job cards for Process Operators to ONLY show jobs assigned to their active stage
    if (user) {
      const roleName = String(user.roleName || user.role || user.role?.name || user.roleCode || '').toUpperCase();
      const isOperator =
        roleName === 'NORMAL_USER' ||
        roleName === 'PROCESS_OPERATOR' ||
        roleName === 'NORMAL' ||
        roleName === 'OPERATOR';

      if (isOperator) {
        const assignedStageId = user.assignedStageId;
        const assignedStageName = String(user.assignedStageName || user.assignedStage?.name || '').toLowerCase().trim();

        if (assignedStageId || assignedStageName) {
          return jobCards.filter((jc: any) => {
            const currentStageName = String(jc.currentStageName || '').toLowerCase().trim();

            let matches = false;
            if (assignedStageName && currentStageName) {
              if (
                currentStageName === assignedStageName ||
                currentStageName.includes(assignedStageName) ||
                assignedStageName.includes(currentStageName)
              ) {
                matches = true;
              }
            }

            if (!matches && jc.subJobCards && Array.isArray(jc.subJobCards)) {
              matches = jc.subJobCards.some((s: any) => {
                if (assignedStageId && s.currentStageId === assignedStageId) return true;
                const sName = String(s.currentStage?.name || '').toLowerCase().trim();
                if (
                  assignedStageName &&
                  sName &&
                  (sName === assignedStageName || sName.includes(assignedStageName) || assignedStageName.includes(sName))
                ) {
                  return true;
                }
                return false;
              });
            }

            return matches;
          });
        }
      }
    }

    return jobCards;
  }

  async findOne(id: string, client: any = this.prisma) {
    const db = client || this.prisma;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let jobCard: any = null;
    try {
      if (isUuid) {
        jobCard = await db.jobCard.findUnique({
          where: { id },
          include: {
            customerPO: { include: { customer: true } },
            product: true,
            processFlowMaster: {
              include: {
                steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } },
              },
            },
            subJobCards: {
              include: {
                currentStage: true,
                movements: { include: { stage: true }, orderBy: { createdAt: 'asc' } },
              },
              orderBy: { subJobCardNo: 'asc' },
            },
          },
        });
      } else {
        jobCard = await db.jobCard.findFirst({
          where: { jobCardNo: id },
          include: {
            customerPO: { include: { customer: true } },
            product: true,
            processFlowMaster: {
              include: {
                steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } },
              },
            },
            subJobCards: {
              include: {
                currentStage: true,
                movements: { include: { stage: true }, orderBy: { createdAt: 'asc' } },
              },
              orderBy: { subJobCardNo: 'asc' },
            },
          },
        });
      }
    } catch (err1: any) {
      console.error('findOne full include failed:', err1?.message || err1);
      try {
        if (isUuid) {
          jobCard = await db.jobCard.findUnique({
            where: { id },
            include: {
              customerPO: { include: { customer: true } },
              product: true,
              processFlowMaster: true,
              subJobCards: true,
            },
          });
        } else {
          jobCard = await db.jobCard.findFirst({
            where: { jobCardNo: id },
            include: {
              customerPO: { include: { customer: true } },
              product: true,
              processFlowMaster: true,
              subJobCards: true,
            },
          });
        }
      } catch (err2: any) {
        console.error('findOne simple include failed:', err2?.message || err2);
        try {
          jobCard = isUuid
            ? await db.jobCard.findUnique({ where: { id } })
            : await db.jobCard.findFirst({ where: { jobCardNo: id } });
        } catch (err3: any) {
          console.error('findOne plain query failed:', err3?.message || err3);
          throw new BadRequestException(`Database query error: ${err3?.message || 'Unknown Prisma error'}`);
        }
      }
    }

    if (!jobCard) {
      throw new NotFoundException(`Job Card with ID "${id}" not found`);
    }

    const sortedSubCards = [...((jobCard as any).subJobCards || [])].sort((a: any, b: any) => {
      const orderA = a.currentStage?.defaultOrder || 0;
      const orderB = b.currentStage?.defaultOrder || 0;
      return orderB - orderA;
    });
    const topSub = sortedSubCards[0];
    if (topSub && topSub.currentStage) {
      (jobCard as any).currentStageName = topSub.currentStage.name;
      (jobCard as any).currentStageIndex = Math.max(0, (topSub.currentStage.defaultOrder || 1) - 1);
    } else if (jobCard.status === JobCardStatus.COMPLETED) {
      (jobCard as any).currentStageName = '19. DISPATCH';
      (jobCard as any).currentStageIndex = 18;
    } else {
      (jobCard as any).currentStageName = '1. SHEARING';
      (jobCard as any).currentStageIndex = 0;
    }

    return jobCard;
  }

  async seedCloudDb() {
    try {
      const deps = await this.ensureDependencies();
      const seeded: string[] = [];

      const defaultCards = [
        { jobCardNo: 'JC001', customerCode: 'CUST-RF045', rfePartCode: 'D3625', customerPartNo: 'EV-900W-WP-TO247', priority: 'NORMAL', prodPnlQty: 40, custPnlQty: 160, totalPcbQty: 160, prodPnlAreaSqm: 50, custPnlAreaSqm: 45, autoLaunch: true },
        { jobCardNo: 'JC002', customerCode: 'CUST-RF045', rfePartCode: 'D3625', customerPartNo: 'EV-900W-WP-TO247', priority: 'HIGH', prodPnlQty: 80, custPnlQty: 320, totalPcbQty: 320, prodPnlAreaSqm: 100, custPnlAreaSqm: 90, autoLaunch: true },
        { jobCardNo: 'JC003', customerCode: 'CUST-RF045', rfePartCode: 'D3625', customerPartNo: 'EV-900W-WP-TO247', priority: 'URGENT', prodPnlQty: 20, custPnlQty: 80, totalPcbQty: 80, prodPnlAreaSqm: 25, custPnlAreaSqm: 22.5, autoLaunch: true },
        { jobCardNo: 'JC004', customerCode: 'CUST-RF045', rfePartCode: 'D3625', customerPartNo: 'EV-900W-WP-TO247', priority: 'NORMAL', prodPnlQty: 50, custPnlQty: 200, totalPcbQty: 200, prodPnlAreaSqm: 62.5, custPnlAreaSqm: 56.25, autoLaunch: true },
        { jobCardNo: 'JC005', customerCode: 'CUST-RF045', rfePartCode: 'D3625', customerPartNo: 'EV-900W-WP-TO247', priority: 'HIGH', prodPnlQty: 30, custPnlQty: 120, totalPcbQty: 120, prodPnlAreaSqm: 37.5, custPnlAreaSqm: 33.75, autoLaunch: true },
        { jobCardNo: 'JC006', customerCode: 'CUST-RF045', rfePartCode: 'D3625', customerPartNo: 'EV-900W-WP-TO247', priority: 'NORMAL', prodPnlQty: 60, custPnlQty: 240, totalPcbQty: 240, prodPnlAreaSqm: 75, custPnlAreaSqm: 67.5, autoLaunch: true },
        { jobCardNo: 'JC007', customerCode: 'CUST-RF045', rfePartCode: 'D3625', customerPartNo: 'EV-900W-WP-TO247', priority: 'NORMAL', prodPnlQty: 45, custPnlQty: 180, totalPcbQty: 180, prodPnlAreaSqm: 56.25, custPnlAreaSqm: 50.62, autoLaunch: true },
        { jobCardNo: 'JC008', customerCode: 'CUST-RF045', rfePartCode: 'D3625', customerPartNo: 'EV-900W-WP-TO247', priority: 'HIGH', prodPnlQty: 70, custPnlQty: 280, totalPcbQty: 280, prodPnlAreaSqm: 87.5, custPnlAreaSqm: 78.75, autoLaunch: true },
        { jobCardNo: 'JC009', customerCode: 'CUST-RF045', rfePartCode: 'D3625', customerPartNo: 'EV-900W-WP-TO247', priority: 'URGENT', prodPnlQty: 25, custPnlQty: 100, totalPcbQty: 100, prodPnlAreaSqm: 31.25, custPnlAreaSqm: 28.12, autoLaunch: true },
        { jobCardNo: '26-27-0010', customerCode: 'CUST-RF045', rfePartCode: 'D3625', customerPartNo: 'EV-900W-WP-TO247', priority: 'NORMAL', prodPnlQty: 100, custPnlQty: 400, totalPcbQty: 400, prodPnlAreaSqm: 125, custPnlAreaSqm: 112.5, autoLaunch: true },
        { jobCardNo: '26-27-0011', customerCode: 'CUST-RF045', rfePartCode: 'D3625', customerPartNo: 'EV-900W-WP-TO247', priority: 'NORMAL', prodPnlQty: 40, custPnlQty: 160, totalPcbQty: 160, prodPnlAreaSqm: 50, custPnlAreaSqm: 45, autoLaunch: false },
        { jobCardNo: '26-27-0012', customerCode: 'CUST-RF045', rfePartCode: 'D3625', customerPartNo: 'EV-900W-WP-TO247', priority: 'NORMAL', prodPnlQty: 60, custPnlQty: 240, totalPcbQty: 240, prodPnlAreaSqm: 75, custPnlAreaSqm: 67.5, autoLaunch: false },
      ];

      for (const cardData of defaultCards) {
        try {
          await this.createJobCard(cardData, deps.defaultUser.id);
          seeded.push(cardData.jobCardNo);
        } catch (err: any) {
          console.error(`Seed card ${cardData.jobCardNo} failed:`, err?.message);
        }
      }

      const allCards = await this.prisma.jobCard.findMany({
        include: {
          customerPO: { include: { customer: true } },
          product: true,
          processFlowMaster: true,
          subJobCards: { include: { currentStage: true }, orderBy: { subJobCardNo: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return allCards;
    } catch (error: any) {
      console.error('seedCloudDb error:', error);
      return {
        success: false,
        error: error?.message || String(error),
        stack: error?.stack,
      };
    }
  }

  async splitJobCard(id: string, splitsInput: any, createdById: string) {
    if (!createdById) {
      const defaultUser = await this.prisma.user.findFirst();
      createdById = defaultUser?.id || '';
    }
    const jobCard = await this.findOne(id);

    if (jobCard.status !== JobCardStatus.CREATED && jobCard.status !== JobCardStatus.NOT_LAUNCHED) {
      throw new BadRequestException(`Cannot split Job Card that is already in status "${jobCard.status}". Splits can only occur before production launch.`);
    }

    // Normalize splits payload format ({ splits: [...] }, { quantities: [...] }, or raw Array)
    let rawSplits: any[] = [];
    if (Array.isArray(splitsInput)) {
      rawSplits = splitsInput;
    } else if (splitsInput && Array.isArray(splitsInput.splits)) {
      rawSplits = splitsInput.splits;
    } else if (splitsInput && Array.isArray(splitsInput.quantities)) {
      rawSplits = splitsInput.quantities;
    }

    const splits = rawSplits.map((item) => {
      if (typeof item === 'number') return { qty: item };
      if (typeof item === 'string') return { qty: parseInt(item, 10) || 0 };
      if (item && typeof item.qty !== 'undefined') return { qty: Number(item.qty) };
      return { qty: 0 };
    });

    if (!splits || splits.length === 0) {
      throw new BadRequestException('splits array is required and cannot be empty');
    }

    let totalSplitQty = 0;
    for (const split of splits) {
      const qty = Number(split.qty);
      if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        throw new BadRequestException('Each split quantity must be a positive integer');
      }
      totalSplitQty += qty;
    }

    if (totalSplitQty !== jobCard.totalQty) {
      throw new BadRequestException(
        `Quantity sum of Sub Job Cards (${totalSplitQty}) must equal total Job Card quantity (${jobCard.totalQty})`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete any pre-existing unlaunched sub-job cards for this parent
      await tx.subJobCard.deleteMany({
        where: { jobCardId: id, status: SubJobCardStatus.PENDING_LAUNCH },
      });

      const createdSubCards = [];
      for (let i = 0; i < splits.length; i++) {
        const subJobCardNo = `${jobCard.jobCardNo}-${i + 1}`;
        const qrCodeValue = `RFE-SJC-${subJobCardNo}-${Date.now().toString().slice(-4)}`;
        const subQty = Number(splits[i].qty);
        const ratio = jobCard.totalQty > 0 ? subQty / jobCard.totalQty : 1;

        const subCard = await tx.subJobCard.create({
          data: {
            subJobCardNo,
            jobCardId: id,
            qty: subQty,
            prodPnlQty: subQty,
            totalPcbQty: jobCard.totalPcbQty ? Math.round(jobCard.totalPcbQty * ratio) : null,
            prodPnlAreaSqm: jobCard.prodPnlAreaSqm ? Number((jobCard.prodPnlAreaSqm * ratio).toFixed(2)) : null,
            custPnlAreaSqm: jobCard.custPnlAreaSqm ? Number((jobCard.custPnlAreaSqm * ratio).toFixed(2)) : null,
            status: SubJobCardStatus.PENDING_LAUNCH,
            qrCodeValue,
            createdById,
          },
        });
        createdSubCards.push(subCard);
      }

      return id;
    });

    return this.findOne(id);
  }

  private async ensureDependencies() {
    let superAdminRole = await this.prisma.role.findFirst({
      where: { name: RoleCode.SUPER_ADMIN },
    }).catch(() => null);

    if (!superAdminRole) {
      superAdminRole = await this.prisma.role.findFirst().catch(() => null);
    }

    if (!superAdminRole) {
      try {
        superAdminRole = await this.prisma.role.create({
          data: { name: RoleCode.SUPER_ADMIN, description: 'Super Administrator' },
        });
      } catch (e) {
        superAdminRole = await this.prisma.role.findFirst().catch(() => null);
      }
    }

    let defaultUser = await this.prisma.user.findFirst().catch(() => null);
    if (!defaultUser && superAdminRole) {
      try {
        defaultUser = await this.prisma.user.create({
          data: {
            name: 'System Admin',
            email: 'admin@rfelectro.com',
            passwordHash: 'dummy_hash',
            roleId: superAdminRole.id,
          },
        });
      } catch (e) {
        defaultUser = await this.prisma.user.findFirst().catch(() => null);
      }
    }

    if (!defaultUser) {
      throw new BadRequestException('System initialization error: Could not find or create default User account.');
    }

    // Ensure standard 20 process stages exist matching PF-OI Standard Flow
    let stages = await this.prisma.processStage.findMany({ orderBy: { defaultOrder: 'asc' } });
    const defaultStageList = [
      { name: '1. SHEARING',       code: 'SHR',      order: 1  },
      { name: '2. DRILLING',       code: 'DRL',      order: 2  },
      { name: '3. DRL-QC',         code: 'DRL-QC',   order: 3  },
      { name: '4. DML',            code: 'DML',      order: 4  },
      { name: '5. PIT',            code: 'PIT',      order: 5  },
      { name: '6. PIT-QC',         code: 'PIT-QC',   order: 6  },
      { name: '7. PLATING',        code: 'PLT',      order: 7  },
      { name: '8. ETCHING',        code: 'ETC',      order: 8  },
      { name: '9. PREMASK-QC/AOI', code: 'PM-QC',    order: 9  },
      { name: '10. PISM',          code: 'PISM',     order: 10 },
      { name: '11. PISM-QC',       code: 'PISM-QC',  order: 11 },
      { name: '12. HASL',          code: 'HASL',     order: 12 },
      { name: '13. HASL-QC',       code: 'HASL-QC',  order: 13 },
      { name: '14. LEGEND PRINT',  code: 'LGD',      order: 14 },
      { name: '15. ROUTING',       code: 'RTE',      order: 15 },
      { name: '16. VG',            code: 'VG',       order: 16 },
      { name: '17. BBT',           code: 'BBT',      order: 17 },
      { name: '18. FQC (AI)',       code: 'FQC',      order: 18 },
      { name: '19. PDI-AQL',       code: 'PDI',      order: 19 },
      { name: '20. PACKING',       code: 'PKG',      order: 20 },
    ];

    for (const item of defaultStageList) {
      const existingByName = stages.find((s) => s.name.toLowerCase() === item.name.toLowerCase());
      if (existingByName) {
        if (existingByName.defaultOrder !== item.order || existingByName.code !== item.code || existingByName.name !== item.name) {
          await this.prisma.processStage.update({
            where: { id: existingByName.id },
            data: { name: item.name, defaultOrder: item.order, code: item.code },
          }).catch(() => {});
        }
      } else {
        const existingByOrder = stages.find((s) => s.defaultOrder === item.order);
        if (existingByOrder) {
          await this.prisma.processStage.update({
            where: { id: existingByOrder.id },
            data: { name: item.name, defaultOrder: item.order, code: item.code },
          }).catch(() => {});
        } else {
          await this.prisma.processStage.create({
            data: {
              code: item.code,
              name: item.name,
              defaultOrder: item.order,
              description: `${item.name} Stage`,
            },
          }).catch(() => {});
        }
      }
    }

    // ── Cleanup: delete obsolete stage records no longer in the canonical list ──
    // (e.g. old PTH, PHOTO PRINTING, PATTERN PLATING, SOLDER MASK, DISPATCH, etc.)
    const canonicalNames = defaultStageList.map((s) => s.name.toLowerCase());
    const canonicalCodes = defaultStageList.map((s) => s.code.toLowerCase());
    const allCurrentStages = await this.prisma.processStage.findMany({});
    for (const stg of allCurrentStages) {
      const nameMatch = canonicalNames.includes(stg.name.toLowerCase());
      const codeMatch = canonicalCodes.includes(stg.code.toLowerCase());
      if (!nameMatch && !codeMatch) {
        // Check if any sub-job-card is currently at this stage — if so, migrate it
        const inUseBySubCard = await this.prisma.subJobCard.findFirst({
          where: { currentStageId: stg.id },
          select: { id: true, totalPcbQty: true },
        });
        if (inUseBySubCard) {
          // Find the canonical stage with the same order number
          const replacementStage = await this.prisma.processStage.findFirst({
            where: { defaultOrder: stg.defaultOrder, id: { not: stg.id } },
          });
          if (replacementStage) {
            await this.prisma.subJobCard.updateMany({
              where: { currentStageId: stg.id },
              data: { currentStageId: replacementStage.id },
            }).catch(() => {});
          }
        }
        // Safe to delete now
        await this.prisma.processStage.delete({ where: { id: stg.id } }).catch(() => {});
      }
    }

    stages = await this.prisma.processStage.findMany({ orderBy: { defaultOrder: 'asc' } });

    let processFlow = await this.prisma.processFlowMaster.findFirst({
      where: { isActive: true },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    // Always create or ensure flow master exists
    if (!processFlow) {
      processFlow = await this.prisma.processFlowMaster.create({
        data: {
          name: 'PF-01 Standard Flow',
          totalSteps: stages.length,
          createdById: defaultUser.id,
        },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      });
    }

    // ── ALWAYS sync processFlowMaster steps to exactly match the 20 canonical stages ──
    // This fixes the critical bug where old 19-step flows caused early COMPLETED
    if (stages.length > 0) {
      // Upsert all canonical steps in correct order
      for (let i = 0; i < stages.length; i++) {
        await this.prisma.processFlowStep.upsert({
          where: {
            processFlowMasterId_stepOrder: {
              processFlowMasterId: processFlow.id,
              stepOrder: i + 1,
            },
          },
          update: { stageId: stages[i].id },
          create: {
            processFlowMasterId: processFlow.id,
            stageId: stages[i].id,
            stepOrder: i + 1,
          },
        }).catch(() => {});
      }

      // Delete any extra steps beyond canonical count (e.g. leftover step 20 from old 19-step flow)
      await this.prisma.processFlowStep.deleteMany({
        where: {
          processFlowMasterId: processFlow.id,
          stepOrder: { gt: stages.length },
        },
      }).catch(() => {});

      // Ensure totalSteps is always accurate
      await this.prisma.processFlowMaster.update({
        where: { id: processFlow.id },
        data: { totalSteps: stages.length },
      }).catch(() => {});

      processFlow = await this.prisma.processFlowMaster.findUnique({
        where: { id: processFlow.id },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      }) || processFlow;
    }

    let customer = await this.prisma.customer.findFirst();
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          companyName: 'Apex Electronics Ltd',
          code: 'CUST-RF045',
          contactPerson: 'John Manager',
          email: 'contact@apexelectronics.com',
          phone: '9876543210',
        },
      });
    }

    let product = await this.prisma.product.findFirst();
    if (!product) {
      product = await this.prisma.product.create({
        data: {
          specCardNo: 'D3625',
          revisionNo: 'Rev-00',
          name: 'Main Motherboard V2',
          code: 'EV-900W-WP-TO247',
          customerId: customer.id,
          pcbSize: '100x150mm',
          layers: 4,
          thicknessMm: 1.6,
          copperWeight: '1oz',
          solderMask: 'Green',
          legend: 'White',
          surfaceFinish: 'HASL',
          processFlowId: processFlow.id,
          createdById: defaultUser.id,
        },
      });
    }

    let customerPO = await this.prisma.customerPO.findFirst();
    if (!customerPO) {
      customerPO = await this.prisma.customerPO.create({
        data: {
          poNo: `PO-2026-${Date.now().toString().slice(-4)}`,
          customerId: customer.id,
          productId: product.id,
          orderQty: 1000,
          poDate: new Date(),
          expectedDeliveryDate: new Date(Date.now() + 7 * 86400000),
          createdById: defaultUser.id,
        },
      });
    }

    return {
      defaultUser,
      processFlow,
      customer,
      product,
      customerPO,
    };
  }

  async createJobCard(data: any, createdById: string) {
    const deps = await this.ensureDependencies();
    
    let validUser = null;
    if (createdById) {
      validUser = await this.prisma.user.findUnique({ where: { id: createdById } }).catch(() => null);
    }
    const finalUserId = validUser ? validUser.id : deps.defaultUser.id;

    // Generate sequential jobCardNo if not provided
    let jobCardNo = data.jobCardNo;
    if (!jobCardNo) {
      const lastJc = await this.prisma.jobCard.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      let nextNum = 1;
      if (lastJc && lastJc.jobCardNo) {
        const match = lastJc.jobCardNo.match(/\d+$/);
        if (match) {
          const parsed = parseInt(match[0], 10);
          if (!isNaN(parsed)) {
            nextNum = parsed + 1;
          }
        }
      }
      jobCardNo = `26-27-${String(nextNum).padStart(4, '0')}`;
    }

    const qrCodeValue = `RFE-JC-${jobCardNo}-${Date.now().toString().slice(-4)}`;

    // Find default process flow
    let processFlow = await this.prisma.processFlowMaster.findFirst({
      where: { isActive: true },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!processFlow) {
      processFlow = deps.processFlow;
    }

    // Find or create customer based on customerCode
    let customer: any = null;
    if (data.customerCode && String(data.customerCode).trim()) {
      const code = String(data.customerCode).trim();
      customer = await this.prisma.customer.findFirst({
        where: {
          OR: [
            { code: code },
            { companyName: code },
          ],
        },
      });

      if (!customer) {
        try {
          customer = await this.prisma.customer.create({
            data: {
              code: code,
              companyName: data.customerName || code,
              contactPerson: code,
              email: `${code.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}@customer.com`,
              isActive: true,
            },
          });
        } catch {
          customer = await this.prisma.customer.findFirst({
            where: {
              OR: [{ code: code }, { companyName: code }],
            },
          });
        }
      }
    }

    if (!customer) {
      customer = deps.customer;
    }

    let product = await this.prisma.product.findFirst({
      where: {
        OR: [
          ...(data.rfePartCode ? [{ specCardNo: data.rfePartCode }] : []),
          ...(data.customerPartNo ? [{ code: data.customerPartNo }] : []),
        ],
      },
    });

    if (!product && data.rfePartCode) {
      try {
        product = await this.prisma.product.create({
          data: {
            specCardNo: data.rfePartCode,
            name: data.customerPartNo || `Part ${data.rfePartCode}`,
            code: data.customerPartNo || data.rfePartCode,
            layers: Number(data.layers) || 2,
            thicknessMm: Number(data.thicknessMm) || 1.6,
            copperWeight: data.copperWeight || '1oz',
            surfaceFinish: data.surfaceFinish || 'HASL Lead-Free',
            solderMask: data.solderMask || 'Green',
            legend: data.legend || 'White',
            materialType: data.materialType || 'FR4',
            pcbSize: data.pcbSize || '100x100mm',
            processFlowId: processFlow.id,
            createdById: finalUserId,
          },
        });
      } catch (prodErr: any) {
        console.warn('Auto-create product for job card failed, falling back:', prodErr?.message);
        product = deps.product;
      }
    } else if (product && (data.layers || data.thicknessMm || data.copperWeight || data.surfaceFinish)) {
      try {
        product = await this.prisma.product.update({
          where: { id: product.id },
          data: {
            ...(data.layers ? { layers: Number(data.layers) } : {}),
            ...(data.thicknessMm ? { thicknessMm: Number(data.thicknessMm) } : {}),
            ...(data.copperWeight ? { copperWeight: String(data.copperWeight) } : {}),
            ...(data.surfaceFinish ? { surfaceFinish: String(data.surfaceFinish) } : {}),
            ...(data.solderMask ? { solderMask: String(data.solderMask) } : {}),
            ...(data.materialType ? { materialType: String(data.materialType) } : {}),
          },
        });
      } catch (updErr: any) {
        console.warn('Update product specs failed:', updErr?.message);
      }
    }

    if (!product) {
      product = deps.product;
    }

    let customerPO: any = null;
    if (data.customerPoNo && String(data.customerPoNo).trim()) {
      customerPO = await this.prisma.customerPO.findFirst({
        where: { poNo: String(data.customerPoNo).trim() },
      });
    }

    if (!customerPO && customer && customer.id !== deps.customer?.id) {
      const generatedPoNo = data.customerPoNo || `PO-${customer.code || customer.companyName}-${jobCardNo.replace(/[^0-9]/g, '').slice(-4) || '001'}`;
      try {
        customerPO = await this.prisma.customerPO.create({
          data: {
            poNo: generatedPoNo,
            customerId: customer.id,
            productId: product ? product.id : deps.product.id,
            orderQty: Number(data.totalPcbQty) || 100,
            poDate: new Date(),
            expectedDeliveryDate: data.targetDate ? new Date(data.targetDate) : new Date(Date.now() + 7 * 86400000),
            createdById: finalUserId,
          },
        });
      } catch {
        customerPO = await this.prisma.customerPO.findFirst({
          where: { customerId: customer.id },
        });
      }
    }

    if (!customerPO) {
      customerPO = deps.customerPO;
    }

    const createdJobCard = await this.prisma.$transaction(async (tx) => {
      const fallbackPo = customerPO || deps.customerPO;
      const fallbackProduct = product || deps.product;
      const fallbackFlow = processFlow || deps.processFlow;

      const existingJc = await tx.jobCard.findFirst({
        where: { jobCardNo },
      });
      if (existingJc) {
        return existingJc;
      }

      const jobCard = await tx.jobCard.create({
        data: {
          jobCardNo,
          customerPoId: fallbackPo.id,
          productId: fallbackProduct.id,
          processFlowMasterId: fallbackFlow.id,
          totalQty: Number(data.prodPnlQty) || 40,
          photoUrl: data.photoUrl || null,
          customerPartNo: data.customerPartNo || '',
          rfePartCode: data.rfePartCode || '',
          customerCode: data.customerCode || '',
          targetDate: data.targetDate ? new Date(data.targetDate) : null,
          priority: data.priority || 'NORMAL',
          prodPnlQty: Number(data.prodPnlQty) || 40,
          custPnlQty: Number(data.custPnlQty) || 80,
          totalPcbQty: Number(data.totalPcbQty) || 160,
          prodPnlAreaSqm: Number(data.prodPnlAreaSqm) || 50,
          custPnlAreaSqm: Number(data.custPnlAreaSqm) || 45,
          status: data.autoLaunch ? JobCardStatus.IN_PROGRESS : JobCardStatus.CREATED,
          launchedAt: data.autoLaunch ? new Date() : null,
          qrCodeValue,
          createdById: finalUserId,
        },
        include: {
          customerPO: { include: { customer: true } },
          product: true,
          processFlowMaster: true,
          subJobCards: true,
        },
      });

      let initialStageId: string | null = null;
      if (data.autoLaunch && processFlow?.steps?.[0]?.stageId) {
        const candidateStageId = processFlow.steps[0].stageId;
        const validStage = await tx.processStage.findUnique({ where: { id: candidateStageId } });
        if (validStage) {
          initialStageId = validStage.id;
        }
      }

      const totalMasterPcb = Number(data.totalPcbQty) || 160;
      const rawSplits = Array.isArray(data.splits) ? data.splits : [];
      if (rawSplits.length > 0) {
        for (let i = 0; i < rawSplits.length; i++) {
          const subQty = Number(typeof rawSplits[i] === 'object' ? rawSplits[i].qty : rawSplits[i]);
          const subJobCardNo = `${jobCardNo}-${i + 1}`;
          const ratio = totalMasterPcb > 0 ? subQty / totalMasterPcb : 1;

          const existingSub = await tx.subJobCard.findFirst({ where: { subJobCardNo } });
          if (!existingSub) {
            await tx.subJobCard.create({
              data: {
                subJobCardNo,
                jobCardId: jobCard.id,
                qty: subQty,
                totalPcbQty: subQty,
                custPnlQty: subQty,
                prodPnlQty: Math.ceil(subQty / 4),
                prodPnlAreaSqm: data.prodPnlAreaSqm ? Number((Number(data.prodPnlAreaSqm) * ratio).toFixed(2)) : null,
                custPnlAreaSqm: data.custPnlAreaSqm ? Number((Number(data.custPnlAreaSqm) * ratio).toFixed(2)) : null,
                status: data.autoLaunch ? SubJobCardStatus.IN_STAGE : SubJobCardStatus.PENDING_LAUNCH,
                currentStageId: initialStageId,
                qrCodeValue: `RFE-SJC-${subJobCardNo}-${Date.now().toString().slice(-4)}`,
                createdById: finalUserId,
              },
            });
          }
        }
      } else {
        // Auto create 1 sub job card for full lot (matching exact jobCardNo)
        const subJobCardNo = jobCardNo;
        const existingSub = await tx.subJobCard.findFirst({ where: { subJobCardNo, jobCardId: jobCard.id } });
        if (!existingSub) {
          await tx.subJobCard.create({
            data: {
              subJobCardNo,
              jobCardId: jobCard.id,
              qty: totalMasterPcb,
              totalPcbQty: totalMasterPcb,
              custPnlQty: totalMasterPcb,
              prodPnlQty: Number(data.prodPnlQty) || Math.ceil(totalMasterPcb / 4),
              prodPnlAreaSqm: Number(data.prodPnlAreaSqm) || 50,
              custPnlAreaSqm: Number(data.custPnlAreaSqm) || 45,
              status: data.autoLaunch ? SubJobCardStatus.IN_STAGE : SubJobCardStatus.PENDING_LAUNCH,
              currentStageId: initialStageId,
              qrCodeValue: `RFE-SJC-${subJobCardNo}-${Date.now().toString().slice(-4)}`,
              createdById: finalUserId,
            },
          });
        }
      }

      return jobCard;
    });

    return createdJobCard;
  }

  async updateJobCard(id: string, data: any) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const where: any = isUuid ? { OR: [{ id }, { jobCardNo: id }] } : { jobCardNo: id };

    const existing = await this.prisma.jobCard.findFirst({ where });

    if (!existing) {
      return this.createJobCard(data, '');
    }

    await this.prisma.jobCard.update({
      where: { id: existing.id },
      data: {
        customerPartNo: data.customerPartNo ?? existing.customerPartNo,
        rfePartCode: data.rfePartCode ?? existing.rfePartCode,
        customerCode: data.customerCode ?? existing.customerCode,
        priority: data.priority ?? existing.priority,
        totalPcbQty: Number(data.totalPcbQty) || existing.totalPcbQty,
        prodPnlQty: Number(data.prodPnlQty) || existing.prodPnlQty,
        custPnlQty: Number(data.custPnlQty) || existing.custPnlQty,
        prodPnlAreaSqm: Number(data.prodPnlAreaSqm) || existing.prodPnlAreaSqm,
        custPnlAreaSqm: Number(data.custPnlAreaSqm) || existing.custPnlAreaSqm,
        status: data.status ? (data.status === 'UNLAUNCHED' ? JobCardStatus.CREATED : data.status) : existing.status,
      },
    });

    return this.findOne(existing.id);
  }

  async launchJobCard(id: string) {
    let jobCard: any = null;
    try {
      jobCard = await this.findOne(id);
    } catch (e) {
      const existing = await this.prisma.jobCard.findFirst({
        where: { OR: [{ id }, { jobCardNo: id }] },
        include: {
          customerPO: { include: { customer: true } },
          product: true,
          processFlowMaster: { include: { steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } } } },
          subJobCards: { include: { currentStage: true } },
        },
      });
      if (!existing) {
        // Fallback: check if id is a SubJobCard ID or SubJobCardNo
        const subCard = await this.prisma.subJobCard.findFirst({
          where: { OR: [{ id }, { subJobCardNo: id }] },
          include: {
            jobCard: {
              include: {
                customerPO: { include: { customer: true } },
                product: true,
                processFlowMaster: { include: { steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } } } },
                subJobCards: { include: { currentStage: true } },
              },
            },
          },
        });
        if (subCard?.jobCard) {
          jobCard = subCard.jobCard;
        } else {
          throw new NotFoundException(`Job Card with ID or Number "${id}" not found`);
        }
      } else {
        jobCard = existing;
      }
    }

    const realJobCardId = jobCard.id;
    let firstStageId = jobCard.processFlowMaster?.steps?.[0]?.stageId || null;

    if (!firstStageId) {
      const shearingStage = await this.prisma.processStage.findFirst({
        where: { OR: [{ name: { contains: 'SHEARING', mode: 'insensitive' } }, { code: 'SHEARING' }] },
      });
      if (shearingStage) {
        firstStageId = shearingStage.id;
      } else {
        const firstStage = await this.prisma.processStage.findFirst({ orderBy: { defaultOrder: 'asc' } });
        if (firstStage) firstStageId = firstStage.id;
      }
    }

    if (!firstStageId) {
      const createdStage = await this.prisma.processStage.create({
        data: {
          code: 'SHEARING',
          name: '1. SHEARING',
          defaultOrder: 1,
        },
      });
      firstStageId = createdStage.id;
    }

    return this.prisma.$transaction(async (tx) => {
      if (!jobCard.subJobCards || jobCard.subJobCards.length === 0) {
        // Auto-create 1 single sub-job card for the full quantity
        const subJobCardNo = `${jobCard.jobCardNo}-1`;
        const qrCodeValue = `RFE-SJC-${subJobCardNo}-${Date.now().toString().slice(-4)}`;
        const fullPcbQty = jobCard.totalPcbQty || jobCard.totalQty || 160;

        await tx.subJobCard.create({
          data: {
            subJobCardNo,
            jobCardId: realJobCardId,
            qty: fullPcbQty,
            totalPcbQty: fullPcbQty,
            custPnlQty: fullPcbQty,
            prodPnlQty: jobCard.prodPnlQty || Math.ceil(fullPcbQty / 4),
            status: SubJobCardStatus.IN_STAGE,
            currentStageId: firstStageId,
            qrCodeValue,
            createdById: jobCard.createdById,
          },
        });
      } else {
        // Move all pending sub job cards to IN_STAGE at stage 1
        await tx.subJobCard.updateMany({
          where: { jobCardId: realJobCardId },
          data: {
            status: SubJobCardStatus.IN_STAGE,
            currentStageId: firstStageId,
          },
        });
      }

      const updated = await tx.jobCard.update({
        where: { id: realJobCardId },
        data: {
          status: JobCardStatus.IN_PROGRESS,
          launchedAt: new Date(),
        },
        include: {
          customerPO: { include: { customer: true } },
          product: true,
          processFlowMaster: true,
          subJobCards: { include: { currentStage: true }, orderBy: { subJobCardNo: 'asc' } },
        },
      });

      return updated;
    });
  }

  async updateStatus(id: string, status: JobCardStatus) {
    const jobCard = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (status === JobCardStatus.COMPLETED) {
        await tx.subJobCard.updateMany({
          where: { jobCardId: jobCard.id },
          data: {
            status: SubJobCardStatus.COMPLETED,
            currentStageId: null,
          },
        });
        return tx.jobCard.update({
          where: { id: jobCard.id },
          data: {
            status: JobCardStatus.COMPLETED,
            completedAt: new Date(),
          },
          include: {
            customerPO: { include: { customer: true } },
            product: true,
            subJobCards: { include: { currentStage: true }, orderBy: { subJobCardNo: 'asc' } },
          },
        });
      } else {
        return tx.jobCard.update({
          where: { id: jobCard.id },
          data: { status },
          include: {
            customerPO: { include: { customer: true } },
            product: true,
            subJobCards: { include: { currentStage: true }, orderBy: { subJobCardNo: 'asc' } },
          },
        });
      }
    });
  }


  async getQrCodeImage(id: string) {
    const jobCard = await this.findOne(id);

    const payload = {
      type: 'JOB_CARD',
      id: jobCard.id,
      jobCardNo: jobCard.jobCardNo,
      productCode: jobCard.product.code,
      totalQty: jobCard.totalQty,
      qrCodeValue: jobCard.qrCodeValue,
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
      id: jobCard.id,
      jobCardNo: jobCard.jobCardNo,
      qrCodeValue: jobCard.qrCodeValue,
      dataUrl,
      payload,
    };
  }

  async getTraceabilityHistory(id: string, user: any) {
    const rawId = (id || '').trim();
    const cleanNo = rawId.replace(/^jc-/, '');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);

    let jobCard: any = null;
    if (isUuid) {
      jobCard = await this.prisma.jobCard.findUnique({
        where: { id: rawId },
        include: { subJobCards: { include: { currentStage: true } } },
      }).catch(() => null);
    }
    if (!jobCard) {
      jobCard = await this.prisma.jobCard.findFirst({
        where: {
          OR: [
            { jobCardNo: rawId },
            { jobCardNo: cleanNo },
            { jobCardNo: { contains: cleanNo } },
            ...(isUuid ? [{ id: rawId }] : []),
          ],
        },
        include: { subJobCards: { include: { currentStage: true } } },
      }).catch(() => null);
    }

    if (!jobCard) {
      const subCard = await this.prisma.subJobCard.findFirst({
        where: {
          OR: [
            { subJobCardNo: rawId },
            { subJobCardNo: cleanNo },
            ...(isUuid ? [{ id: rawId }] : []),
          ],
        },
        include: { jobCard: { include: { subJobCards: { include: { currentStage: true } } } } },
      }).catch(() => null);
      if (subCard && subCard.jobCard) {
        jobCard = subCard.jobCard;
      }
    }

    if (!jobCard) {
      return [];
    }

    const subJobCardIds = (jobCard.subJobCards || []).map((s: any) => s.id).filter(Boolean);

    let logs = await this.prisma.stageMovementLog.findMany({
      where: {
        OR: [
          { subJobCard: { jobCardId: jobCard.id } },
          ...(subJobCardIds.length > 0 ? [{ subJobCardId: { in: subJobCardIds } }] : []),
          { remarks: { contains: jobCard.jobCardNo } },
        ],
      },
      include: {
        stage: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: { select: { name: true } } },
        },
        subJobCard: {
          select: { id: true, subJobCardNo: true, currentStageId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedLogs: any[] = logs.map((l) => ({
      ...l,
      subJobCard: {
        ...l.subJobCard,
        subJobCardNo: jobCard.jobCardNo, // Keep exact same Job Card number
      },
    }));

    // 1. If Job Card is COMPLETED, prepend a Final Completion Log entry
    if (jobCard.status === JobCardStatus.COMPLETED) {
      formattedLogs.unshift({
        id: `completed-summary-${jobCard.id}`,
        createdAt: jobCard.completedAt || jobCard.updatedAt || new Date(),
        subJobCard: { subJobCardNo: jobCard.jobCardNo },
        stage: { name: '19. DISPATCH (COMPLETED)' },
        qtyForwarded: jobCard.totalPcbQty || jobCard.totalQty || 160,
        qtyProcessed: jobCard.totalPcbQty || jobCard.totalQty || 160,
        qtyRejected: 0,
        remarkType: 'JOB_COMPLETED',
        remarks: `🎉 JOB CARD COMPLETED: Manufacturing workflow finished successfully and released for dispatch (${jobCard.totalPcbQty || 160} PCBs)`,
        createdBy: { name: 'Production Floor / Admin' },
      });
    }

    // 2. If no logs exist yet, provide Initial Launch Log entry
    if (formattedLogs.length === 0) {
      formattedLogs.push({
        id: `initial-launch-${jobCard.id}`,
        createdAt: jobCard.launchedAt || jobCard.createdAt || new Date(),
        subJobCard: { subJobCardNo: jobCard.jobCardNo },
        stage: { name: '1. SHEARING (INITIAL LAUNCH)' },
        qtyForwarded: jobCard.totalPcbQty || jobCard.totalQty || 160,
        qtyProcessed: jobCard.totalPcbQty || jobCard.totalQty || 160,
        qtyRejected: 0,
        remarkType: 'INITIAL_LAUNCH',
        remarks: `🚀 Job Card Launched into Stage 1 (1. SHEARING) Production Flow`,
        createdBy: { name: 'Production Planner' },
      });
    }

    return this.filterLogsForUser(formattedLogs, user);
  }

  private filterLogsForUser(logs: any[], user: any) {
    if (!user) return logs;
    const roleName = String(user.roleName || user.role || user.role?.name || '').toUpperCase();
    const isCustomer = roleName === 'CUSTOMER';

    if (isCustomer) {
      return logs.map((l: any) => ({
        ...l,
        createdBy: { id: 'hidden', name: 'Production Floor', email: 'hidden', role: { name: 'Staff' } },
      }));
    }

    return logs;
  }

  private validateUserStagePermission(user: any, currentStage: any) {
    if (!user) return; // If no auth context passed, bypass (or internal system call)

    const roleName = String(user.roleName || user.role || user.role?.name || '').toUpperCase();
    const isMasterOrSuper =
      roleName === 'MASTER' ||
      roleName === 'SUPER_ADMIN' ||
      roleName === 'SUPER_USER' ||
      roleName === 'PRODUCTION_PLANNER';

    if (isMasterOrSuper) {
      return; // Full access for Master & Super User
    }

    const isNormalUser = roleName === 'NORMAL_USER' || roleName === 'PROCESS_OPERATOR' || roleName === 'NORMAL';
    if (isNormalUser) {
      const userAssignedStageId = user.assignedStageId;
      const userAssignedStageName = String(user.assignedStageName || user.assignedStage?.name || '').toLowerCase();
      const currentStageId = currentStage?.id;
      const currentStageName = String(currentStage?.name || '').toLowerCase();
      const allowedStages: string[] = Array.isArray(user.allowedStages)
        ? user.allowedStages.map((s: string) => s.toLowerCase())
        : [];

      let isAllowed = false;
      if (userAssignedStageId && currentStageId && userAssignedStageId === currentStageId) {
        isAllowed = true;
      }
      if (userAssignedStageName && currentStageName && currentStageName.includes(userAssignedStageName)) {
        isAllowed = true;
      }
      if (userAssignedStageName && currentStageName && userAssignedStageName.includes(currentStageName)) {
        isAllowed = true;
      }
      if (allowedStages.length > 0 && (allowedStages.includes(currentStageId) || allowedStages.includes(currentStageName))) {
        isAllowed = true;
      }

      if (!isAllowed) {
        throw new ForbiddenException(
          `Forbidden (403): Normal User assigned to stage "${user.assignedStageName || user.assignedStageId || 'assigned stage'}" cannot operate or move jobs out of stage "${currentStage?.name || 'different stage'}". Direct API call rejected.`,
        );
      }
    }
  }

  async deleteJobCard(id: string, user: any) {
    const roleName = String(
      user?.roleName || user?.role || user?.role?.name || user?.roleCode || user?.role_name || ''
    ).toUpperCase();
    const isSuperAdminOrMaster =
      !user ||
      roleName.includes('SUPER') ||
      roleName.includes('MASTER') ||
      roleName.includes('ADMIN') ||
      roleName === 'SUPER_ADMIN' ||
      roleName === 'SUPER ADMIN' ||
      roleName === '';

    if (!isSuperAdminOrMaster) {
      throw new ForbiddenException(
        'Forbidden (403): Only Super Admin / Master role is authorized to delete Job Cards. Action rejected.'
      );
    }

    const rawId = String(id || '').trim();
    if (!rawId) {
      throw new BadRequestException('Job Card ID or number is required for deletion');
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);

    // 1. Search for JobCard directly by exact ID or exact jobCardNo
    const jcOr: any[] = [{ jobCardNo: rawId }];
    if (isUuid) {
      jcOr.push({ id: rawId });
    }

    let jobCard = await this.prisma.jobCard.findFirst({
      where: { OR: jcOr.filter(Boolean) },
      include: { subJobCards: true },
    });

    // 2. If not found, search subJobCard table by exact ID or exact subJobCardNo
    if (!jobCard) {
      const subOr: any[] = [{ subJobCardNo: rawId }];
      if (isUuid) {
        subOr.push({ id: rawId });
      }

      const subCard = await this.prisma.subJobCard.findFirst({
        where: { OR: subOr.filter(Boolean) },
        include: { jobCard: { include: { subJobCards: true } } },
      });

      if (subCard && subCard.jobCard) {
        jobCard = subCard.jobCard;
      }
    }

    if (!jobCard) {
      return {
        success: true,
        message: `Job Card "${rawId}" deleted or not present in database.`,
      };
    }

    const targetId = jobCard.id;

    await this.prisma.$transaction(async (tx) => {
      const subCardIds = (jobCard.subJobCards || []).map((s) => s.id);

      // 1. Delete associated dispatches
      await tx.dispatch.deleteMany({
        where: { jobCardId: targetId },
      }).catch(() => {});

      if (subCardIds.length > 0) {
        // 2. Delete stage movement logs
        await tx.stageMovementLog.deleteMany({
          where: { subJobCardId: { in: subCardIds } },
        });

        // 3. Null out parentSubJobCardId on subJobCards to avoid self-referential FK constraint blocks
        await tx.subJobCard.updateMany({
          where: { jobCardId: targetId },
          data: { parentSubJobCardId: null },
        });

        // 4. Delete all subJobCards for this job card
        await tx.subJobCard.deleteMany({
          where: { jobCardId: targetId },
        });
      }

      // 5. Delete master JobCard
      await tx.jobCard.delete({ where: { id: targetId } });
    });

    return {
      success: true,
      message: `Job Card ${jobCard.jobCardNo} deleted permanently from database.`,
    };
  }

  async clearAllJobCards() {
    await this.prisma.$transaction(async (tx) => {
      await tx.stageMovementLog.deleteMany({});
      await tx.dispatch.deleteMany({});
      await tx.subJobCard.updateMany({ data: { parentSubJobCardId: null } });
      await tx.subJobCard.deleteMany({});
      await tx.jobCard.deleteMany({});
    });
    return { success: true, message: 'All Job Cards cleared successfully' };
  }



  private async getNextProcessStage(currentStage: any, flowSteps?: any[]): Promise<{ targetNextStageId: string | null; isLastStage: boolean }> {
    // ── STRATEGY 1: Use actual ProcessFlowMaster steps (RELIABLE) ──
    // flowSteps comes from jobCard.processFlowMaster.steps (already sorted by stepOrder ASC)
    if (flowSteps && flowSteps.length > 0 && currentStage?.id) {
      const currentStepIdx = flowSteps.findIndex(
        (step: any) => step.stageId === currentStage.id || step.stage?.id === currentStage.id,
      );

      if (currentStepIdx !== -1) {
        if (currentStepIdx >= flowSteps.length - 1) {
          return { targetNextStageId: null, isLastStage: true };
        }
        const nextStep = flowSteps[currentStepIdx + 1];
        const nextStageId = nextStep.stageId || nextStep.stage?.id;
        return {
          targetNextStageId: nextStageId || null,
          isLastStage: false,
        };
      }
      // If current stage not found in flow steps, try name matching
      const currentStageName = String(currentStage?.name || '').trim().toLowerCase();
      const nameMatchIdx = flowSteps.findIndex(
        (step: any) => {
          const stepName = String(step.stage?.name || '').trim().toLowerCase();
          return stepName === currentStageName ||
            stepName.replace(/^\d+\.\s*/, '') === currentStageName.replace(/^\d+\.\s*/, '');
        },
      );
      if (nameMatchIdx !== -1) {
        if (nameMatchIdx >= flowSteps.length - 1) {
          return { targetNextStageId: null, isLastStage: true };
        }
        const nextStep = flowSteps[nameMatchIdx + 1];
        return {
          targetNextStageId: nextStep.stageId || nextStep.stage?.id || null,
          isLastStage: false,
        };
      }
    }

    // ── STRATEGY 2: Fallback to hardcoded PF-OI 20-stage list (only when flow steps unavailable) ──
    const pfList = [
      '1. SHEARING',
      '2. DRILLING',
      '3. DRL-QC',
      '4. DML',
      '5. PIT',
      '6. PIT-QC',
      '7. PLATING',
      '8. ETCHING',
      '9. PREMASK-QC/AOI',
      '10. PISM',
      '11. PISM-QC',
      '12. HASL',
      '13. HASL-QC',
      '14. LEGEND PRINT',
      '15. ROUTING',
      '16. VG',
      '17. BBT',
      '18. FQC (AI)',
      '19. PDI-AQL',
      '20. PACKING',
    ];

    const currentStageName = String(currentStage?.name || '').trim();
    const currentOrder = currentStage?.defaultOrder || 0;

    let currIdx = -1;
    // Match by full name first
    currIdx = pfList.findIndex((s) => s.toLowerCase() === currentStageName.toLowerCase());
    // Match by name without numeric prefix
    if (currIdx === -1) {
      currIdx = pfList.findIndex((s) => {
        const sClean = s.replace(/^\d+\.\s*/, '').toLowerCase();
        const cClean = currentStageName.replace(/^\d+\.\s*/, '').toLowerCase();
        return sClean === cClean;
      });
    }
    // Fuzzy keyword fallback for renamed stages (PIT↔PTH, etc.)
    if (currIdx === -1) {
      const cLower = currentStageName.toLowerCase().replace(/^\d+\.\s*/, '');
      const keywordMap: Array<{ keywords: string[]; idx: number }> = [
        { keywords: ['shear', 'cutting'], idx: 0 },
        { keywords: ['drill', 'drl'], idx: 1 },
        { keywords: ['drl-qc', 'drill-qc'], idx: 2 },
        { keywords: ['dml'], idx: 3 },
        { keywords: ['pit-qc', 'pth-qc'], idx: 5 },
        { keywords: ['pit', 'pth'], idx: 4 },
        { keywords: ['plating', 'pattern plat', 'photo print', 'photo'], idx: 6 },
        { keywords: ['etch'], idx: 7 },
        { keywords: ['premask', 'aoi', 'etching-qc', 'etching qc'], idx: 8 },
        { keywords: ['pism-qc', 'solder mask-qc', 'solder mask qc', 'sm-qc'], idx: 10 },
        { keywords: ['pism', 'solder mask', 'solder'], idx: 9 },
        { keywords: ['hasl-qc'], idx: 12 },
        { keywords: ['hasl', 'hal', 'enig'], idx: 11 },
        { keywords: ['legend'], idx: 13 },
        { keywords: ['routing', 'rout', 'punching', 'cnc'], idx: 14 },
        { keywords: ['vg', 'v-cut', 'vcut', 'v groove'], idx: 15 },
        { keywords: ['bbt', 'e-testing', 'e testing', 'bare board'], idx: 16 },
        { keywords: ['fqc', 'final qc', 'photo-qc', 'photo qc'], idx: 17 },
        { keywords: ['pdi', 'aql'], idx: 18 },
        { keywords: ['pack', 'dispatch'], idx: 19 },
      ];
      for (const entry of keywordMap) {
        if (entry.keywords.some((kw) => cLower.includes(kw))) {
          currIdx = entry.idx;
          break;
        }
      }
    }
    // Last resort: use defaultOrder if everything else failed
    if (currIdx === -1 && currentOrder >= 1 && currentOrder <= pfList.length) {
      currIdx = currentOrder - 1;
    }

    // currIdx still -1 means truly unknown stage — treat as first stage (don't COMPLETE!)
    if (currIdx === -1) {
      console.warn(`[JobCards] getNextProcessStage: Unknown stage "${currentStageName}" \u2014 defaulting to stage 1`);
      currIdx = 0;
    }

    if (currIdx >= pfList.length - 1) {
      return { targetNextStageId: null, isLastStage: true };
    }

    const nextOrder = currIdx + 2;
    const nextStageName = pfList[currIdx + 1];

    // Use name match first, then defaultOrder — NOT an OR that could match the wrong stage
    let nextStage = await this.prisma.processStage.findFirst({
      where: { name: nextStageName },
    });

    if (!nextStage) {
      nextStage = await this.prisma.processStage.findFirst({
        where: { defaultOrder: nextOrder },
      });
    }

    if (!nextStage) {
      nextStage = await this.prisma.processStage.create({
        data: {
          name: nextStageName,
          code: nextStageName.split(' ')[1] || 'STG',
          defaultOrder: nextOrder,
          description: `${nextStageName} Stage`,
        },
      }).catch(() => null);
    }

    return {
      targetNextStageId: nextStage?.id || null,
      isLastStage: false,
    };
  }

  async moveFull(id: string, body: { id?: string; cardId?: string; jobId?: string; jobCardNo?: string; subJobCardNo?: string; rejectPcbQty?: number; rejectQty?: number; remark?: string; remarkType?: string; status?: string } | any, user: any) {
    const cardId = (body?.cardId || body?.id || id || '').trim();
    const subJobCardNo = (body?.subJobCardNo || id || '').trim();
    const rawTarget = (id || body?.cardId || body?.id || body?.jobId || body?.subJobCardNo || body?.jobCardNo || '').trim();
    const searchNo = (body?.jobCardNo || rawTarget || '').trim();

    const isUuidTarget = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cardId) ||
                         /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawTarget);

    const subCardOr: any[] = [];
    if (isUuidTarget) {
      if (cardId) subCardOr.push({ id: cardId });
      if (rawTarget && rawTarget !== cardId) subCardOr.push({ id: rawTarget });
    }
    if (subJobCardNo) subCardOr.push({ subJobCardNo: subJobCardNo });
    if (rawTarget && rawTarget !== subJobCardNo && rawTarget !== searchNo) subCardOr.push({ subJobCardNo: rawTarget });
    if (searchNo && searchNo !== rawTarget) subCardOr.push({ subJobCardNo: searchNo });
    subCardOr.push({ qrCodeValue: rawTarget });

    // 1. Try finding target SubJobCard directly by ID, subJobCardNo, or QR code
    let subCard: any = subCardOr.length > 0 ? await this.prisma.subJobCard.findFirst({
      where: {
        OR: subCardOr.filter(Boolean),
      },
      include: {
        currentStage: true,
        jobCard: {
          include: {
            processFlowMaster: {
              include: { steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } } },
            },
          },
        },
      },
    }) : null;

    let jobCardId = subCard ? subCard.jobCardId : rawTarget;
    if (!subCard) {
      const jcOr: any[] = [
        { jobCardNo: rawTarget },
        { jobCardNo: searchNo },
      ];
      if (isUuidTarget) {
        jcOr.push({ id: rawTarget });
      }

      let jc: any = await this.prisma.jobCard.findFirst({
        where: {
          OR: jcOr.filter(Boolean),
        },
        include: {
          subJobCards: { include: { currentStage: true } },
          processFlowMaster: {
            include: { steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } } },
          },
        },
      });

      if (!jc && searchNo) {
        jc = await this.prisma.jobCard.findFirst({
          where: {
            jobCardNo: { contains: searchNo },
          },
          include: {
            subJobCards: { include: { currentStage: true } },
            processFlowMaster: {
              include: { steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } } },
            },
          },
        });
      }

      if (!jc) {
        throw new NotFoundException(`Job Card "${searchNo || rawTarget}" not found in database`);
      }

      if (jc) {
        jobCardId = jc.id;
        if (jc.subJobCards && jc.subJobCards.length > 0) {
          if (subJobCardNo) {
            subCard = jc.subJobCards.find((s: any) => s.subJobCardNo === subJobCardNo || s.subJobCardNo === searchNo);
          }
          if (!subCard && body?.currentStageName) {
            const targetStg = String(body.currentStageName).toLowerCase().replace(/^\d+\.\s*/, '').trim();
            subCard = jc.subJobCards.find((s: any) => {
              const currStg = String(s.currentStage?.name || '').toLowerCase().replace(/^\d+\.\s*/, '').trim();
              return currStg === targetStg || currStg.includes(targetStg) || targetStg.includes(currStg);
            });
          }
          if (!subCard) {
            subCard = jc.subJobCards[0] as any;
          }
        }
      }
    }

    if (!subCard) {
      throw new NotFoundException(`Job Card "${searchNo || rawTarget}" not found`);
    }

    if (body?.status === 'COMPLETED') {
      return this.updateStatus(jobCardId, JobCardStatus.COMPLETED);
    }

    // ENFORCE STAGE-WISE USER ACCESS RIGHT AT BACKEND / API LEVEL
    this.validateUserStagePermission(user, subCard.currentStage);

    let currentStage = subCard.currentStage;
    if (!currentStage && subCard.currentStageId) {
      currentStage = await this.prisma.processStage.findUnique({ where: { id: subCard.currentStageId } });
    }

    // Pass the actual process flow steps to determine correct next stage
    const flowSteps = subCard.jobCard?.processFlowMaster?.steps || [];
    const { targetNextStageId, isLastStage } = await this.getNextProcessStage(currentStage, flowSteps);

    const userId = user?.id || user?.sub || user?.userId || subCard.createdById;
    const rejectPcb = Math.max(0, Number(body.rejectPcbQty || body.rejectQty) || 0);
    const currentPcb = subCard.totalPcbQty || subCard.qty || 160;
    const currentArea = subCard.custPnlAreaSqm || subCard.prodPnlAreaSqm || 0;

    if (rejectPcb > currentPcb) {
      throw new BadRequestException(`Rejection PCB Qty (${rejectPcb}) cannot exceed current lot quantity (${currentPcb})`);
    }

    const movedPcb = currentPcb - rejectPcb;
    const unitArea = currentPcb > 0 ? currentArea / currentPcb : 0;
    const movedArea = Number((movedPcb * unitArea).toFixed(2));

    const rType = body.remarkType || (rejectPcb > 0 ? 'REJECTION' : (body.remark?.toLowerCase().includes('rework') ? 'REWORK' : body.remark?.toLowerCase().includes('process issue') ? 'PROCESS_ISSUE' : 'NONE'));
    const formattedRemarks = body.remark
      ? `[${rType}] ${body.remark}${rejectPcb > 0 ? ` (${rejectPcb} PCBs Rejected)` : ''}`
      : `[${rType}] Full Job Movement to next stage${rejectPcb > 0 ? ` (${rejectPcb} PCBs Rejected)` : ''}`;

    return this.prisma.$transaction(async (tx) => {
      // Create movement log
      await tx.stageMovementLog.create({
        data: {
          subJobCardId: subCard.id,
          stageId: subCard.currentStageId || targetNextStageId || '',
          qtyReceived: currentPcb,
          qtyProcessed: currentPcb,
          qtyForwarded: movedPcb,
          qtyRejected: rejectPcb,
          qtyHold: 0,
          remarks: formattedRemarks,
          createdById: userId,
        },
      });

      if (targetNextStageId && !isLastStage) {
        // AUTOMATIC LOT REUNIFICATION / MERGE:
        // Check if another sub-job-card of the SAME parent Job Card already exists at targetNextStageId
        const existingSubAtNextStage = await tx.subJobCard.findFirst({
          where: {
            jobCardId: subCard.jobCardId,
            currentStageId: targetNextStageId,
            id: { not: subCard.id },
            status: SubJobCardStatus.IN_STAGE,
          },
        });

        if (existingSubAtNextStage) {
          // Re-unite split lots: merge movedPcb and movedArea into the waiting sibling
          const mergedQty = (existingSubAtNextStage.totalPcbQty || existingSubAtNextStage.qty || 0) + movedPcb;
          const mergedArea = Number(((existingSubAtNextStage.custPnlAreaSqm || 0) + movedArea).toFixed(2));

          await tx.subJobCard.update({
            where: { id: existingSubAtNextStage.id },
            data: {
              qty: mergedQty,
              totalPcbQty: mergedQty,
              custPnlQty: mergedQty,
              prodPnlQty: Math.ceil(mergedQty / 4),
              custPnlAreaSqm: mergedArea,
              prodPnlAreaSqm: mergedArea,
              status: SubJobCardStatus.IN_STAGE,
            },
          });

          // Preserve complete traceability logs by linking them to the surviving unified sub-job-card
          await tx.stageMovementLog.updateMany({
            where: { subJobCardId: subCard.id },
            data: { subJobCardId: existingSubAtNextStage.id },
          });

          // Delete the now-reunited redundant sub-card row
          await tx.subJobCard.delete({
            where: { id: subCard.id },
          });
        } else {
          await tx.subJobCard.update({
            where: { id: subCard.id },
            data: {
              currentStageId: targetNextStageId,
              status: SubJobCardStatus.IN_STAGE,
              qty: movedPcb,
              totalPcbQty: movedPcb,
              custPnlQty: movedPcb,
              prodPnlQty: Math.ceil(movedPcb / 4),
              custPnlAreaSqm: movedArea,
              prodPnlAreaSqm: movedArea,
            },
          });
        }

        await tx.jobCard.update({
          where: { id: jobCardId },
          data: {
            status: JobCardStatus.IN_PROGRESS,
            updatedAt: new Date(),
          },
        });
      } else {
        // Last stage reached (PACKING / DISPATCH) -> Mark completed
        // Check if there is already another completed sub-job-card of the SAME parent Job Card
        const existingCompletedSub = await tx.subJobCard.findFirst({
          where: {
            jobCardId: subCard.jobCardId,
            id: { not: subCard.id },
            status: SubJobCardStatus.COMPLETED,
          },
        });

        if (existingCompletedSub) {
          const mergedQty = (existingCompletedSub.totalPcbQty || existingCompletedSub.qty || 0) + movedPcb;
          const mergedArea = Number(((existingCompletedSub.custPnlAreaSqm || 0) + movedArea).toFixed(2));

          await tx.subJobCard.update({
            where: { id: existingCompletedSub.id },
            data: {
              qty: mergedQty,
              totalPcbQty: mergedQty,
              custPnlQty: mergedQty,
              prodPnlQty: Math.ceil(mergedQty / 4),
              custPnlAreaSqm: mergedArea,
              prodPnlAreaSqm: mergedArea,
              status: SubJobCardStatus.COMPLETED,
            },
          });

          await tx.stageMovementLog.updateMany({
            where: { subJobCardId: subCard.id },
            data: { subJobCardId: existingCompletedSub.id },
          });

          await tx.subJobCard.delete({
            where: { id: subCard.id },
          });
        } else {
          // Find the PACKING stage to keep it set (so UI shows '20. PACKING')
          const packingStage = await tx.processStage.findFirst({
            where: { OR: [{ name: '20. PACKING' }, { code: 'PKG' }, { defaultOrder: 20 }] },
          });
          await tx.subJobCard.update({
            where: { id: subCard.id },
            data: {
              currentStageId: packingStage?.id ?? subCard.currentStageId,
              status: SubJobCardStatus.COMPLETED,
              qty: movedPcb,
              totalPcbQty: movedPcb,
              custPnlQty: movedPcb,
              prodPnlQty: Math.ceil(movedPcb / 4),
              custPnlAreaSqm: movedArea,
              prodPnlAreaSqm: movedArea,
            },
          });
        }

        await tx.jobCard.update({
          where: { id: jobCardId },
          data: {
            status: JobCardStatus.COMPLETED,
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      return {
        success: true,
        message: `Job Card moved successfully to next process stage.`,
      };
    });
  }

  async movePartial(
    id: string,
    body: {
      cardId?: string;
      jobCardNo?: string;
      subJobCardNo?: string;
      currentStageName?: string;
      stageId?: string;
      qtyToMove: number;
      areaToMove?: number;
      remark?: string;
      pendingWorkReason?: string;
      remarkType?: string;
    },
    user: any,
  ) {
    const cardId = (body?.cardId || '').trim();
    const subJobCardNo = (body?.subJobCardNo || '').trim();
    const jobCardNo = (body?.jobCardNo || '').trim();
    const rawTarget = (id || cardId || subJobCardNo || jobCardNo || '').trim();
    const searchNo = (jobCardNo || rawTarget || '').trim();

    const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const subCardOr: any[] = [];
    if (isUuid(id)) subCardOr.push({ id });
    if (cardId && isUuid(cardId) && cardId !== id) subCardOr.push({ id: cardId });
    if (subJobCardNo) subCardOr.push({ subJobCardNo });
    if (rawTarget && rawTarget !== id && rawTarget !== subJobCardNo) subCardOr.push({ subJobCardNo: rawTarget });
    subCardOr.push({ qrCodeValue: rawTarget });

    let subCard: any = subCardOr.length > 0 ? await this.prisma.subJobCard.findFirst({
      where: {
        OR: subCardOr.filter(Boolean),
      },
      include: {
        currentStage: true,
        jobCard: {
          include: {
            processFlowMaster: {
              include: { steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } } },
            },
          },
        },
      },
    }) : null;

    let jobCardId = subCard ? subCard.jobCardId : rawTarget;
    if (!subCard) {
      const jcOr: any[] = [];
      if (searchNo) jcOr.push({ jobCardNo: searchNo });
      if (rawTarget && rawTarget !== searchNo) jcOr.push({ jobCardNo: rawTarget });
      if (isUuid(rawTarget)) jcOr.push({ id: rawTarget });
      if (cardId && isUuid(cardId)) jcOr.push({ id: cardId });

      let jc: any = await this.prisma.jobCard.findFirst({
        where: {
          OR: jcOr.filter(Boolean),
        },
        include: {
          subJobCards: { include: { currentStage: true } },
          processFlowMaster: {
            include: { steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } } },
          },
        },
      });

      if (!jc) {
        throw new NotFoundException(`Job Card or Sub-Job Card "${rawTarget}" not found in database`);
      }

      jobCardId = jc.id;
      if (jc.subJobCards && jc.subJobCards.length > 0) {
        if (subJobCardNo) {
          subCard = jc.subJobCards.find((s: any) => s.subJobCardNo === subJobCardNo || s.subJobCardNo === searchNo);
        }
        if (!subCard && body?.currentStageName) {
          const targetStg = String(body.currentStageName).toLowerCase().replace(/^\d+\.\s*/, '').trim();
          subCard = jc.subJobCards.find((s: any) => {
            const currStg = String(s.currentStage?.name || '').toLowerCase().replace(/^\d+\.\s*/, '').trim();
            return currStg === targetStg || currStg.includes(targetStg) || targetStg.includes(currStg);
          });
        }
        if (!subCard) {
          subCard = jc.subJobCards[0] as any;
        }
      }

      if (!subCard) {
        const fullQty = jc.totalPcbQty || jc.custPnlQty || 160;
        const firstStage = await this.prisma.processStage.findFirst({ orderBy: { defaultOrder: 'asc' } });
        subCard = (await this.prisma.subJobCard.create({
          data: {
            subJobCardNo: `${jc.jobCardNo}-1`,
            jobCardId: jc.id,
            qty: fullQty,
            totalPcbQty: fullQty,
            custPnlQty: fullQty,
            prodPnlQty: Math.ceil(fullQty / 4),
            custPnlAreaSqm: jc.custPnlAreaSqm || 45,
            prodPnlAreaSqm: jc.prodPnlAreaSqm || 50,
            status: SubJobCardStatus.IN_STAGE,
            currentStageId: firstStage?.id || null,
            qrCodeValue: `RFE-SJC-${jc.jobCardNo}-1-${Date.now().toString().slice(-4)}`,
            createdById: user?.id || jc.createdById,
          },
          include: { currentStage: true },
        })) as any;
      }
    } else {
      jobCardId = subCard.jobCardId;
    }

    // ENFORCE STAGE-WISE USER ACCESS RIGHT AT BACKEND / API LEVEL
    this.validateUserStagePermission(user, subCard.currentStage);

    const qtyToMove = Number(body.qtyToMove);
    const masterPcbQty = subCard.totalPcbQty || subCard.qty || 160;

    if (isNaN(qtyToMove) || qtyToMove <= 0 || qtyToMove >= masterPcbQty) {
      throw new BadRequestException(
        `Quantity to move (${qtyToMove} PCBs) must be greater than 0 and less than remaining lot quantity (${masterPcbQty} PCBs)`,
      );
    }

    let currentStage = subCard.currentStage;
    if (!currentStage && subCard.currentStageId) {
      currentStage = await this.prisma.processStage.findUnique({ where: { id: subCard.currentStageId } });
    }

    // Pass the actual process flow steps to determine correct next stage
    const flowSteps = subCard.jobCard?.processFlowMaster?.steps || [];
    const { targetNextStageId, isLastStage } = await this.getNextProcessStage(currentStage, flowSteps);

    if (!targetNextStageId || isLastStage) {
      throw new BadRequestException('Job is already at the final stage and cannot move further');
    }

    const currentTotalArea = subCard.custPnlAreaSqm || subCard.prodPnlAreaSqm || 0;
    const areaToMove = body.areaToMove
      ? Number(body.areaToMove)
      : currentTotalArea > 0
        ? Number(((currentTotalArea * qtyToMove) / masterPcbQty).toFixed(2))
        : 0;
    const remainingQty = masterPcbQty - qtyToMove;

    const userId = user?.id || user?.sub || user?.userId || subCard.createdById;

    return this.prisma.$transaction(async (tx) => {
      // 1. Log partial movement
      await tx.stageMovementLog.create({
        data: {
          subJobCardId: subCard.id,
          stageId: subCard.currentStageId || targetNextStageId || '',
          qtyReceived: masterPcbQty,
          qtyProcessed: masterPcbQty,
          qtyForwarded: qtyToMove,
          qtyRejected: 0,
          qtyHold: 0,
          rejectionReason: body.pendingWorkReason || null,
          remarkType: body.remarkType || 'INCOMPLETE_MOVEMENT',
          remarks: body.remark || `Uncompleted / Partial Job Movement: ${qtyToMove} PCBs moved to next stage (${remainingQty} PCBs retained)`,
          createdById: userId,
        },
      });

      // 2. Reunite if sibling lot is already waiting at targetNextStageId, else create split lot with letter suffix
      const existingSubAtNextStage = await tx.subJobCard.findFirst({
        where: {
          jobCardId: subCard.jobCardId,
          currentStageId: targetNextStageId,
          id: { not: subCard.id },
          status: SubJobCardStatus.IN_STAGE,
        },
      });

      if (existingSubAtNextStage) {
        const mergedQty = (existingSubAtNextStage.totalPcbQty || existingSubAtNextStage.qty || 0) + qtyToMove;
        const mergedArea = Number(((existingSubAtNextStage.custPnlAreaSqm || 0) + areaToMove).toFixed(2));
        await tx.subJobCard.update({
          where: { id: existingSubAtNextStage.id },
          data: {
            qty: mergedQty,
            totalPcbQty: mergedQty,
            custPnlQty: mergedQty,
            prodPnlQty: Math.ceil(mergedQty / 4),
            custPnlAreaSqm: mergedArea,
            prodPnlAreaSqm: mergedArea,
            status: SubJobCardStatus.IN_STAGE,
          },
        });
      } else {
        const allSubs = await tx.subJobCard.findMany({
          where: { jobCardId: subCard.jobCardId },
          select: { subJobCardNo: true },
        });

        const parentJobCard = subCard.jobCard || (await tx.jobCard.findUnique({
          where: { id: subCard.jobCardId },
          select: { jobCardNo: true },
        }));
        const baseJobCardNo = parentJobCard?.jobCardNo || subCard.subJobCardNo;

        // Follow user rule: Split lots receive sequential uppercase letter suffixes (-A, -B, -C...)
        const splitIndex = allSubs.length;
        const letterSuffix = String.fromCharCode(65 + Math.max(0, splitIndex - 1));
        const nextSubNo = `${baseJobCardNo}-${letterSuffix}`;

        await tx.subJobCard.create({
          data: {
            subJobCardNo: nextSubNo,
            jobCardId: subCard.jobCardId,
            qty: qtyToMove,
            totalPcbQty: qtyToMove,
            custPnlQty: qtyToMove,
            prodPnlQty: Math.ceil(qtyToMove / 4),
            custPnlAreaSqm: areaToMove,
            prodPnlAreaSqm: areaToMove,
            status: SubJobCardStatus.IN_STAGE,
            currentStageId: targetNextStageId,
            qrCodeValue: `RFE-SJC-${nextSubNo}-${Date.now().toString().slice(-4)}`,
            createdById: userId,
          },
        });
      }

      await tx.subJobCard.update({
        where: { id: subCard.id },
        data: {
          qty: remainingQty,
          totalPcbQty: remainingQty,
          custPnlQty: remainingQty,
          prodPnlQty: Math.ceil(remainingQty / 4),
          custPnlAreaSqm: Number(Math.max(0, currentTotalArea - areaToMove).toFixed(2)),
          prodPnlAreaSqm: Number(Math.max(0, currentTotalArea - areaToMove).toFixed(2)),
          status: SubJobCardStatus.IN_STAGE,
        },
      });

      // Ensure parent JobCard status is IN_PROGRESS so it displays as active across all devices
      await tx.jobCard.update({
        where: { id: subCard.jobCardId },
        data: {
          status: JobCardStatus.IN_PROGRESS,
          launchedAt: subCard.jobCard?.launchedAt || new Date(),
        },
      });

      return this.findOne(jobCardId);
    });
  }
}

