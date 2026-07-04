import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubJobCardsService } from './sub-job-cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { StageScopeGuard } from '../../common/guards/stage-scope.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { SubJobCardStatus } from '@prisma/client';
import { StageUpdateDto } from './sub-job-cards.dto';

@ApiTags('Sub Job Cards')
@Controller('sub-job-cards')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class SubJobCardsController {
  constructor(private readonly subJobCardsService: SubJobCardsService) {}

  @Get('qr-lookup/:qrValue')
  @ApiOperation({ summary: 'Resolve any QR string or Barcode to its Job Card or Sub Job Card record' })
  async findByQrValue(@Param('qrValue') qrValue: string) {
    return this.subJobCardsService.findByQrValue(decodeURIComponent(qrValue));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single Sub Job Card details with current stage and hierarchy' })
  async findOne(@Param('id') id: string) {
    return this.subJobCardsService.findOne(id);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Get PNG data URL QR sticker image for Sub Job Card' })
  async getQrCodeImage(@Param('id') id: string) {
    return this.subJobCardsService.getQrCodeImage(id);
  }

  @Patch(':id/status')
  @RequirePermissions('job_cards.manage', 'production.manage')
  @ApiOperation({ summary: 'Update Sub Job Card status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: SubJobCardStatus }) {
    return this.subJobCardsService.updateStatus(id, body.status);
  }

  @Get(':id/current-stage')
  @ApiOperation({ summary: 'Get current stage info and WIP quantities for a Sub Job Card' })
  @ApiResponse({ status: 200, description: 'Current stage with WIP breakdown' })
  async getCurrentStage(@Param('id') id: string) {
    return this.subJobCardsService.getCurrentStage(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get full chronological traceability history for a Sub Job Card' })
  @ApiResponse({ status: 200, description: 'Movement log entries in reverse chronological order' })
  async getTraceabilityHistory(@Param('id') id: string, @Req() req: any) {
    return this.subJobCardsService.getTraceabilityHistory(id, req.user);
  }

  @Post(':id/stage-update')
  @UseGuards(StageScopeGuard)
  @RequirePermissions('production.manage', 'production.stage_update')
  @ApiOperation({
    summary: 'Record process stage movement — receive, process, forward, reject, hold quantities',
    description:
      'Core Stage Engine endpoint. Process operators scan QR and submit qty updates. ' +
      'Enforces stage-scope restriction (PROCESS_OPERATOR can only update their assigned stage). ' +
      'Supports partial forwarding with automatic lot splitting, rejection tracking, ' +
      'and idempotent submissions via clientRequestId.',
  })
  @ApiResponse({ status: 201, description: 'Stage movement recorded successfully' })
  @ApiResponse({ status: 400, description: 'Validation error (qty mismatch, missing rejection reason)' })
  @ApiResponse({ status: 403, description: 'Stage mismatch — operator not assigned to this stage' })
  @ApiResponse({ status: 409, description: 'Duplicate submission detected (idempotency guard)' })
  async executeStageUpdate(
    @Param('id') id: string,
    @Body() dto: StageUpdateDto,
    @Req() req: any,
  ) {
    return this.subJobCardsService.executeStageUpdate(id, dto, req.user);
  }
}
