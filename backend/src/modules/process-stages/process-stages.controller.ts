import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProcessStagesService } from './process-stages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Process Master & Flows')
@Controller('process-stages')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class ProcessStagesController {
  constructor(private readonly processStagesService: ProcessStagesService) {}

  @Post()
  @RequirePermissions('master_data.manage', 'settings.manage')
  @ApiOperation({ summary: 'Create a new manufacturing process stage' })
  @ApiResponse({ status: 201, description: 'Process stage created successfully' })
  async create(@Body() createDto: any) {
    return this.processStagesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all process stages with department and sequence' })
  async findAll(@Query() query: any) {
    return this.processStagesService.findAll(query);
  }

  @Post('flows')
  @RequirePermissions('master_data.manage', 'settings.manage')
  @ApiOperation({ summary: 'Create a new manufacturing process flow sequence' })
  async createFlow(@Body() createDto: any, @Request() req: any) {
    const createdById = req.user?.userId || req.user?.id || req.user?.sub;
    return this.processStagesService.createFlow({ ...createDto, createdById });
  }

  @Get('flows')
  @ApiOperation({ summary: 'List all process flow masters' })
  async findAllFlows() {
    return this.processStagesService.findAllFlows();
  }

  @Get('flows/:id')
  @ApiOperation({ summary: 'Get single process flow details and step sequence' })
  async findFlowById(@Param('id') id: string) {
    return this.processStagesService.findFlowById(id);
  }

  @Patch('flows/:id')
  @RequirePermissions('master_data.manage', 'settings.manage')
  @ApiOperation({ summary: 'Update process flow name or stage sequence' })
  async updateFlow(@Param('id') id: string, @Body() updateDto: any) {
    return this.processStagesService.updateFlow(id, updateDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single process stage details with assigned operators' })
  async findOne(@Param('id') id: string) {
    return this.processStagesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('master_data.manage', 'settings.manage')
  @ApiOperation({ summary: 'Update process stage name, code, sequence, or department' })
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.processStagesService.update(id, updateDto);
  }

  @Patch(':id/status')
  @RequirePermissions('master_data.manage', 'settings.manage')
  @ApiOperation({ summary: 'Toggle process stage active status' })
  async toggleStatus(@Param('id') id: string) {
    return this.processStagesService.toggleStatus(id);
  }
}
