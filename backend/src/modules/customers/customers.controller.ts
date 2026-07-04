import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Customer Master')
@Controller('customers')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequirePermissions('master_data.manage', 'sales.manage')
  @ApiOperation({ summary: 'Create a new customer master record' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  async create(@Body() createDto: any) {
    return this.customersService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all customers with optional search' })
  async findAll(@Query() query: any) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single customer details by ID' })
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('master_data.manage', 'sales.manage')
  @ApiOperation({ summary: 'Update customer details' })
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.customersService.update(id, updateDto);
  }

  @Patch(':id/status')
  @RequirePermissions('master_data.manage', 'sales.manage')
  @ApiOperation({ summary: 'Toggle customer active status' })
  async toggleStatus(@Param('id') id: string) {
    return this.customersService.toggleStatus(id);
  }

  @Post(':id/portal-access')
  @RequirePermissions('master_data.manage', 'sales.manage')
  @ApiOperation({ summary: 'Provision a portal login for this customer' })
  async provisionPortalAccess(
    @Param('id') id: string,
    @Body() body: { email: string; password?: string }
  ) {
    return this.customersService.provisionPortalAccess(id, body.email, body.password);
  }
}
