import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobCardsService } from './job-cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JobCardStatus } from '@prisma/client';

@ApiTags('Job Cards')
@Controller('job-cards')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class JobCardsController {
  constructor(private readonly jobCardsService: JobCardsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all Job Cards with optional status and search filters' })
  async findAll(@Query() query: any, @Req() req: any) {
    return this.jobCardsService.findAll(query, req.user);
  }

  @Post('create')
  @Public()
  @ApiOperation({ summary: 'Create a new Job Card (alias endpoint)' })
  async createJobCardAlias(@Body() body: any, @Req() req: any) {
    return this.createJobCard(body, req);
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new Job Card with full 13 PDF metadata fields & pre-launch split options' })
  @ApiResponse({ status: 201, description: 'Job Card created successfully' })
  async createJobCard(@Body() body: any, @Req() req: any) {
    console.log('--- ROUTE HIT: POST /job-cards/create ---', body?.jobCardNo, 'Body keys:', Object.keys(body || {}));
    try {
      const createdById = req.user?.sub || req.user?.id || req.user?.userId;
      const res = await this.jobCardsService.createJobCard(body, createdById);
      console.log('--- SUCCESS IN CONTROLLER createJobCard ---', res?.jobCardNo || res?.id);
      return res;
    } catch (err: any) {
      console.error('--- ERROR IN CONTROLLER createJobCard ---', err?.message, err?.stack || err);
      throw err;
    }
  }

  @Post('generate')
  @Public()
  @ApiOperation({ summary: 'Generate Job Card from Customer Purchase Order' })
  @ApiResponse({ status: 201, description: 'Job Card generated successfully' })
  async generateFromPo(@Body() body: { customerPoId: string }, @Req() req: any) {
    console.log('--- ROUTE HIT: POST /job-cards/generate ---');
    const createdById = req.user?.sub || req.user?.id || req.user?.userId;
    return this.jobCardsService.generateFromPo(body.customerPoId, createdById);
  }

  @Get('seed-cloud-db')
  @Public()
  @ApiOperation({ summary: 'Explicitly seed cloud database with default production Job Cards' })
  async seedCloudDb() {
    console.log('--- ROUTE HIT: GET /job-cards/seed-cloud-db ---');
    return this.jobCardsService.seedCloudDb();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get single Job Card details with full hierarchy and stages' })
  async findOne(@Param('id') id: string) {
    console.log('--- ROUTE HIT: GET /job-cards/:id ---', id);
    return this.jobCardsService.findOne(id);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update an existing Job Card (PUT)' })
  async updateJobCardPut(@Param('id') id: string, @Body() body: any) {
    return this.updateJobCard(id, body);
  }

  @Patch(':id')
  @Public()
  @ApiOperation({ summary: 'Update an existing Job Card' })
  async updateJobCard(@Param('id') id: string, @Body() body: any) {
    console.log('--- ROUTE HIT: PUT/PATCH /job-cards/:id ---', id);
    return this.jobCardsService.updateJobCard(id, body);
  }

  @Post(':id/split')
  @Public()
  @ApiOperation({ summary: 'Split a Job Card into multiple Sub-Job Cards before launch' })
  @ApiResponse({ status: 201, description: 'Job Card split successfully' })
  async splitJobCard(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const createdById = req.user?.sub || req.user?.id || req.user?.userId;
    return this.jobCardsService.splitJobCard(id, body, createdById);
  }

  @Post(':id/launch')
  @Public()
  @ApiOperation({ summary: 'Launch Job Card and assign initial Sub-Job Cards to Stage 1' })
  @ApiResponse({ status: 201, description: 'Job Card launched successfully' })
  async launchJobCard(@Param('id') id: string) {
    return this.jobCardsService.launchJobCard(id);
  }

  @Patch(':id/status')
  @Public()
  @ApiOperation({ summary: 'Update Job Card status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: JobCardStatus }) {
    return this.jobCardsService.updateStatus(id, body.status);
  }

  @Get(':id/qr')
  @Public()
  @ApiOperation({ summary: 'Get high-resolution PNG QR Code data URL for Job Card sticker printing' })
  async getQrCodeImage(@Param('id') id: string) {
    return this.jobCardsService.getQrCodeImage(id);
  }

  @Get(':id/history')
  @Public()
  @ApiOperation({ summary: 'Get full chronological traceability timeline for Job Card and all its Sub Job Cards' })
  async getTraceabilityHistory(@Param('id') id: string, @Req() req: any) {
    return this.jobCardsService.getTraceabilityHistory(id, req.user);
  }

  @Post('move-stage')
  @Public()
  @ApiOperation({ summary: 'Execute Full Job Movement to next process stage (Root route)' })
  async moveStageRoot(@Body() body: any, @Req() req: any) {
    return this.moveFull('', body, req);
  }

  @Post('move-full')
  @Public()
  @ApiOperation({ summary: 'Execute Full Job Movement to next process stage (Alias root route)' })
  async moveFullRoot(@Body() body: any, @Req() req: any) {
    return this.moveFull('', body, req);
  }

  @Post(':id/move-stage')
  @Public()
  @ApiOperation({ summary: 'Execute Full Job Movement to next process stage by ID' })
  async moveStageParam(@Param('id') pathId: string, @Body() body: any, @Req() req: any) {
    return this.moveFull(pathId, body, req);
  }

  @Post(':id/move-full')
  @Public()
  @ApiOperation({ summary: 'Execute Full Job Movement to next process stage' })
  async moveFull(
    @Param('id') pathId: string,
    @Body() body: { id?: string; cardId?: string; jobId?: string; jobCardNo?: string; rejectPcbQty?: number; rejectQty?: number; remark?: string; remarkType?: string; status?: string },
    @Req() req: any,
  ) {
    const targetId = pathId || body?.id || body?.cardId || body?.jobId || body?.jobCardNo || '';
    return this.jobCardsService.moveFull(targetId, body, req.user);
  }

  @Post(':id/move-partial')
  @Public()
  @ApiOperation({ summary: 'Execute Uncompleted / Partial Job Movement to next process stage' })
  async movePartial(
    @Param('id') id: string,
    @Body() body: { qtyToMove: number; areaToMove?: number; remark?: string; pendingWorkReason?: string; remarkType?: string },
    @Req() req: any,
  ) {
    return this.jobCardsService.movePartial(id, body, req.user);
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete Job Card (Master role restricted)' })
  async deleteJobCard(@Param('id') id: string, @Req() req: any) {
    return this.jobCardsService.deleteJobCard(id, req.user);
  }
}
