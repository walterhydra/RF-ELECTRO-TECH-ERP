import { Test, TestingModule } from '@nestjs/testing';
import { RejectionsService } from './rejections.service';

describe('RejectionsService', () => {
  let service: RejectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RejectionsService],
    }).compile();

    service = module.get<RejectionsService>(RejectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
