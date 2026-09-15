import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobCardStatus, SubJobCardStatus, POStatus } from '@prisma/client';
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

    // Auto-correct sub-job card PCB quantities & clean sub-card numbers
    for (const jc of jobCards) {
      if (jc.subJobCards && jc.subJobCards.length > 0) {
        const masterPcbQty = jc.totalPcbQty || jc.custPnlQty || (jc.prodPnlQty ? jc.prodPnlQty * 4 : 160);
        const usedLetters = new Set<string>();

        for (const sub of jc.subJobCards) {
          const subPcbQty = sub.totalPcbQty || sub.qty || masterPcbQty;

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
      }
    }

    if (jobCards.length === 0 && !query?.status && !query?.customerPoId && !query?.productId && !query?.search) {
      try {
        await this.createJobCard({
          jobCardNo: '26-27-0001',
          customerCode: 'CUST-RF045',
          rfePartCode: 'D3625',
          customerPartNo: 'EV-900W-WP-TO247',
          priority: 'NORMAL',
          prodPnlQty: 40,
          custPnlQty: 160,
          totalPcbQty: 160,
          prodPnlAreaSqm: 50,
          custPnlAreaSqm: 45,
          jobFlowSelection: 'PF-01',
          autoLaunch: true,
        }, '');

        await this.createJobCard({
          jobCardNo: '26-27-0002',
          customerCode: 'CUST-RF045',
          rfePartCode: 'D3625',
          customerPartNo: 'EV-900W-WP-TO247',
          priority: 'HIGH',
          prodPnlQty: 80,
          custPnlQty: 320,
          totalPcbQty: 320,
          prodPnlAreaSqm: 100,
          custPnlAreaSqm: 90,
          jobFlowSelection: 'PF-01',
          autoLaunch: true,
        }, '');

        return this.prisma.jobCard.findMany({
          where,
          include: {
            customerPO: { include: { customer: true } },
            product: true,
            processFlowMaster: true,
            subJobCards: { include: { currentStage: true }, orderBy: { subJobCardNo: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (err) {
        console.error('Auto seed job cards failed:', err);
      }
    }

    return jobCards;
  }

  async findOne(id: string, client: any = this.prisma) {
    const db = client || this.prisma;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const where: any = isUuid ? { id } : { jobCardNo: id };

    const jobCard = await db.jobCard.findFirst({
      where,
      include: {
        customerPO: {
          include: { customer: true },
        },
        product: true,
        processFlowMaster: {
          include: {
            steps: {
              include: { stage: true },
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
        subJobCards: {
          include: { currentStage: true },
          orderBy: { subJobCardNo: 'asc' },
        },
      },
    });

    if (!jobCard) {
      throw new NotFoundException(`Job Card with ID or Number "${id}" not found`);
    }

    return jobCard;
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
      where: { name: 'SUPER_ADMIN' },
    });
    if (!superAdminRole) {
      superAdminRole = await this.prisma.role.create({
        data: { name: 'SUPER_ADMIN', description: 'Super Administrator' },
      });
    }

    let defaultUser = await this.prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await this.prisma.user.create({
        data: {
          name: 'System Admin',
          email: 'admin@rfelectro.com',
          passwordHash: 'dummy_hash',
          roleId: superAdminRole.id,
        },
      });
    }

    // Ensure standard stages exist
    let stages = await this.prisma.processStage.findMany();
    if (stages.length === 0) {
      const defaultStageNames = [
        'CAM / MI Generation', 'Job Registration & Barcoding', 'Board Cutting & Edge Milling',
        'CNC Drilling', 'Deburring & Surface Prep', 'Electroless Copper (PTH)',
        'Outer Layer Photo Image / Lamination', 'Pattern Electroplating (Cu + Sn)',
        'Alkaline Etching', 'Tin Stripping', 'Solder Mask Coating & Printing',
        'UV Exposure & Developer', 'Legend / Silkscreen Printing', 'Thermal Curing',
        'Surface Finish (HASL / ENIG)', 'CNC Routing / V-Scoring', 'Electrical Testing (E-Test)',
        'Final Quality Inspection (FQC)', 'Vacuum Packaging & Dispatch'
      ];

      for (let i = 0; i < defaultStageNames.length; i++) {
        const name = defaultStageNames[i];
        const code = `STG-${String(i + 1).padStart(2, '0')}`;
        await this.prisma.processStage.create({
          data: {
            code,
            name,
            sequenceOrder: i + 1,
            description: `${name} Stage`,
          },
        }).catch(() => {});
      }
      stages = await this.prisma.processStage.findMany({ orderBy: { sequenceOrder: 'asc' } });
    }

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
    if (!createdById) {
      createdById = deps.defaultUser.id;
    }
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

    const createdId = await this.prisma.$transaction(async (tx) => {
      const fallbackPo = customerPO || deps.customerPO;
      const fallbackProduct = product || deps.product;
      const fallbackFlow = processFlow || deps.processFlow;

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
          createdById,
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

      // Handle pre-launch splits if provided
      const rawSplits = Array.isArray(data.splits) ? data.splits : [];
      if (rawSplits.length > 0) {
        for (let i = 0; i < rawSplits.length; i++) {
          const subQty = Number(typeof rawSplits[i] === 'object' ? rawSplits[i].qty : rawSplits[i]);
          const subJobCardNo = `${jobCardNo}-${i + 1}`;
          const ratio = (Number(data.prodPnlQty) || 40) > 0 ? subQty / (Number(data.prodPnlQty) || 40) : 1;

          await tx.subJobCard.create({
            data: {
              subJobCardNo,
              jobCardId: jobCard.id,
              qty: subQty,
              prodPnlQty: subQty,
              totalPcbQty: data.totalPcbQty ? Math.round(Number(data.totalPcbQty) * ratio) : null,
              prodPnlAreaSqm: data.prodPnlAreaSqm ? Number((Number(data.prodPnlAreaSqm) * ratio).toFixed(2)) : null,
              custPnlAreaSqm: data.custPnlAreaSqm ? Number((Number(data.custPnlAreaSqm) * ratio).toFixed(2)) : null,
              status: data.autoLaunch ? SubJobCardStatus.IN_STAGE : SubJobCardStatus.PENDING_LAUNCH,
              currentStageId: initialStageId,
              qrCodeValue: `RFE-SJC-${subJobCardNo}-${Date.now().toString().slice(-4)}`,
              createdById,
            },
          });
        }
      } else {
        // Auto create 1 sub job card for full lot
        const subJobCardNo = `${jobCardNo}-1`;
        await tx.subJobCard.create({
          data: {
            subJobCardNo,
            jobCardId: jobCard.id,
            qty: Number(data.prodPnlQty) || 40,
            prodPnlQty: Number(data.prodPnlQty) || 40,
            totalPcbQty: Number(data.totalPcbQty) || 160,
            prodPnlAreaSqm: Number(data.prodPnlAreaSqm) || 50,
            custPnlAreaSqm: Number(data.custPnlAreaSqm) || 45,
            status: data.autoLaunch ? SubJobCardStatus.IN_STAGE : SubJobCardStatus.PENDING_LAUNCH,
            currentStageId: initialStageId,
            qrCodeValue: `RFE-SJC-${subJobCardNo}-${Date.now().toString().slice(-4)}`,
            createdById,
          },
        });
      }

      return jobCard.id;
    });

    try {
      return await this.findOne(createdId);
    } catch (err) {
      console.error('createJobCard findOne error:', err);
      const fallback = await this.prisma.jobCard.findUnique({
        where: { id: createdId },
        include: {
          subJobCards: true,
          product: true,
          customerPO: true,
        },
      });
      if (!fallback) {
        throw new NotFoundException(`Job Card with ID "${createdId}" creation failed`);
      }
      return fallback;
    }
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
    const jobCard = await this.findOne(id);

    if (jobCard.status !== JobCardStatus.CREATED && jobCard.status !== JobCardStatus.NOT_LAUNCHED) {
      throw new BadRequestException(`Job Card "${jobCard.jobCardNo}" is already in status "${jobCard.status}"`);
    }

    const firstStep = jobCard.processFlowMaster?.steps?.[0];
    const firstStageId = firstStep?.stageId || null;

    if (!firstStageId) {
      throw new BadRequestException('Cannot launch Job Card: The associated manufacturing process flow has no process stages configured.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (!jobCard.subJobCards || jobCard.subJobCards.length === 0) {
        // Auto-create 1 single sub-job card for the full quantity
        const subJobCardNo = `${jobCard.jobCardNo}-1`;
        const qrCodeValue = `RFE-SJC-${subJobCardNo}-${Date.now().toString().slice(-4)}`;

        await tx.subJobCard.create({
          data: {
            subJobCardNo,
            jobCardId: id,
            qty: jobCard.totalQty,
            status: SubJobCardStatus.IN_STAGE,
            currentStageId: firstStageId,
            qrCodeValue,
            createdById: jobCard.createdById,
          },
        });
      } else {
        // Move all pending sub job cards to IN_STAGE at stage 1
        await tx.subJobCard.updateMany({
          where: { jobCardId: id },
          data: {
            status: SubJobCardStatus.IN_STAGE,
            currentStageId: firstStageId,
          },
        });
      }

      const updated = await tx.jobCard.update({
        where: { id },
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

    const data: any = { status };
    if (status === JobCardStatus.COMPLETED && !jobCard.completedAt) {
      data.completedAt = new Date();
    }

    return this.prisma.jobCard.update({
      where: { id: jobCard.id },
      data,
      include: {
        customerPO: { include: { customer: true } },
        product: true,
        subJobCards: { include: { currentStage: true }, orderBy: { subJobCardNo: 'asc' } },
      },
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
    const where: any = isUuid ? { OR: [{ id }, { jobCardNo: id }] } : { jobCardNo: id };

    const jobCard = await this.prisma.jobCard.findFirst({
      where,
      include: { subJobCards: true },
    });

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
      message: `Job Card ${jobCard.jobCardNo} deleted successfully by Super Admin.`,
    };
  }

  async moveFull(id: string, body: { remark?: string; remarkType?: string }, user: any) {
    // Find target SubJobCard or JobCard
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
      // Find first active subJobCard for jobCard id
      const jc = await this.prisma.jobCard.findUnique({
        where: { id },
        include: {
          subJobCards: { include: { currentStage: true } },
          processFlowMaster: {
            include: { steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } } },
          },
        },
      });
      if (!jc) {
        throw new NotFoundException(`Job Card or Sub-Job Card with ID "${id}" not found`);
      }
      jobCardId = jc.id;
      subCard = jc.subJobCards[0] as any;
      if (!subCard) {
        throw new BadRequestException('Job Card has no active lots/sub-job cards to move');
      }
    } else {
      jobCardId = subCard.jobCardId;
    }

    // ENFORCE STAGE-WISE USER ACCESS RIGHT AT BACKEND / API LEVEL
    this.validateUserStagePermission(user, subCard.currentStage);

    const steps = (subCard as any).jobCard?.processFlowMaster?.steps || [];
    const currentStep = steps.find((s: any) => s.stageId === subCard?.currentStageId);
    const currentStepOrder = currentStep ? currentStep.stepOrder : 1;
    const nextStep = steps.find((s: any) => s.stepOrder > currentStepOrder);

    const userId = user?.id || user?.sub || user?.userId || subCard.createdById;
    const rType = body.remarkType || (body.remark?.toLowerCase().includes('rejection') ? 'REJECTION' : body.remark?.toLowerCase().includes('rework') ? 'REWORK' : body.remark?.toLowerCase().includes('process issue') ? 'PROCESS_ISSUE' : 'NONE');
    const formattedRemarks = body.remark ? `[${rType}] ${body.remark}` : `[${rType}] Full Job Movement to next stage`;

    return this.prisma.$transaction(async (tx) => {
      // Create movement log
      await tx.stageMovementLog.create({
        data: {
          subJobCardId: subCard.id,
          stageId: subCard.currentStageId || steps[0]?.stageId || '',
          qtyReceived: subCard.qty,
          qtyProcessed: subCard.qty,
          qtyForwarded: subCard.qty,
          qtyRejected: rType === 'REJECTION' ? 1 : 0,
          qtyHold: 0,
          remarks: formattedRemarks,
          createdById: userId,
        },
      });

      if (nextStep) {
        await tx.subJobCard.update({
          where: { id: subCard.id },
          data: {
            currentStageId: nextStep.stageId,
            status: SubJobCardStatus.IN_STAGE,
          },
        });
      } else {
        // Last stage reached (PACKING / DISPATCH) -> Mark completed
        await tx.subJobCard.update({
          where: { id: subCard.id },
          data: {
            currentStageId: null,
            status: SubJobCardStatus.COMPLETED,
          },
        });
        const allSubCards = await tx.subJobCard.findMany({ where: { jobCardId } });
        const allCompleted = allSubCards.every((c) => c.status === SubJobCardStatus.COMPLETED);
        if (allCompleted) {
          await tx.jobCard.update({
            where: { id: jobCardId },
            data: { status: JobCardStatus.COMPLETED, completedAt: new Date() },
          });
        }
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
      const jc = await this.prisma.jobCard.findUnique({
        where: { id },
        include: {
          subJobCards: { include: { currentStage: true } },
          processFlowMaster: {
            include: { steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } } },
          },
        },
      });
      if (!jc) {
        throw new NotFoundException(`Job Card or Sub-Job Card with ID "${id}" not found`);
      }
      jobCardId = jc.id;
      subCard = jc.subJobCards[0] as any;
      if (!subCard) {
        throw new BadRequestException('Job Card has no active lots/sub-job cards to move');
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

    const steps = (subCard as any).jobCard?.processFlowMaster?.steps || [];
    const currentStep = steps.find((s: any) => s.stageId === subCard?.currentStageId);
    const currentStepOrder = currentStep ? currentStep.stepOrder : 1;
    const nextStep = steps.find((s: any) => s.stepOrder > currentStepOrder);

    if (!nextStep) {
      throw new BadRequestException('Job is already at the final stage and cannot move further');
    }

    const currentTotalArea = subCard.custPnlAreaSqm || subCard.prodPnlAreaSqm || 0;
    const areaToMove = body.areaToMove
      ? Number(body.areaToMove)
      : currentTotalArea > 0
        ? Number(((currentTotalArea * qtyToMove) / masterPcbQty).toFixed(2))
        : 0;
    const remainingQty = masterPcbQty - qtyToMove;
    const remainingArea = Number(Math.max(0, currentTotalArea - areaToMove).toFixed(2));

    const userId = user?.id || user?.sub || user?.userId || subCard.createdById;

    return this.prisma.$transaction(async (tx) => {
      // 1. Log partial movement
      await tx.stageMovementLog.create({
        data: {
          subJobCardId: subCard.id,
          stageId: subCard.currentStageId || steps[0]?.stageId || '',
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

      // 2. Determine clean subJobCard numbers relative to master Job Card No
      const masterJobCardNo = (subCard as any).jobCard?.jobCardNo || 'JC';

      const existingSubCards = await tx.subJobCard.findMany({
        where: { jobCardId: subCard.jobCardId },
        select: { id: true, subJobCardNo: true },
      });

      const usedLetters = new Set<string>();
      existingSubCards.forEach((s) => {
        if (s.subJobCardNo.startsWith(`${masterJobCardNo}-`)) {
          const rem = s.subJobCardNo.slice(masterJobCardNo.length + 1);
          const match = rem.match(/^([A-Z]+)/);
          if (match) usedLetters.add(match[1]);
        }
      });

      let nextMovedLetter = 'A';
      for (let i = 0; i < 26; i++) {
        const l = String.fromCharCode(65 + i);
        if (!usedLetters.has(l)) {
          nextMovedLetter = l;
          break;
        }
      }

      let newSubCardNo = `${masterJobCardNo}-${nextMovedLetter}`;
      let updatedRemainingNo = subCard.subJobCardNo;

      const lastSegment = subCard.subJobCardNo.split('-').pop() || '';
      const isLetterSuffix = /^[A-Z]+$/.test(lastSegment);

      if (!isLetterSuffix) {
        usedLetters.add(nextMovedLetter);
        let remLetter = 'B';
        for (let i = 0; i < 26; i++) {
          const l = String.fromCharCode(65 + i);
          if (!usedLetters.has(l)) {
            remLetter = l;
            break;
          }
        }
        updatedRemainingNo = `${masterJobCardNo}-${remLetter}`;
      }

      // Update remaining lot at current stage
      await tx.subJobCard.update({
        where: { id: subCard.id },
        data: {
          subJobCardNo: updatedRemainingNo,
          qty: remainingQty,
          totalPcbQty: remainingQty,
          custPnlQty: remainingQty,
          prodPnlQty: Math.ceil(remainingQty / 4),
          prodPnlAreaSqm: remainingArea,
          custPnlAreaSqm: remainingArea,
        },
      });

      // 3. Create moved portion at next stage
      await tx.subJobCard.create({
        data: {
          subJobCardNo: newSubCardNo,
          jobCardId: subCard.jobCardId,
          parentSubJobCardId: subCard.id,
          currentStageId: nextStep.stageId,
          qty: qtyToMove,
          totalPcbQty: qtyToMove,
          custPnlQty: qtyToMove,
          prodPnlQty: Math.ceil(qtyToMove / 4),
          prodPnlAreaSqm: areaToMove,
          custPnlAreaSqm: areaToMove,
          status: SubJobCardStatus.IN_STAGE,
          qrCodeValue: `RFE-SJC-${newSubCardNo}-${Date.now().toString().slice(-4)}`,
          createdById: userId,
        },
      });

      return this.findOne(jobCardId);
    });
  }
}

