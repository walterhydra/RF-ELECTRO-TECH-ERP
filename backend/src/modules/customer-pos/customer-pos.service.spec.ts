import { Test, TestingModule } from '@nestjs/testing';
import { CustomerPosService } from './customer-pos.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { POStatus } from '@prisma/client';

describe('CustomerPosService', () => {
  let service: CustomerPosService;
  let prisma: PrismaService;

  const mockPrismaService = {
    customerPO: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerPosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CustomerPosService>(CustomerPosService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      poNo: 'PO-001',
      customerId: 'cust-1',
      productId: 'prod-1',
      orderQty: 500,
      poDate: '2026-07-03',
    };

    it('should create a PO successfully', async () => {
      mockPrismaService.customerPO.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.customer.findUnique.mockResolvedValueOnce({ id: 'cust-1', isActive: true });
      mockPrismaService.product.findUnique.mockResolvedValueOnce({ id: 'prod-1', name: 'PCB A' });
      mockPrismaService.customerPO.create.mockResolvedValueOnce({ id: 'po-1', ...dto, status: POStatus.OPEN });

      const result = await service.create(dto, 'user-1');
      expect(result.id).toBe('po-1');
      expect(mockPrismaService.customerPO.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if orderQty is 0 or less', async () => {
      await expect(service.create({ ...dto, orderQty: 0 }, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if poNo already exists', async () => {
      mockPrismaService.customerPO.findUnique.mockResolvedValueOnce({ id: 'existing-po' });
      await expect(service.create(dto, 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockPrismaService.customerPO.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.customer.findUnique.mockResolvedValueOnce(null);
      await expect(service.create(dto, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if customer is inactive', async () => {
      mockPrismaService.customerPO.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.customer.findUnique.mockResolvedValueOnce({ id: 'cust-1', isActive: false });
      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should throw BadRequestException when updating orderQty if Job Cards are already generated', async () => {
      mockPrismaService.customerPO.findUnique.mockResolvedValueOnce({
        id: 'po-1',
        orderQty: 500,
        jobCards: [{ id: 'job-1' }],
      });

      await expect(service.update('po-1', { orderQty: 600 })).rejects.toThrow(BadRequestException);
    });

    it('should allow updating orderQty if no Job Cards are generated', async () => {
      mockPrismaService.customerPO.findUnique.mockResolvedValueOnce({
        id: 'po-1',
        orderQty: 500,
        jobCards: [],
      });
      mockPrismaService.customerPO.update.mockResolvedValueOnce({ id: 'po-1', orderQty: 600 });

      const result = await service.update('po-1', { orderQty: 600 });
      expect(result.orderQty).toBe(600);
    });
  });
});
