import { Controller, Get, Head } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Head()
  @Public()
  @ApiOperation({ summary: 'Root health check for cloud platform monitoring (Render/Railway)' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async rootCheck() {
    return {
      status: 'ok',
      service: 'RF Electro PCB ERP Backend',
      timestamp: new Date().toISOString(),
      docs: '/api/docs',
    };
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Liveness check for VPS / Docker monitoring' })
  @ApiResponse({ status: 200, description: 'Service is alive and database is responsive' })
  async check() {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'unreachable';
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'PCB ERP Backend',
      database: dbStatus,
    };
  }
}
