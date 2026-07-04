import { Test, TestingModule } from '@nestjs/testing';
import { RejectionsController } from './rejections.controller';

describe('RejectionsController', () => {
  let controller: RejectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RejectionsController],
    }).compile();

    controller = module.get<RejectionsController>(RejectionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
