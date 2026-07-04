import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Users & Process Assignment')
@Controller('users')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Create a new internal user or process operator' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createDto: any) {
    return this.usersService.create(createDto);
  }

  @Get()
  @RequirePermissions('users.manage', 'settings.manage', 'reports.view')
  @ApiOperation({ summary: 'List all internal staff and operators with optional filters' })
  async findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @Get('roles')
  @ApiOperation({ summary: 'List all available roles' })
  async getRoles() {
    return this.usersService.getRoles();
  }

  @Get('departments')
  @ApiOperation({ summary: 'List all available departments' })
  async getDepartments() {
    return this.usersService.getDepartments();
  }

  @Get(':id')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Get user details by ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Update user profile, role, or assigned process stage' })
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.usersService.update(id, updateDto);
  }

  @Patch(':id/status')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Activate or deactivate a user account' })
  async toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleStatus(id);
  }
}
