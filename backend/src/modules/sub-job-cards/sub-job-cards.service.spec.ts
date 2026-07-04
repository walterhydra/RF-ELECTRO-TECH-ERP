import { Test, TestingModule } from '@nestjs/testing';
import { SubJobCardsService } from './sub-job-cards.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { SubJobCardStatus } from '@prisma/client';

describe('SubJobCardsService', () => {
  let service: SubJobCardsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    subJobCard: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    jobCard: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubJobCardsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SubJobCardsService>(SubJobCardsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByQrValue', () => {
    it('should find sub job card by QR code value', async () => {
      const mockSubCard = { id: 'sub-1', qrCodeValue: 'RFE-SJC-JC001-1', subJobCardNo: 'JC001-1' };
      mockPrismaService.subJobCard.findFirst.mockResolvedValue(mockSubCard);

      const result = await service.findByQrValue('RFE-SJC-JC001-1');

      expect(result.type).toBe('SUB_JOB_CARD');
      expect(result.data).toEqual(mockSubCard);
    });

    it('should fallback to parent Job Card if sub card not found', async () => {
      mockPrismaService.subJobCard.findFirst.mockResolvedValue(null);
      const mockJobCard = { id: 'jc-1', qrCodeValue: 'RFE-JC-JC001', jobCardNo: 'JC001' };
      mockPrismaService.jobCard.findFirst.mockResolvedValue(mockJobCard);

      const result = await service.findByQrValue('RFE-JC-JC001');

      expect(result.type).toBe('JOB_CARD');
      expect(result.data).toEqual(mockJobCard);
    });

    it('should throw NotFoundException if neither sub card nor parent job card matched', async () => {
      mockPrismaService.subJobCard.findFirst.mockResolvedValue(null);
      mockPrismaService.jobCard.findFirst.mockResolvedValue(null);

      await expect(service.findByQrValue('INVALID-QR')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update sub job card status successfully', async () => {
      mockPrismaService.subJobCard.findUnique.mockResolvedValue({ id: 'sub-1' });
      mockPrismaService.subJobCard.update.mockResolvedValue({ id: 'sub-1', status: SubJobCardStatus.IN_STAGE });

      const result = await service.updateStatus('sub-1', SubJobCardStatus.IN_STAGE);
      expect(result.status).toBe(SubJobCardStatus.IN_STAGE);
    });
  });
});
