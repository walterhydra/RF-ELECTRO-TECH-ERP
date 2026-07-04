import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;

  const mockPrisma = {
    customer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException on duplicate companyName', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c-1', companyName: 'Acme Corp' });
    await expect(service.create({ companyName: 'Acme Corp' })).rejects.toThrow(ConflictException);
  });
});
