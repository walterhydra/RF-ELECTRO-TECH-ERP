import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductMasterService } from './product-master.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Product Master')
@Controller('products')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class ProductMasterController {
  constructor(private readonly productMasterService: ProductMasterService) {}

  @Post()
  @RequirePermissions('master_data.manage', 'sales.po.manage')
  @ApiOperation({ summary: 'Create a new PCB product specification card' })
  @ApiResponse({ status: 201, description: 'Product specification created successfully' })
  async create(@Body() createDto: any, @Request() req: any) {
    const createdById = req.user?.userId || req.user?.id || req.user?.sub;
    return this.productMasterService.create({ ...createDto, createdById });
  }

  @Get()
  @ApiOperation({ summary: 'List all PCB products with optional customer filter and search' })
  async findAll(@Query() query: any) {
    return this.productMasterService.findAll(query);
  }

  @Get('options')
  @ApiOperation({ summary: 'Get standard PCB specification options (layers, copper, finishes, materials)' })
  getOptions() {
    return this.productMasterService.getSpecificationOptions();
  }

  @Post(':id/revisions')
  @RequirePermissions('master_data.manage', 'sales.po.manage')
  @ApiOperation({ summary: 'Create a new revision of an existing PCB Product Specification Card' })
  async createRevision(@Param('id') id: string, @Body() createDto: any, @Request() req: any) {
    const createdById = req.user?.userId || req.user?.id || req.user?.sub;
    return this.productMasterService.createRevision(id, { ...createDto, createdById });
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'Get full revision history of a PCB Product Specification Card' })
  async getRevisions(@Param('id') id: string) {
    return this.productMasterService.getRevisions(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single PCB product specification details' })
  async findOne(@Param('id') id: string) {
    return this.productMasterService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('master_data.manage', 'sales.po.manage')
  @ApiOperation({ summary: 'Update PCB product specification details' })
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.productMasterService.update(id, updateDto);
  }

  @Patch(':id/status')
  @RequirePermissions('master_data.manage', 'sales.po.manage')
  @ApiOperation({ summary: 'Toggle PCB product active status' })
  async toggleStatus(@Param('id') id: string) {
    return this.productMasterService.toggleStatus(id);
  }
}
