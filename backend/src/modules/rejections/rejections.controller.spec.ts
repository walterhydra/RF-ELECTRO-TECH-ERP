import { Test, TestingModule } from '@nestjs/testing';
import { RejectionsController } from './rejections.controller';
import { RejectionsService } from './rejections.service';

describe('RejectionsController', () => {
  let controller: RejectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RejectionsController],
      providers: [
        {
          provide: RejectionsService,
          useValue: {
            getRejectionsQueue: jest.fn(),
            reviewRejection: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RejectionsController>(RejectionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
