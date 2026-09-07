import { Test, TestingModule } from '@nestjs/testing';
import { RejectionsService } from './rejections.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RejectionsService', () => {
  let service: RejectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RejectionsService,
        {
          provide: PrismaService,
          useValue: {
            stageMovementLog: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RejectionsService>(RejectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
