import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JobCardStatus, POStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PortalService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async login(email: string, pass: string) {
    if (!email || !pass) {
      throw new BadRequestException('Email and password are required');
    }

    const access = await this.prisma.customerPortalAccess.findUnique({
      where: { email: email.toLowerCase() },
      include: { customer: true },
    });

    if (!access || !access.isActive) {
      throw new UnauthorizedException('Invalid portal credentials or account inactive');
    }

    const isMatch = await bcrypt.compare(pass, access.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid portal credentials');
    }

    await this.prisma.customerPortalAccess.update({
      where: { id: access.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      sub: access.id,
      email: access.email,
      role: 'CUSTOMER',
      customerId: access.customerId,
      customerName: access.customer.companyName,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      customer: {
        id: access.customerId,
        companyName: access.customer.companyName,
        code: access.customer.code,
        email: access.email,
      },
    };
  }

  async getOrders(customerId: string) {
    const orders = await this.prisma.customerPO.findMany({
      where: { customerId },
      include: {
        product: {
          select: { id: true, name: true, code: true, specCardNo: true, pcbSize: true, layers: true },
        },
        jobCards: {
          select: { id: true, jobCardNo: true, status: true, totalQty: true, completedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      customerId,
      orders,
    };
  }

  async getNotifications(portalUserId: string) {
    return this.prisma.notification.findMany({
      where: { recipientCustomerId: portalUserId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getDispatches(customerId: string) {
    return this.prisma.dispatch.findMany({
      where: { jobCard: { customerPO: { customerId } } },
      include: {
        jobCard: { select: { jobCardNo: true, product: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createPortalUser(dto: { customerId: string; email: string; password?: string }) {
    const emailLower = dto.email.toLowerCase();
    const existing = await this.prisma.customerPortalAccess.findUnique({ where: { email: emailLower } });
    if (existing) {
      throw new ConflictException('Customer login with this email already exists');
    }

    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const rawPass = dto.password || 'client123';
    const passwordHash = await bcrypt.hash(rawPass, 10);

    const access = await this.prisma.customerPortalAccess.create({
      data: {
        customerId: dto.customerId,
        email: emailLower,
        passwordHash,
        isActive: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = access;
    return result;
  }

  async getDashboardMetrics(customerId: string) {
    const activeOrders = await this.prisma.customerPO.count({
      where: { customerId, status: { notIn: [POStatus.COMPLETED, POStatus.CANCELLED] } }
    });
    const totalOrders = await this.prisma.customerPO.count({
      where: { customerId }
    });

    const activeJobCards = await this.prisma.jobCard.findMany({
      where: { customerPO: { customerId }, status: { notIn: [JobCardStatus.COMPLETED, JobCardStatus.DELIVERED, JobCardStatus.DISPATCHED] } },
      select: { totalQty: true }
    });
    const pendingQuantity = activeJobCards.reduce((acc, jc) => acc + jc.totalQty, 0);

    return { totalOrders, activeOrders, pendingQuantity };
  }

  async getProducts(customerId: string) {
    return this.prisma.product.findMany({
      where: { purchaseOrders: { some: { customerId } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getJobCards(customerId: string) {
    return this.prisma.jobCard.findMany({
      where: { customerPO: { customerId } },
      include: {
        product: { select: { name: true, code: true } },
        customerPO: { select: { poNo: true, expectedDeliveryDate: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOrderDetails(customerId: string, orderId: string) {
    const order = await this.prisma.customerPO.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        jobCards: true
      }
    });

    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    const pendingQty = order.jobCards.reduce((acc, jc) => {
      if (jc.status !== JobCardStatus.COMPLETED && jc.status !== JobCardStatus.DELIVERED && jc.status !== JobCardStatus.CANCELLED) {
        return acc + jc.totalQty;
      }
      return acc;
    }, 0);

    const currentStageLabel = order.status === POStatus.OPEN ? 'In production' : order.status;

    return {
      poNo: order.poNo,
      productName: order.product.name,
      currentStageLabel,
      pendingQty: order.status === POStatus.OPEN ? pendingQty || order.orderQty : 0,
      edd: order.expectedDeliveryDate,
      dispatchStatus: order.status
    };
  }

  async getTraceability(customerId: string, orderId: string) {
    // First, confirm ownership
    const order = await this.prisma.customerPO.findUnique({
      where: { id: orderId },
      include: { jobCards: true }
    });

    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    const jobCardIds = order.jobCards.map(jc => jc.id);

    // Fetch the logs and MASK the internal rejection remarks and user info
    const logs = await this.prisma.stageMovementLog.findMany({
      where: { subJobCard: { jobCardId: { in: jobCardIds } } },
      include: {
        stage: { select: { name: true, defaultOrder: true } },
        subJobCard: { select: { subJobCardNo: true, jobCard: { select: { jobCardNo: true, status: true, totalQty: true, launchedAt: true, createdAt: true } } } }
      },
      orderBy: { createdAt: 'asc' }
    });

    const maskedLogs = logs.map(log => ({
      id: log.id,
      stageName: log.stage.name,
      sequence: log.stage.defaultOrder,
      subJobCardNo: log.subJobCard.subJobCardNo,
      qtyReceived: log.qtyReceived,
      qtyProcessed: log.qtyProcessed,
      qtyForwarded: log.qtyForwarded,
      qtyRejected: log.qtyRejected,
      qtyHold: log.qtyHold,
      scannedAt: log.createdAt,
      // Intentionally omitting 'remarks', 'rejectionReason', 'createdById', 'qcRemarks' for customer privacy
    }));

    return {
      orderId,
      poNo: order.poNo,
      logs: maskedLogs
    };
  }
}
