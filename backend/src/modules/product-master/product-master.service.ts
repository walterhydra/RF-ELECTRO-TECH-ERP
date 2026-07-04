import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductMasterService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    name: string;
    code: string;
    specCardNo?: string;
    customerId?: string;
    pcbSize: string;
    layers: number;
    thicknessMm: number;
    copperWeight: string;
    solderMask: string;
    legend: string;
    surfaceFinish: string;
    materialType?: string;
    panelSize?: string;
    qtyPerPanel?: number;
    specialInstructions?: string;
    processFlowId: string;
    createdById: string;
  }) {
    if (!dto.name || !dto.code || !dto.pcbSize || !dto.layers || !dto.processFlowId || !dto.createdById) {
      throw new BadRequestException('Name, code, pcbSize, layers, processFlowId, and createdById are required');
    }

    const existingCode = await this.prisma.product.findFirst({ where: { code: dto.code } });
    if (existingCode) {
      throw new ConflictException(`Product code "${dto.code}" is already in use`);
    }

    // Wrap Spec Card creation in a transaction to safely auto-generate sequential specCardNo if not provided
    return this.prisma.$transaction(async (tx) => {
      let specCardNo = dto.specCardNo;
      if (!specCardNo) {
        const count = await tx.product.count({ where: { isCurrentRevision: true } });
        specCardNo = `D${String(count + 1).padStart(3, '0')}`;
        const existingCard = await tx.product.findFirst({ where: { specCardNo } });
        if (existingCard) {
          specCardNo = `D${String(count + Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
        }
      } else {
        const existingCard = await tx.product.findFirst({ where: { specCardNo } });
        if (existingCard) {
          throw new ConflictException(`Spec Card Number "${specCardNo}" is already registered`);
        }
      }

      return tx.product.create({
        data: {
          specCardNo,
          revisionNo: 'Rev-00',
          isCurrentRevision: true,
          revisionReason: 'Initial specification release',
          name: dto.name,
          code: dto.code,
          customerId: dto.customerId || null,
          pcbSize: dto.pcbSize,
          layers: Number(dto.layers),
          thicknessMm: Number(dto.thicknessMm),
          copperWeight: dto.copperWeight,
          solderMask: dto.solderMask,
          legend: dto.legend,
          surfaceFinish: dto.surfaceFinish,
          materialType: dto.materialType || 'FR4',
          panelSize: dto.panelSize || null,
          qtyPerPanel: dto.qtyPerPanel ? Number(dto.qtyPerPanel) : 1,
          specialInstructions: dto.specialInstructions || null,
          processFlowId: dto.processFlowId,
          createdById: dto.createdById,
          isActive: true,
        },
        include: {
          customer: true,
          processFlow: {
            include: {
              steps: {
                include: { stage: true },
                orderBy: { stepOrder: 'asc' },
              },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });
    });
  }

  async findAll(query?: { customerId?: string; isActive?: string; search?: string; allRevisions?: string }) {
    const where: any = {};
    if (query?.allRevisions !== 'true') {
      where.isCurrentRevision = true;
    }
    if (query?.customerId) where.customerId = query.customerId;
    if (query?.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { specCardNo: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        customer: true,
        processFlow: {
          include: {
            steps: {
              include: { stage: true },
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        customer: true,
        processFlow: {
          include: {
            steps: {
              include: { stage: true },
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, dto: any) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.code !== undefined && dto.code !== product.code) {
      const existing = await this.prisma.product.findFirst({ where: { code: dto.code } });
      if (existing && existing.id !== id) throw new ConflictException('Product code already in use');
      data.code = dto.code;
    }
    if (dto.specCardNo !== undefined && dto.specCardNo !== product.specCardNo) {
      const existing = await this.prisma.product.findFirst({ where: { specCardNo: dto.specCardNo } });
      if (existing && existing.id !== id) throw new ConflictException('Spec Card Number already in use');
      data.specCardNo = dto.specCardNo;
    }
    if (dto.customerId !== undefined) data.customerId = dto.customerId || null;
    if (dto.pcbSize !== undefined) data.pcbSize = dto.pcbSize;
    if (dto.layers !== undefined) data.layers = Number(dto.layers);
    if (dto.thicknessMm !== undefined) data.thicknessMm = Number(dto.thicknessMm);
    if (dto.copperWeight !== undefined) data.copperWeight = dto.copperWeight;
    if (dto.solderMask !== undefined) data.solderMask = dto.solderMask;
    if (dto.legend !== undefined) data.legend = dto.legend;
    if (dto.surfaceFinish !== undefined) data.surfaceFinish = dto.surfaceFinish;
    if (dto.materialType !== undefined) data.materialType = dto.materialType;
    if (dto.panelSize !== undefined) data.panelSize = dto.panelSize || null;
    if (dto.qtyPerPanel !== undefined) data.qtyPerPanel = Number(dto.qtyPerPanel);
    if (dto.specialInstructions !== undefined) data.specialInstructions = dto.specialInstructions || null;
    if (dto.processFlowId !== undefined) data.processFlowId = dto.processFlowId;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        customer: true,
        processFlow: {
          include: {
            steps: {
              include: { stage: true },
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  async toggleStatus(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    });
  }

  async createRevision(id: string, dto: any) {
    const currentProduct = await this.prisma.product.findUnique({ where: { id } });
    if (!currentProduct) {
      throw new NotFoundException('Product Specification Card not found');
    }

    const currentRevStr = currentProduct.revisionNo || 'Rev-00';
    const revMatch = currentRevStr.match(/Rev-(\d+)/i);
    const nextRevNum = revMatch ? parseInt(revMatch[1], 10) + 1 : 1;
    const nextRevisionNo = `Rev-${String(nextRevNum).padStart(2, '0')}`;

    const existingRev = await this.prisma.product.findFirst({
      where: {
        specCardNo: currentProduct.specCardNo,
        revisionNo: nextRevisionNo,
      },
    });
    if (existingRev) {
      throw new ConflictException(`Revision ${nextRevisionNo} already exists for Spec Card ${currentProduct.specCardNo}`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { specCardNo: currentProduct.specCardNo },
        data: { isCurrentRevision: false },
      });

      return tx.product.create({
        data: {
          specCardNo: currentProduct.specCardNo,
          revisionNo: nextRevisionNo,
          parentProductId: currentProduct.id,
          isCurrentRevision: true,
          revisionReason: dto.revisionReason || 'Specification revision update',
          name: dto.name || currentProduct.name,
          code: dto.code || currentProduct.code,
          customerId: dto.customerId !== undefined ? (dto.customerId || null) : currentProduct.customerId,
          pcbSize: dto.pcbSize || currentProduct.pcbSize,
          layers: dto.layers !== undefined ? Number(dto.layers) : currentProduct.layers,
          thicknessMm: dto.thicknessMm !== undefined ? Number(dto.thicknessMm) : currentProduct.thicknessMm,
          copperWeight: dto.copperWeight || currentProduct.copperWeight,
          solderMask: dto.solderMask || currentProduct.solderMask,
          legend: dto.legend || currentProduct.legend,
          surfaceFinish: dto.surfaceFinish || currentProduct.surfaceFinish,
          materialType: dto.materialType || currentProduct.materialType,
          panelSize: dto.panelSize !== undefined ? (dto.panelSize || null) : currentProduct.panelSize,
          qtyPerPanel: dto.qtyPerPanel !== undefined ? Number(dto.qtyPerPanel) : currentProduct.qtyPerPanel,
          specialInstructions: dto.specialInstructions !== undefined ? (dto.specialInstructions || null) : currentProduct.specialInstructions,
          processFlowId: dto.processFlowId || currentProduct.processFlowId,
          createdById: dto.createdById || currentProduct.createdById,
          isActive: true,
        },
        include: {
          customer: true,
          processFlow: {
            include: {
              steps: {
                include: { stage: true },
                orderBy: { stepOrder: 'asc' },
              },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });
    });
  }

  async getRevisions(idOrSpecCardNo: string) {
    let specCardNo = idOrSpecCardNo;
    if (idOrSpecCardNo.includes('-') && idOrSpecCardNo.length > 30) {
      const prod = await this.prisma.product.findUnique({ where: { id: idOrSpecCardNo } });
      if (!prod) throw new NotFoundException('Product not found');
      specCardNo = prod.specCardNo;
    }

    return this.prisma.product.findMany({
      where: { specCardNo },
      include: {
        customer: true,
        processFlow: {
          include: {
            steps: {
              include: { stage: true },
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  getSpecificationOptions() {
    return {
      layers: [1, 2, 4, 6, 8, 10, 12, 16],
      thicknessMm: [0.4, 0.8, 1.0, 1.2, 1.6, 2.0, 2.4, 3.2],
      copperWeight: ['0.5oz', '1oz', '2oz', '3oz', '4oz'],
      solderMask: ['Green', 'Blue', 'Black', 'Red', 'White', 'Yellow', 'Matte Green', 'Matte Black', 'None'],
      legend: ['White', 'Black', 'Yellow', 'None'],
      surfaceFinish: [
        'ENIG (Immersion Gold)',
        'HASL - Lead Free',
        'HASL - Leaded',
        'Immersion Tin',
        'Immersion Silver',
        'OSP (Organic Solderability Preservative)',
        'Hard Gold',
      ],
      materialType: [
        'FR4 Standard (TG 130-140)',
        'FR4 High-TG (TG 170+)',
        'Aluminum Core',
        'Rogers 4350B / High Frequency',
        'Polyimide Flex / Rigid-Flex',
        'CEM-3',
      ],
    };
  }
}
