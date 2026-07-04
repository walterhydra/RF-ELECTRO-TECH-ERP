import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    companyName: string;
    code?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    gstNo?: string;
  }) {
    if (!dto.companyName) {
      throw new BadRequestException('Company Name is required');
    }

    const existing = await this.prisma.customer.findUnique({
      where: { companyName: dto.companyName },
    });
    if (existing) {
      throw new ConflictException(`Customer with company name "${dto.companyName}" already exists`);
    }

    if (dto.code) {
      const existingCode = await this.prisma.customer.findUnique({
        where: { code: dto.code },
      });
      if (existingCode) {
        throw new ConflictException(`Customer code "${dto.code}" is already in use`);
      }
    }

    return this.prisma.customer.create({
      data: {
        companyName: dto.companyName,
        code: dto.code || null,
        contactPerson: dto.contactPerson || null,
        email: dto.email ? dto.email.toLowerCase() : null,
        phone: dto.phone || null,
        address: dto.address || null,
        gstNo: dto.gstNo || null,
        isActive: true,
      },
    });
  }

  async findAll(query?: { search?: string; isActive?: string }) {
    const where: any = {};
    if (query?.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }
    if (query?.search) {
      where.OR = [
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { contactPerson: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { companyName: 'asc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true, specCardNo: true, name: true, code: true, pcbSize: true, layers: true, isActive: true },
        },
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(id: string, dto: {
    companyName?: string;
    code?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    gstNo?: string;
    isActive?: boolean;
  }) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const data: any = {};
    if (dto.companyName !== undefined && dto.companyName !== customer.companyName) {
      const existing = await this.prisma.customer.findUnique({ where: { companyName: dto.companyName } });
      if (existing) throw new ConflictException('Company name already in use');
      data.companyName = dto.companyName;
    }
    if (dto.code !== undefined && dto.code !== customer.code) {
      if (dto.code) {
        const existingCode = await this.prisma.customer.findUnique({ where: { code: dto.code } });
        if (existingCode) throw new ConflictException('Customer code already in use');
      }
      data.code = dto.code || null;
    }
    if (dto.contactPerson !== undefined) data.contactPerson = dto.contactPerson || null;
    if (dto.email !== undefined) data.email = dto.email ? dto.email.toLowerCase() : null;
    if (dto.phone !== undefined) data.phone = dto.phone || null;
    if (dto.address !== undefined) data.address = dto.address || null;
    if (dto.gstNo !== undefined) data.gstNo = dto.gstNo || null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async toggleStatus(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return this.prisma.customer.update({
      where: { id },
      data: { isActive: !customer.isActive },
    });
  }

  async provisionPortalAccess(customerId: string, email: string, password?: string) {
    if (!email) throw new BadRequestException('Email is required for portal access');

    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const existingAccess = await this.prisma.customerPortalAccess.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingAccess) {
      throw new ConflictException('This email is already registered for portal access');
    }

    const tempPassword = password || crypto.randomBytes(4).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const access = await this.prisma.customerPortalAccess.create({
      data: {
        customerId,
        email: email.toLowerCase(),
        passwordHash,
        isActive: true,
      },
    });

    // Simulate sending email
    console.log(`\n=========================================`);
    console.log(`[SIMULATED EMAIL] Customer Portal Access Provisioned`);
    console.log(`To: ${access.email}`);
    console.log(`Customer: ${customer.companyName}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log(`Please login and change your password immediately.`);
    console.log(`=========================================\n`);

    return {
      success: true,
      message: 'Portal access provisioned successfully',
      accessId: access.id,
      email: access.email,
    };
  }
}
