import { Test, TestingModule } from '@nestjs/testing';
import { JobCardsService } from './job-cards.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JobCardStatus, POStatus, SubJobCardStatus } from '@prisma/client';

describe('JobCardsService', () => {
  let service: JobCardsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    customerPO: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    jobCard: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    subJobCard: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobCardsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<JobCardsService>(JobCardsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateFromPo', () => {
    const mockPo = {
      id: 'po-1',
      poNo: 'PO-001',
      orderQty: 1000,
      status: POStatus.OPEN,
      productId: 'prod-1',
      product: { id: 'prod-1', processFlowId: 'flow-1' },
    };

    it('should generate a job card successfully from a PO', async () => {
      mockPrismaService.customerPO.findUnique.mockResolvedValue(mockPo);
      mockPrismaService.jobCard.findFirst.mockResolvedValue({ jobCardNo: 'JC005' });
      mockPrismaService.jobCard.create.mockResolvedValue({
        id: 'jc-1',
        jobCardNo: 'JC006',
        totalQty: 1000,
        status: JobCardStatus.CREATED,
      });

      const result = await service.generateFromPo('po-1', 'user-1');

      expect(result).toBeDefined();
      expect(mockPrismaService.jobCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobCardNo: 'JC006',
            totalQty: 1000,
            status: JobCardStatus.CREATED,
          }),
        })
      );
    });

    it('should throw NotFoundException if PO does not exist', async () => {
      mockPrismaService.customerPO.findUnique.mockResolvedValue(null);
      await expect(service.generateFromPo('po-x', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if PO is cancelled', async () => {
      mockPrismaService.customerPO.findUnique.mockResolvedValue({
        ...mockPo,
        status: POStatus.CANCELLED,
      });
      await expect(service.generateFromPo('po-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('splitJobCard', () => {
    const mockJc = {
      id: 'jc-1',
      jobCardNo: 'JC001',
      totalQty: 1000,
      status: JobCardStatus.CREATED,
      subJobCards: [],
    };

    it('should split successfully when sum of quantities equals totalQty', async () => {
      mockPrismaService.jobCard.findUnique.mockResolvedValue(mockJc);
      mockPrismaService.subJobCard.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.subJobCard.create
        .mockResolvedValueOnce({ id: 'sub-1', subJobCardNo: 'JC001-1', qty: 400 })
        .mockResolvedValueOnce({ id: 'sub-2', subJobCardNo: 'JC001-2', qty: 600 });

      const splits = [{ qty: 400 }, { qty: 600 }];
      const result = await service.splitJobCard('jc-1', splits, 'user-1');

      expect(mockPrismaService.subJobCard.create).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException when sum of quantities does not equal totalQty', async () => {
      mockPrismaService.jobCard.findUnique.mockResolvedValue(mockJc);
      const splits = [{ qty: 400 }, { qty: 500 }]; // Sum = 900 !== 1000

      await expect(service.splitJobCard('jc-1', splits, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
