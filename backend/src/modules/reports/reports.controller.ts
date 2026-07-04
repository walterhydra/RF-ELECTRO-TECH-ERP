import { Controller, Get, UseGuards, Param, Query, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('rejection-summary')
  getRejectionSummary() {
    return this.reportsService.getRejectionSummary();
  }

  @Get('rework-status')
  getReworkStatus() {
    return this.reportsService.getReworkStatus();
  }

  @Get('daily-production')
  getDailyProduction() {
    return this.reportsService.getDailyProduction();
  }

  @Get('wip')
  getWip() {
    return this.reportsService.getWip();
  }

  @Get('job-cards')
  getJobCards() {
    return this.reportsService.getJobCards();
  }

  @Get('dispatch')
  getDispatch() {
    return this.reportsService.getDispatch();
  }

  @Get('orders')
  getOrders() {
    return this.reportsService.getOrders();
  }

  @Get('traceability/:jobCardNo')
  getTraceability(@Param('jobCardNo') jobCardNo: string) {
    return this.reportsService.getTraceability(jobCardNo);
  }

  @Get('export')
  async exportData(@Query('type') type: string, @Res() res: any) {
    const data = await this.reportsService.exportData(type);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
    return res.send(data);
  }
}
