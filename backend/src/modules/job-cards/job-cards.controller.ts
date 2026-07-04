import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobCardsService } from './job-cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JobCardStatus } from '@prisma/client';

@ApiTags('Job Cards')
@Controller('job-cards')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class JobCardsController {
  constructor(private readonly jobCardsService: JobCardsService) {}



  @Get()
  @ApiOperation({ summary: 'List all Job Cards with optional status and search filters' })
  async findAll(@Query() query: any) {
    return this.jobCardsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single Job Card details with full hierarchy and stages' })
  async findOne(@Param('id') id: string) {
    return this.jobCardsService.findOne(id);
  }

  @Post(':id/split')
  @RequirePermissions('job_cards.manage', 'production.manage')
  @ApiOperation({ summary: 'Split a Job Card into multiple Sub-Job Cards before launch' })
  @ApiResponse({ status: 201, description: 'Job Card split successfully' })
  async splitJobCard(@Param('id') id: string, @Body() body: { splits: { qty: number }[] }, @Req() req: any) {
    const createdById = req.user?.sub || req.user?.id || req.user?.userId;
    return this.jobCardsService.splitJobCard(id, body.splits, createdById);
  }

  @Post(':id/launch')
  @RequirePermissions('job_cards.manage', 'production.manage')
  @ApiOperation({ summary: 'Launch Job Card and assign initial Sub-Job Cards to Stage 1' })
  @ApiResponse({ status: 201, description: 'Job Card launched successfully' })
  async launchJobCard(@Param('id') id: string) {
    return this.jobCardsService.launchJobCard(id);
  }

  @Patch(':id/status')
  @RequirePermissions('job_cards.manage', 'production.manage')
  @ApiOperation({ summary: 'Update Job Card status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: JobCardStatus }) {
    return this.jobCardsService.updateStatus(id, body.status);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Get high-resolution PNG QR Code data URL for Job Card sticker printing' })
  async getQrCodeImage(@Param('id') id: string) {
    return this.jobCardsService.getQrCodeImage(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get full chronological traceability timeline for Job Card and all its Sub Job Cards' })
  async getTraceabilityHistory(@Param('id') id: string, @Req() req: any) {
    return this.jobCardsService.getTraceabilityHistory(id, req.user);
  }
}
