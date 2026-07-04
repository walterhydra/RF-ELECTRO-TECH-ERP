import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleCode } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    roleId: string;
    departmentId?: string;
    assignedStageId?: string;
  }) {
    if (!dto.email || !dto.name || !dto.roleId) {
      throw new BadRequestException('Name, email, and roleId are required');
    }

    const emailLower = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      throw new ConflictException(`User with email ${emailLower} already exists`);
    }

    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) {
      throw new NotFoundException('Specified role not found');
    }

    // Rule: Process Operators must be assigned to a specific manufacturing process stage
    if (role.name === RoleCode.PROCESS_OPERATOR && !dto.assignedStageId) {
      throw new BadRequestException('Process Operators must be assigned to a specific Process Stage (assignedStageId is required).');
    }

    const rawPassword = dto.password || 'password123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: emailLower,
        passwordHash,
        phone: dto.phone || null,
        roleId: dto.roleId,
        departmentId: dto.departmentId || null,
        assignedStageId: dto.assignedStageId || null,
        isActive: true,
      },
      include: {
        role: true,
        department: true,
        assignedStage: true,
      },
    });

    const { passwordHash: _, ...profile } = user;
    return profile;
  }

  async findAll(query?: { roleId?: string; departmentId?: string; assignedStageId?: string; search?: string }) {
    const where: any = {};
    if (query?.roleId) where.roleId = query.roleId;
    if (query?.departmentId) where.departmentId = query.departmentId;
    if (query?.assignedStageId) where.assignedStageId = query.assignedStageId;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        role: true,
        department: true,
        assignedStage: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        department: true,
        assignedStage: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async update(id: string, dto: {
    name?: string;
    phone?: string;
    roleId?: string;
    departmentId?: string;
    assignedStageId?: string;
    password?: string;
    isActive?: boolean;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone || null;
    if (dto.departmentId !== undefined) data.departmentId = dto.departmentId || null;
    if (dto.assignedStageId !== undefined) data.assignedStageId = dto.assignedStageId || null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    let targetRoleName = user.role.name;
    if (dto.roleId && dto.roleId !== user.roleId) {
      const newRole = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
      if (!newRole) throw new NotFoundException('New role not found');
      targetRoleName = newRole.name;
      data.roleId = dto.roleId;
    }

    if (targetRoleName === RoleCode.PROCESS_OPERATOR) {
      const finalStageId = dto.assignedStageId !== undefined ? dto.assignedStageId : user.assignedStageId;
      if (!finalStageId) {
        throw new BadRequestException('Process Operators must be assigned to a specific Process Stage.');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
        department: true,
        assignedStage: true,
      },
    });

    const { passwordHash, ...rest } = updated;
    return rest;
  }

  async toggleStatus(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      include: { role: true, department: true, assignedStage: true },
    });
    const { passwordHash, ...rest } = updated;
    return rest;
  }

  async getRoles() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  async getDepartments() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }
}
