import { Test, TestingModule } from '@nestjs/testing';
import { PortalService } from './portal.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('PortalService', () => {
  let service: PortalService;

  const mockPrisma = {
    customerPortalAccess: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
    customerPO: {
      findMany: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('portal-jwt'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortalService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<PortalService>(PortalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw Unauthorized when login credentials invalid', async () => {
    mockPrisma.customerPortalAccess.findUnique.mockResolvedValue(null);
    await expect(service.login('invalid@client.com', 'pass')).rejects.toThrow(UnauthorizedException);
  });

  it('should get customer orders from database', async () => {
    const mockOrders = [{ id: 'po-1', poNo: 'PO-100', customerId: 'cust-1' }];
    mockPrisma.customerPO.findMany.mockResolvedValueOnce(mockOrders);

    const result = await service.getOrders('cust-1');
    expect(result.customerId).toBe('cust-1');
    expect(result.orders).toEqual(mockOrders);
    expect(mockPrisma.customerPO.findMany).toHaveBeenCalledWith({
      where: { customerId: 'cust-1' },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    });
  });
});
