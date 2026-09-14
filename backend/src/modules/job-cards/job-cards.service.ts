import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobCardStatus, SubJobCardStatus, POStatus } from '@prisma/client';
import * as qrcode from 'qrcode';

@Injectable()
export class JobCardsService {
  constructor(private prisma: PrismaService) {}

  async generateFromPo(customerPoId: string, createdById: string) {
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

    return this.prisma.jobCard.findMany({
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
  }

  async findOne(id: string) {
    const jobCard = await this.prisma.jobCard.findUnique({
      where: { id },
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
      throw new NotFoundException(`Job Card with ID "${id}" not found`);
    }

    return jobCard;
  }

  async splitJobCard(id: string, splitsInput: any, createdById: string) {
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

      return this.findOne(id);
    });
  }

  async createJobCard(data: any, createdById: string) {
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
      // Find or create default ProcessFlowMaster
      processFlow = await this.prisma.processFlowMaster.create({
        data: {
          name: data.jobFlowSelection || 'PF-01',
          totalSteps: 19,
          createdById,
        },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      });
    }

    // Find or fallback customer & product
    let customer = await this.prisma.customer.findFirst({
      where: { code: data.customerCode },
    });
    if (!customer) {
      customer = await this.prisma.customer.findFirst();
    }

    let product = await this.prisma.product.findFirst({
      where: { specCardNo: data.rfePartCode },
    });
    if (!product) {
      product = await this.prisma.product.findFirst();
    }

    let customerPO = await this.prisma.customerPO.findFirst({
      where: { customerId: customer?.id },
    });

    return this.prisma.$transaction(async (tx) => {
      const fallbackPo = customerPO || (await tx.customerPO.findFirst());
      const jobCard = await tx.jobCard.create({
        data: {
          jobCardNo,
          customerPoId: fallbackPo?.id || '',
          productId: product?.id || fallbackPo?.productId || (await tx.product.findFirst())?.id || '',
          processFlowMasterId: processFlow?.id || '',
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
              currentStageId: data.autoLaunch ? processFlow?.steps?.[0]?.stageId || null : null,
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
            currentStageId: data.autoLaunch ? processFlow?.steps?.[0]?.stageId || null : null,
            qrCodeValue: `RFE-SJC-${subJobCardNo}-${Date.now().toString().slice(-4)}`,
            createdById,
          },
        });
      }

      return this.findOne(jobCard.id);
    });
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
    const jobCard = await this.prisma.jobCard.findUnique({ where: { id } });
    if (!jobCard) {
      throw new NotFoundException(`Job Card with ID "${id}" not found`);
    }

    const data: any = { status };
    if (status === JobCardStatus.COMPLETED && !jobCard.completedAt) {
      data.completedAt = new Date();
    }

    return this.prisma.jobCard.update({
      where: { id },
      data,
      include: {
        customerPO: { include: { customer: true } },
        product: true,
        subJobCards: { include: { currentStage: true }, orderBy: { subJobCardNo: 'asc' } },
      },
    });
  }

  async getQrCodeImage(id: string) {
    const jobCard = await this.prisma.jobCard.findUnique({
      where: { id },
      include: {
        product: true,
        customerPO: { include: { customer: true } },
      },
    });

    if (!jobCard) {
      throw new NotFoundException(`Job Card with ID "${id}" not found`);
    }

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
    const jobCard = await this.prisma.jobCard.findUnique({
      where: { id },
      include: { subJobCards: true },
    });
    if (!jobCard) {
      throw new NotFoundException(`Job Card with ID "${id}" not found`);
    }

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
      roleName.includes('SUPER') ||
      roleName.includes('MASTER') ||
      roleName.includes('ADMIN') ||
      roleName === 'SUPER_ADMIN' ||
      roleName === 'SUPER ADMIN';

    if (!isSuperAdminOrMaster) {
      throw new ForbiddenException(
        'Forbidden (403): Only Super Admin / Master role is authorized to delete Job Cards. Action rejected.'
      );
    }

    const jobCard = await this.prisma.jobCard.findUnique({
      where: { id },
      include: { subJobCards: true },
    });
    if (!jobCard) {
      throw new NotFoundException(`Job Card with ID "${id}" not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      const subCardIds = (jobCard.subJobCards || []).map((s) => s.id);
      if (subCardIds.length > 0) {
        await tx.stageMovementLog.deleteMany({
          where: { subJobCardId: { in: subCardIds } },
        });
        await tx.subJobCard.deleteMany({
          where: { jobCardId: id },
        });
      }
      await tx.jobCard.delete({ where: { id } });
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
    if (isNaN(qtyToMove) || qtyToMove <= 0 || qtyToMove >= subCard.qty) {
      throw new BadRequestException(
        `Quantity to move (${qtyToMove}) must be greater than 0 and less than remaining lot quantity (${subCard.qty})`,
      );
    }

    const steps = (subCard as any).jobCard?.processFlowMaster?.steps || [];
    const currentStep = steps.find((s: any) => s.stageId === subCard?.currentStageId);
    const currentStepOrder = currentStep ? currentStep.stepOrder : 1;
    const nextStep = steps.find((s: any) => s.stepOrder > currentStepOrder);

    if (!nextStep) {
      throw new BadRequestException('Job is already at the final stage and cannot move further');
    }

    const currentTotalArea = subCard.prodPnlAreaSqm || 0;
    const areaToMove = body.areaToMove
      ? Number(body.areaToMove)
      : currentTotalArea > 0
        ? Number(((currentTotalArea * qtyToMove) / subCard.qty).toFixed(2))
        : 0;
    const remainingQty = subCard.qty - qtyToMove;
    const remainingArea = Number(Math.max(0, currentTotalArea - areaToMove).toFixed(2));

    const userId = user?.id || user?.sub || user?.userId || subCard.createdById;

    return this.prisma.$transaction(async (tx) => {
      // 1. Log partial movement
      await tx.stageMovementLog.create({
        data: {
          subJobCardId: subCard.id,
          stageId: subCard.currentStageId || steps[0]?.stageId || '',
          qtyReceived: subCard.qty,
          qtyProcessed: subCard.qty,
          qtyForwarded: qtyToMove,
          qtyRejected: 0,
          qtyHold: 0,
          rejectionReason: body.pendingWorkReason || null,
          remarkType: body.remarkType || 'INCOMPLETE_MOVEMENT',
          remarks: body.remark || `Uncompleted / Partial Job Movement: ${qtyToMove} PNL moved to next stage (${remainingQty} PNL retained)`,
          createdById: userId,
        },
      });

      // 2. Update remaining lot at current stage
      await tx.subJobCard.update({
        where: { id: subCard.id },
        data: {
          qty: remainingQty,
          prodPnlQty: remainingQty,
          prodPnlAreaSqm: remainingArea,
        },
      });

      // 3. Create moved portion at next stage
      const existingChildrenCount = await tx.subJobCard.count({
        where: { parentSubJobCardId: subCard.id },
      });
      const suffix = String.fromCharCode(65 + existingChildrenCount); // A, B, C...
      const newSubCardNo = `${subCard.subJobCardNo}-${suffix}`;

      await tx.subJobCard.create({
        data: {
          subJobCardNo: newSubCardNo,
          jobCardId: subCard.jobCardId,
          parentSubJobCardId: subCard.id,
          currentStageId: nextStep.stageId,
          qty: qtyToMove,
          prodPnlQty: qtyToMove,
          prodPnlAreaSqm: areaToMove,
          custPnlAreaSqm: subCard.custPnlAreaSqm
            ? Number(((subCard.custPnlAreaSqm * qtyToMove) / subCard.qty).toFixed(2))
            : null,
          status: SubJobCardStatus.IN_STAGE,
          qrCodeValue: `RFE-SJC-${newSubCardNo}-${Date.now().toString().slice(-4)}`,
          createdById: userId,
        },
      });

      return this.findOne(jobCardId);
    });
  }
}

