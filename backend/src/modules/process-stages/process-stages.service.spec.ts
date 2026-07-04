import { Test, TestingModule } from '@nestjs/testing';
import { ProcessStagesService } from './process-stages.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';

describe('ProcessStagesService', () => {
  let service: ProcessStagesService;

  const mockPrisma = {
    processStage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    processFlowMaster: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessStagesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProcessStagesService>(ProcessStagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException on duplicate process name', async () => {
    mockPrisma.processStage.findUnique.mockResolvedValue({ id: 's-1', name: 'Drilling' });
    await expect(service.create({ name: 'Drilling' })).rejects.toThrow(ConflictException);
  });
});
