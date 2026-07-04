import { Controller, Get, Post, Body, UseGuards, Request, HttpCode, HttpStatus, UnauthorizedException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PortalService } from './portal.service';
import { PortalAuthGuard } from './guards/portal-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Portal')
@Controller('portal')
export class PortalController {
  constructor(private portalService: PortalService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Customer portal JWT login' })
  @ApiResponse({ status: 200, description: 'Returns access token and customer info' })
  async login(@Body() body: { email?: string; password?: string }) {
    return this.portalService.login(body.email || '', body.password || '');
  }

  @Get('orders')
  @UseGuards(PortalAuthGuard)
  getOrders(@Request() req) {
    // In JWT, req.user contains the payload we signed (sub, role, customerId)
    if (req.user.role !== 'CUSTOMER') {
      throw new UnauthorizedException('Only portal users can access this endpoint');
    }
    return this.portalService.getOrders(req.user.customerId);
  }

  @UseGuards(PortalAuthGuard)
  @Get('notifications')
  getNotifications(@Request() req) {
    if (req.user.role !== 'CUSTOMER') {
      throw new UnauthorizedException('Only portal users can access this endpoint');
    }
    return this.portalService.getNotifications(req.user.id);
  }

  @UseGuards(PortalAuthGuard)
  @Get('dispatches')
  getDispatches(@Request() req) {
    if (req.user.role !== 'CUSTOMER') {
      throw new UnauthorizedException('Only portal users can access this endpoint');
    }
    return this.portalService.getDispatches(req.user.customerId);
  }

  @UseGuards(PortalAuthGuard)
  @Get('dashboard')
  getDashboardMetrics(@Request() req) {
    if (req.user.role !== 'CUSTOMER') throw new UnauthorizedException('Only portal users can access this endpoint');
    return this.portalService.getDashboardMetrics(req.user.customerId);
  }

  @UseGuards(PortalAuthGuard)
  @Get('products')
  getProducts(@Request() req) {
    if (req.user.role !== 'CUSTOMER') throw new UnauthorizedException('Only portal users can access this endpoint');
    return this.portalService.getProducts(req.user.customerId);
  }

  @UseGuards(PortalAuthGuard)
  @Get('job-cards')
  getJobCards(@Request() req) {
    if (req.user.role !== 'CUSTOMER') throw new UnauthorizedException('Only portal users can access this endpoint');
    return this.portalService.getJobCards(req.user.customerId);
  }

  @UseGuards(PortalAuthGuard)
  @Get('orders/:id')
  getOrderDetails(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'CUSTOMER') throw new UnauthorizedException('Only portal users can access this endpoint');
    return this.portalService.getOrderDetails(req.user.customerId, id);
  }

  @UseGuards(PortalAuthGuard)
  @Get('orders/:id/traceability')
  getTraceability(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'CUSTOMER') throw new UnauthorizedException('Only portal users can access this endpoint');
    return this.portalService.getTraceability(req.user.customerId, id);
  }

}
