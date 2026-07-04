import { Test, TestingModule } from '@nestjs/testing';
import { ProductMasterService } from './product-master.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';

describe('ProductMasterService', () => {
  let service: ProductMasterService;

  const mockPrisma = {
    product: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductMasterService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductMasterService>(ProductMasterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return standard PCB specification options', () => {
    const options = service.getSpecificationOptions();
    expect(options.layers).toContain(4);
    expect(options.surfaceFinish).toContain('ENIG (Immersion Gold)');
  });

  it('should throw ConflictException if product code exists', async () => {
    mockPrisma.product.findFirst.mockResolvedValue({ id: 'p-1', code: 'PCB-001' });
    await expect(
      service.create({
        name: 'Test PCB',
        code: 'PCB-001',
        pcbSize: '100x100',
        layers: 2,
        thicknessMm: 1.6,
        copperWeight: '1oz',
        solderMask: 'Green',
        legend: 'White',
        surfaceFinish: 'HASL - Lead Free',
        processFlowId: 'flow-1',
        createdById: 'user-1',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
