import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { POStatus } from '@prisma/client';

@Injectable()
export class CustomerPosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    poNo: string;
    customerId: string;
    productId: string;
    orderQty: number;
    poDate: string | Date;
    expectedDeliveryDate?: string | Date;
    status?: POStatus;
    attachmentUrl?: string;
    notes?: string;
  }, createdById: string) {
    if (!dto.poNo || !dto.customerId || !dto.productId || !dto.orderQty || !dto.poDate) {
      throw new BadRequestException('poNo, customerId, productId, orderQty, and poDate are required');
    }

    if (Number(dto.orderQty) <= 0) {
      throw new BadRequestException('Order quantity must be greater than 0');
    }

    const existingPo = await this.prisma.customerPO.findUnique({
      where: { poNo: dto.poNo },
    });
    if (existingPo) {
      throw new ConflictException(`Purchase Order with number "${dto.poNo}" already exists`);
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${dto.customerId}" not found`);
    }
    if (!customer.isActive) {
      throw new BadRequestException(`Customer "${customer.companyName}" is currently inactive`);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product Spec Card with ID "${dto.productId}" not found`);
    }

    const poDate = new Date(dto.poDate);
    const expectedDeliveryDate = dto.expectedDeliveryDate
      ? new Date(dto.expectedDeliveryDate)
      : new Date(poDate.getTime() + 14 * 24 * 60 * 60 * 1000); // default 14 days later

    return this.prisma.customerPO.create({
      data: {
        poNo: dto.poNo,
        customerId: dto.customerId,
        productId: dto.productId,
        orderQty: Number(dto.orderQty),
        poDate,
        expectedDeliveryDate,
        status: dto.status || POStatus.OPEN,
        attachmentUrl: dto.attachmentUrl || null,
        notes: dto.notes || null,
        createdById,
      },
      include: {
        customer: true,
        product: true,
      },
    });
  }

  async findAll(query?: {
    status?: string;
    customerId?: string;
    productId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: any = {};

    if (query?.status) {
      where.status = query.status as POStatus;
    }
    if (query?.customerId) {
      where.customerId = query.customerId;
    }
    if (query?.productId) {
      where.productId = query.productId;
    }
    if (query?.dateFrom || query?.dateTo) {
      where.poDate = {};
      if (query.dateFrom) {
        where.poDate.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.poDate.lte = new Date(query.dateTo);
      }
    }
    if (query?.search) {
      where.OR = [
        { poNo: { contains: query.search, mode: 'insensitive' } },
        { product: { name: { contains: query.search, mode: 'insensitive' } } },
        { product: { code: { contains: query.search, mode: 'insensitive' } } },
        { product: { specCardNo: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.customerPO.findMany({
      where,
      include: {
        customer: true,
        product: true,
        jobCards: {
          select: { id: true, jobCardNo: true, status: true, totalQty: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.customerPO.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        jobCards: {
          include: {
            subJobCards: true,
          },
        },
      },
    });

    if (!po) {
      throw new NotFoundException(`Purchase Order with ID "${id}" not found`);
    }
    return po;
  }

  async update(id: string, dto: {
    orderQty?: number;
    expectedDeliveryDate?: string | Date;
    status?: POStatus;
    attachmentUrl?: string;
    notes?: string;
  }) {
    const po = await this.findOne(id);

    if (po.jobCards && po.jobCards.length > 0) {
      if (dto.orderQty !== undefined && Number(dto.orderQty) !== po.orderQty) {
        throw new BadRequestException('Cannot modify order quantity after Job Cards have been generated for this PO');
      }
    }

    const data: any = {};
    if (dto.orderQty !== undefined) data.orderQty = Number(dto.orderQty);
    if (dto.expectedDeliveryDate !== undefined) data.expectedDeliveryDate = new Date(dto.expectedDeliveryDate);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.attachmentUrl !== undefined) data.attachmentUrl = dto.attachmentUrl || null;
    if (dto.notes !== undefined) data.notes = dto.notes || null;

    return this.prisma.customerPO.update({
      where: { id },
      data,
      include: {
        customer: true,
        product: true,
        jobCards: true,
      },
    });
  }

  async updateStatus(id: string, status: POStatus) {
    await this.findOne(id);
    return this.prisma.customerPO.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        product: true,
      },
    });
  }
}
