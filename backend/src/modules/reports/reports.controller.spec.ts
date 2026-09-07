import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            getWipReport: jest.fn(),
            getRejectionReport: jest.fn(),
            getReworkReport: jest.fn(),
            getTraceabilityReport: jest.fn(),
            getOrdersReport: jest.fn(),
            getJobCardsReport: jest.fn(),
            getDispatchReport: jest.fn(),
            getDailyProductionReport: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
