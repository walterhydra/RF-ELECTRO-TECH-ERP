import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProcessStagesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    name: string;
    code?: string;
    description?: string;
    defaultOrder?: number;
    departmentId?: string;
  }) {
    if (!dto.name) {
      throw new BadRequestException('Process stage name is required');
    }

    const existingName = await this.prisma.processStage.findUnique({
      where: { name: dto.name },
    });
    if (existingName) {
      throw new ConflictException(`Process stage "${dto.name}" already exists`);
    }

    if (dto.code) {
      const existingCode = await this.prisma.processStage.findUnique({
        where: { code: dto.code },
      });
      if (existingCode) {
        throw new ConflictException(`Process code "${dto.code}" is already in use`);
      }
    }

    return this.prisma.processStage.create({
      data: {
        name: dto.name,
        code: dto.code || null,
        description: dto.description || null,
        defaultOrder: dto.defaultOrder ?? 0,
        departmentId: dto.departmentId || null,
        isActive: true,
      },
      include: {
        department: true,
        _count: { select: { assignedUsers: true } },
      },
    });
  }

  async findAll(query?: { isActive?: string; departmentId?: string; search?: string }) {
    const where: any = {};
    if (query?.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }
    if (query?.departmentId) {
      where.departmentId = query.departmentId;
    }
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.processStage.findMany({
      where,
      include: {
        department: true,
        _count: { select: { assignedUsers: true } },
      },
      orderBy: { defaultOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const stage = await this.prisma.processStage.findUnique({
      where: { id },
      include: {
        department: true,
        assignedUsers: {
          select: { id: true, name: true, email: true, phone: true, isActive: true },
        },
      },
    });
    if (!stage) {
      throw new NotFoundException('Process stage not found');
    }
    return stage;
  }

  async update(id: string, dto: {
    name?: string;
    code?: string;
    description?: string;
    defaultOrder?: number;
    departmentId?: string;
    isActive?: boolean;
  }) {
    const stage = await this.prisma.processStage.findUnique({ where: { id } });
    if (!stage) {
      throw new NotFoundException('Process stage not found');
    }

    const data: any = {};
    if (dto.name !== undefined && dto.name !== stage.name) {
      const existing = await this.prisma.processStage.findUnique({ where: { name: dto.name } });
      if (existing) throw new ConflictException('Process name already exists');
      data.name = dto.name;
    }
    if (dto.code !== undefined && dto.code !== stage.code) {
      if (dto.code) {
        const existingCode = await this.prisma.processStage.findUnique({ where: { code: dto.code } });
        if (existingCode) throw new ConflictException('Process code already in use');
      }
      data.code = dto.code || null;
    }
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.defaultOrder !== undefined) data.defaultOrder = dto.defaultOrder;
    if (dto.departmentId !== undefined) data.departmentId = dto.departmentId || null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.processStage.update({
      where: { id },
      data,
      include: {
        department: true,
        _count: { select: { assignedUsers: true } },
      },
    });
  }

  async toggleStatus(id: string) {
    const stage = await this.prisma.processStage.findUnique({ where: { id } });
    if (!stage) {
      throw new NotFoundException('Process stage not found');
    }
    return this.prisma.processStage.update({
      where: { id },
      data: { isActive: !stage.isActive },
      include: {
        department: true,
        _count: { select: { assignedUsers: true } },
      },
    });
  }

  // --- Process Flow Configuration Support ---
  async findAllFlows() {
    return this.prisma.processFlowMaster.findMany({
      include: {
        steps: {
          include: { stage: true },
          orderBy: { stepOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findFlowById(id: string) {
    const flow = await this.prisma.processFlowMaster.findUnique({
      where: { id },
      include: {
        steps: {
          include: { stage: true },
          orderBy: { stepOrder: 'asc' },
        },
        _count: { select: { products: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!flow) {
      throw new NotFoundException('Process Flow not found');
    }
    return flow;
  }

  async createFlow(dto: { name: string; stageIds: string[]; createdById: string }) {
    if (!dto.name || !dto.stageIds || !dto.stageIds.length || !dto.createdById) {
      throw new BadRequestException('Flow name, at least one stageId, and createdById are required');
    }

    const existing = await this.prisma.processFlowMaster.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Process flow "${dto.name}" already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      const flow = await tx.processFlowMaster.create({
        data: {
          name: dto.name,
          totalSteps: dto.stageIds.length,
          isActive: true,
          createdById: dto.createdById,
        },
      });

      for (let i = 0; i < dto.stageIds.length; i++) {
        await tx.processFlowStep.create({
          data: {
            processFlowMasterId: flow.id,
            stageId: dto.stageIds[i],
            stepOrder: i + 1,
          },
        });
      }

      return tx.processFlowMaster.findUnique({
        where: { id: flow.id },
        include: {
          steps: {
            include: { stage: true },
            orderBy: { stepOrder: 'asc' },
          },
        },
      });
    });
  }

  async updateFlow(id: string, dto: { name?: string; stageIds?: string[]; isActive?: boolean }) {
    const flow = await this.prisma.processFlowMaster.findUnique({ where: { id } });
    if (!flow) {
      throw new NotFoundException('Process flow not found');
    }

    if (dto.name && dto.name !== flow.name) {
      const existing = await this.prisma.processFlowMaster.findUnique({ where: { name: dto.name } });
      if (existing) throw new ConflictException(`Process flow "${dto.name}" already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      const data: any = {};
      if (dto.name !== undefined) data.name = dto.name;
      if (dto.isActive !== undefined) data.isActive = dto.isActive;
      if (dto.stageIds !== undefined) data.totalSteps = dto.stageIds.length;

      await tx.processFlowMaster.update({
        where: { id },
        data,
      });

      if (dto.stageIds !== undefined) {
        await tx.processFlowStep.deleteMany({ where: { processFlowMasterId: id } });
        for (let i = 0; i < dto.stageIds.length; i++) {
          await tx.processFlowStep.create({
            data: {
              processFlowMasterId: id,
              stageId: dto.stageIds[i],
              stepOrder: i + 1,
            },
          });
        }
      }

      return tx.processFlowMaster.findUnique({
        where: { id },
        include: {
          steps: {
            include: { stage: true },
            orderBy: { stepOrder: 'asc' },
          },
        },
      });
    });
  }
}
