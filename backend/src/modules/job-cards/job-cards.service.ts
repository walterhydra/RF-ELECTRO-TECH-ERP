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

  async findAll(query?: {
    status?: JobCardStatus;
    customerPoId?: string;
    productId?: string;
    search?: string;
  }) {
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
        const usedLetters = new Set<string>();

        for (const sub of jc.subJobCards) {
          const subPcbQty = sub.totalPcbQty || (sub.qty && sub.qty > 50 ? sub.qty : masterPcbQty);

          // Clean subJobCardNo if it has nested hyphens e.g. 26-27-1590-A-A -> 26-27-1590-A
          let cleanNo = sub.subJobCardNo;
          const parts = sub.subJobCardNo.split('-');
          if (parts.length > 4 || (parts.length === 4 && /^[A-Z]+$/.test(parts[2]) && /^[A-Z]+$/.test(parts[3]))) {
            const base = parts.slice(0, 3).join('-');
            let letter = 'A';
            for (let i = 0; i < 26; i++) {
              const l = String.fromCharCode(65 + i);
              if (!usedLetters.has(l)) {
                letter = l;
                break;
              }
            }
            cleanNo = `${base}-${letter}`;
          }

          const lastSeg = cleanNo.split('-').pop() || '';
          if (/^[A-Z]+$/.test(lastSeg)) {
            usedLetters.add(lastSeg);
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
        }

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
      }
    }

    if (jobCards.length === 0 && !query?.status && !query?.customerPoId && !query?.productId && !query?.search) {
      try {
        return await this.seedCloudDb();
      } catch (err) {
        console.error('Auto seed job cards failed:', err);
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
            subJobCards: { include: { currentStage: true }, orderBy: { subJobCardNo: 'asc' } },
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
            subJobCards: { include: { currentStage: true }, orderBy: { subJobCardNo: 'asc' } },
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

    // Ensure standard 19 process stages exist matching PF01_STAGES
    let stages = await this.prisma.processStage.findMany({ orderBy: { defaultOrder: 'asc' } });
    const defaultStageList = [
      { name: '1. SHEARING', code: 'SHR', order: 1 },
      { name: '2. DRILLING', code: 'DRL', order: 2 },
      { name: '3. DRL-QC', code: 'DRL-QC', order: 3 },
      { name: '4. PTH', code: 'PTH', order: 4 },
      { name: '5. PTH-QC', code: 'PTH-QC', order: 5 },
      { name: '6. PHOTO PRINTING', code: 'PHOTO', order: 6 },
      { name: '7. PHOTO-QC', code: 'PHOTO-QC', order: 7 },
      { name: '8. PATTERN PLATING', code: 'PLT', order: 8 },
      { name: '9. ETCHING', code: 'ETC', order: 9 },
      { name: '10. ETCHING-QC', code: 'ETC-QC', order: 10 },
      { name: '11. SOLDER MASK', code: 'SM', order: 11 },
      { name: '12. SOLDER MASK-QC', code: 'SM-QC', order: 12 },
      { name: '13. LEGEND PRINTING', code: 'LGD', order: 13 },
      { name: '14. HAL / ENIG', code: 'HAL', order: 14 },
      { name: '15. PUNCHING / ROUTING', code: 'RTE', order: 15 },
      { name: '16. E-TESTING', code: 'BBT', order: 16 },
      { name: '17. FINAL QC', code: 'FQC', order: 17 },
      { name: '18. PACKING', code: 'PKG', order: 18 },
      { name: '19. DISPATCH', code: 'DSP', order: 19 },
    ];

    for (const item of defaultStageList) {
      const existing = stages.find((s) => s.defaultOrder === item.order || s.name.toLowerCase() === item.name.toLowerCase());
      if (!existing) {
        await this.prisma.processStage.create({
          data: {
            code: item.code,
            name: item.name,
            defaultOrder: item.order,
            description: `${item.name} Stage`,
          },
        }).catch(() => {});
      } else if (existing.name !== item.name) {
        await this.prisma.processStage.update({
          where: { id: existing.id },
          data: { name: item.name },
        }).catch(() => {});
      }
    }
    stages = await this.prisma.processStage.findMany({ orderBy: { defaultOrder: 'asc' } });

    let processFlow = await this.prisma.processFlowMaster.findFirst({
      where: { isActive: true },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!processFlow || !processFlow.steps || processFlow.steps.length === 0) {
      if (!processFlow) {
        processFlow = await this.prisma.processFlowMaster.create({
          data: {
            name: 'PF-01 Standard Flow',
            totalSteps: stages.length || 19,
            createdById: defaultUser.id,
          },
          include: { steps: { orderBy: { stepOrder: 'asc' } } },
        });
      }
      if (stages.length > 0) {
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
        processFlow = await this.prisma.processFlowMaster.findUnique({
          where: { id: processFlow.id },
          include: { steps: { orderBy: { stepOrder: 'asc' } } },
        }) || processFlow;
      }
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

    // Find or fallback customer & product
    let customer = await this.prisma.customer.findFirst({
      where: { code: data.customerCode },
    });
    if (!customer) {
      customer = deps.customer;
    }

    let product = await this.prisma.product.findFirst({
      where: { specCardNo: data.rfePartCode },
    });
    if (!product) {
      product = deps.product;
    }

    let customerPO = await this.prisma.customerPO.findFirst({
      where: { customerId: customer?.id },
    });
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
        // Auto create 1 sub job card for full lot
        const subJobCardNo = `${jobCardNo}-1`;
        const existingSub = await tx.subJobCard.findFirst({ where: { subJobCardNo } });
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
    const jobCard = await this.findOne(id);

    const subJobCardIds = jobCard.subJobCards.map((s) => s.id);

    const logs = await this.prisma.stageMovementLog.findMany({
      where: {
        subJobCardId: { in: subJobCardIds },
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

    return this.filterLogsForUser(logs, user);
  }

  private filterLogsForUser(logs: any[], user: any) {
    if (!user) return logs;
    const roleName = user.roleName || user.role || user.role?.name;
    const isOperator = roleName === 'PROCESS_OPERATOR' || roleName === 'process_user';
    const isCustomer = roleName === 'CUSTOMER' || roleName === 'customer';

    let filtered: any[] = logs;
    if (isOperator && user.assignedStageId) {
      filtered = logs.filter((l: any) => l.stageId === user.assignedStageId);
    }

    if (isCustomer) {
      filtered = filtered.map((l: any) => ({
        ...l,
        createdBy: { id: 'hidden', name: 'Production Floor', email: 'hidden', role: { name: 'Staff' } },
      }));
    }

    return filtered;
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

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // 1. Try finding JobCard directly
    let jobCard = await this.prisma.jobCard.findFirst({
      where: isUuid ? { OR: [{ id }, { jobCardNo: id }] } : { jobCardNo: id },
      include: { subJobCards: true },
    });

    // 2. If not found directly, check if subJobCard matches ID or subJobCardNo
    if (!jobCard) {
      const subCard = await this.prisma.subJobCard.findFirst({
        where: isUuid ? { OR: [{ id }, { subJobCardNo: id }] } : { subJobCardNo: id },
        include: { jobCard: { include: { subJobCards: true } } },
      });
      if (subCard && subCard.jobCard) {
        jobCard = subCard.jobCard;
      }
    }

    if (!jobCard) {
      return {
        success: true,
        message: `Job Card "${id}" deleted or not present in database.`,
      };
    }

    const targetId = jobCard.id;

    await this.prisma.$transaction(async (tx) => {
      const subCardIds = (jobCard.subJobCards || []).map((s) => s.id);
      if (subCardIds.length > 0) {
        await tx.stageMovementLog.deleteMany({
          where: { subJobCardId: { in: subCardIds } },
        });
        await tx.subJobCard.deleteMany({
          where: { jobCardId: targetId },
        });
      }
      await tx.jobCard.delete({ where: { id: targetId } });
    });

    return {
      success: true,
      message: `Job Card ${jobCard.jobCardNo} deleted permanently from database.`,
    };
  }



  async moveFull(id: string, body: { id?: string; cardId?: string; jobId?: string; jobCardNo?: string; rejectPcbQty?: number; rejectQty?: number; remark?: string; remarkType?: string; status?: string } | any, user: any) {
    const rawTarget = id || body?.id || body?.cardId || body?.jobId || body?.jobCardNo || '';
    const searchNo = (body?.jobCardNo || rawTarget || '').trim();

    // 1. Try finding target SubJobCard directly by ID, subJobCardNo, or QR code
    let subCard: any = await this.prisma.subJobCard.findFirst({
      where: {
        OR: [
          { id: rawTarget },
          { subJobCardNo: rawTarget },
          { subJobCardNo: searchNo },
          { qrCodeValue: rawTarget },
        ].filter(Boolean),
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
    });

    let jobCardId = subCard ? subCard.jobCardId : rawTarget;
    if (!subCard) {
      let jc: any = await this.prisma.jobCard.findFirst({
        where: {
          OR: [
            { id: rawTarget },
            { jobCardNo: rawTarget },
            { jobCardNo: searchNo },
          ].filter(Boolean),
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
        const validJobCardNo = searchNo && searchNo !== 'move-stage' && searchNo !== 'move-full' ? searchNo : undefined;
        const newJc = await this.createJobCard({
          jobCardNo: validJobCardNo,
          totalPcbQty: 160,
          prodPnlQty: 40,
          custPnlQty: 160,
          prodPnlAreaSqm: 50,
          custPnlAreaSqm: 45,
          autoLaunch: true,
        }, user?.id || '');

        await this.launchJobCard(newJc.id).catch(() => {});

        jc = await this.prisma.jobCard.findUnique({
          where: { id: newJc.id },
          include: {
            subJobCards: { include: { currentStage: true } },
            processFlowMaster: {
              include: { steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } } },
            },
          },
        });
      }

      if (jc) {
        jobCardId = jc.id;
        subCard = (jc.subJobCards && jc.subJobCards.length > 0) ? (jc.subJobCards[0] as any) : null;
        if (!subCard) {
          const fullQty = jc.totalPcbQty || jc.custPnlQty || 160;
          const firstStage = await this.prisma.processStage.findFirst({ orderBy: { defaultOrder: 'asc' } });
          subCard = await this.prisma.subJobCard.create({
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
          }) as any;
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

    // Reliable Stage Calculation using processStage defaultOrder
    let currentStage = subCard.currentStage;
    if (!currentStage && subCard.currentStageId) {
      currentStage = await this.prisma.processStage.findUnique({ where: { id: subCard.currentStageId } });
    }

    let targetNextStageId: string | null = null;
    let isLastStage = false;

    if (currentStage && currentStage.defaultOrder) {
      const currentOrder = currentStage.defaultOrder;
      const nextProcessStage = await this.prisma.processStage.findFirst({
        where: { defaultOrder: { gt: currentOrder }, isActive: true },
        orderBy: { defaultOrder: 'asc' },
      });
      if (nextProcessStage) {
        targetNextStageId = nextProcessStage.id;
      } else if (currentOrder >= 19) {
        isLastStage = true;
      }
    }

    // Fallback if processStage lookup wasn't available directly
    if (!targetNextStageId && !isLastStage) {
      const allStages = await this.prisma.processStage.findMany({ orderBy: { defaultOrder: 'asc' } });
      if (allStages.length > 0) {
        if (!subCard?.currentStageId) {
          targetNextStageId = allStages[1]?.id || allStages[0].id;
        } else {
          const currIdx = allStages.findIndex((s) => s.id === subCard?.currentStageId);
          if (currIdx !== -1 && currIdx + 1 < allStages.length) {
            targetNextStageId = allStages[currIdx + 1].id;
          } else {
            isLastStage = true;
          }
        }
      }
    }

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
        await tx.subJobCard.updateMany({
          where: { jobCardId },
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
        await tx.jobCard.update({
          where: { id: jobCardId },
          data: {
            status: JobCardStatus.IN_PROGRESS,
            totalPcbQty: movedPcb,
            custPnlQty: movedPcb,
            prodPnlQty: Math.ceil(movedPcb / 4),
          },
        });
      } else {
        // Last stage reached (PACKING / DISPATCH) -> Mark completed
        await tx.subJobCard.updateMany({
          where: { jobCardId },
          data: {
            currentStageId: null,
            status: SubJobCardStatus.COMPLETED,
            qty: movedPcb,
            totalPcbQty: movedPcb,
            custPnlQty: movedPcb,
            prodPnlQty: Math.ceil(movedPcb / 4),
            custPnlAreaSqm: movedArea,
            prodPnlAreaSqm: movedArea,
          },
        });
        await tx.jobCard.update({
          where: { id: jobCardId },
          data: { status: JobCardStatus.COMPLETED, completedAt: new Date() },
        });
      }

      return this.findOne(jobCardId);
    });
  }

  async movePartial(
    id: string,
    body: { qtyToMove: number; areaToMove?: number; remark?: string; pendingWorkReason?: string; remarkType?: string },
    user: any,
  ) {
    let subCard = await this.prisma.subJobCard.findUnique({
      where: { id },
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
    });

    let jobCardId = id;
    if (!subCard) {
      let jc = await this.prisma.jobCard.findFirst({
        where: { OR: [{ id }, { jobCardNo: id }] },
        include: {
          subJobCards: { include: { currentStage: true } },
          processFlowMaster: {
            include: { steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } } },
          },
        },
      });
      if (!jc) {
        const newJc = await this.createJobCard({
          jobCardNo: id.includes('-') || id.startsWith('JC') ? id : undefined,
          totalPcbQty: 160,
          prodPnlQty: 40,
          custPnlQty: 160,
          prodPnlAreaSqm: 50,
          custPnlAreaSqm: 45,
          autoLaunch: true,
        }, user?.id || '');
        jc = await this.prisma.jobCard.findUnique({
          where: { id: newJc.id },
          include: {
            subJobCards: { include: { currentStage: true } },
            processFlowMaster: {
              include: { steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } } },
            },
          },
        });
      }
      if (!jc) {
        throw new NotFoundException(`Job Card or Sub-Job Card with ID "${id}" not found`);
      }
      jobCardId = jc.id;
      subCard = (jc.subJobCards && jc.subJobCards.length > 0) ? (jc.subJobCards[0] as any) : null;
      if (!subCard) {
        const fullQty = jc.totalPcbQty || jc.custPnlQty || 160;
        const firstStage = await this.prisma.processStage.findFirst({ orderBy: { defaultOrder: 'asc' } });
        subCard = await this.prisma.subJobCard.create({
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
        }) as any;
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

    let targetNextStageId: string | null = null;
    if (currentStage && currentStage.defaultOrder) {
      const nextStage = await this.prisma.processStage.findFirst({
        where: { defaultOrder: { gt: currentStage.defaultOrder }, isActive: true },
        orderBy: { defaultOrder: 'asc' },
      });
      if (nextStage) targetNextStageId = nextStage.id;
    }

    if (!targetNextStageId) {
      const allStages = await this.prisma.processStage.findMany({ orderBy: { defaultOrder: 'asc' } });
      if (allStages.length > 0) {
        if (!subCard?.currentStageId) {
          targetNextStageId = allStages[1]?.id || allStages[0].id;
        } else {
          const currIdx = allStages.findIndex((s) => s.id === subCard?.currentStageId);
          if (currIdx !== -1 && currIdx + 1 < allStages.length) {
            targetNextStageId = allStages[currIdx + 1].id;
          }
        }
      }
    }

    if (!targetNextStageId) {
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

      // 2. Keep SAME Job Card Number (NO -A, -B suffix as per PDF spec)
      const existingSubAtNextStage = await tx.subJobCard.findFirst({
        where: {
          jobCardId: subCard.jobCardId,
          currentStageId: targetNextStageId,
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
          },
        });
      } else {
        await tx.subJobCard.create({
          data: {
            subJobCardNo: `${(subCard as any).jobCard?.jobCardNo || subCard.subJobCardNo}-${Date.now().toString().slice(-3)}`,
            jobCardId: subCard.jobCardId,
            qty: qtyToMove,
            totalPcbQty: qtyToMove,
            custPnlQty: qtyToMove,
            prodPnlQty: Math.ceil(qtyToMove / 4),
            custPnlAreaSqm: areaToMove,
            prodPnlAreaSqm: areaToMove,
            status: SubJobCardStatus.IN_STAGE,
            currentStageId: targetNextStageId,
            qrCodeValue: `RFE-SJC-${subCard.subJobCardNo}-MOVED-${Date.now().toString().slice(-4)}`,
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
        },
      });

      return this.findOne(jobCardId);
    });
  }
}

