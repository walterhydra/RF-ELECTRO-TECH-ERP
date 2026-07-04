import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerPosService } from './customer-pos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { POStatus } from '@prisma/client';
import { JobCardsService } from '../job-cards/job-cards.service';

@ApiTags('Customer Purchase Orders')
@Controller('customer-pos')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class CustomerPosController {
  constructor(
    private readonly customerPosService: CustomerPosService,
    private readonly jobCardsService: JobCardsService
  ) {}

  @Post()
  @RequirePermissions('pos.manage', 'sales.manage')
  @ApiOperation({ summary: 'Create a new Customer Purchase Order' })
  @ApiResponse({ status: 201, description: 'PO created successfully' })
  async create(@Body() createDto: any, @Req() req: any) {
    return this.customerPosService.create(createDto, req.user.sub || req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all Customer POs with filters' })
  async findAll(@Query() query: any) {
    return this.customerPosService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single Customer PO details by ID' })
  async findOne(@Param('id') id: string) {
    return this.customerPosService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('pos.manage', 'sales.manage')
  @ApiOperation({ summary: 'Update Customer PO details' })
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.customerPosService.update(id, updateDto);
  }

  @Patch(':id/status')
  @RequirePermissions('pos.manage', 'sales.manage')
  @ApiOperation({ summary: 'Update Customer PO status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: POStatus) {
    return this.customerPosService.updateStatus(id, status);
  }

  @Post(':id/generate-job-card')
  @RequirePermissions('job_cards.manage', 'production.manage', 'sales.po.manage')
  @ApiOperation({ summary: 'Generate Job Card from Customer Purchase Order' })
  @ApiResponse({ status: 201, description: 'Job Card generated successfully' })
  async generateJobCard(@Param('id') id: string, @Req() req: any) {
    const createdById = req.user?.sub || req.user?.id || req.user?.userId;
    return this.jobCardsService.generateFromPo(id, createdById);
  }
}
