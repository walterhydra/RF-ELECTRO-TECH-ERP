import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal staff JWT login' })
  @ApiResponse({ status: 200, description: 'Returns access token and user profile' })
  async login(@Body() body: { email?: string; password?: string }) {
    return this.authService.login(body.email || '', body.password || '');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated internal user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile and permissions' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange refresh token for new access token' })
  async refresh(@Body() body: { refreshToken?: string }) {
    return this.authService.refreshToken(body.refreshToken || '');
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate refresh token (stateless)' })
  async logout() {
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger reset email' })
  async forgotPassword(@Body() body: { email?: string }) {
    return this.authService.forgotPassword(body.email || '');
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set new password via reset token' })
  async resetPassword(@Body() body: { token?: string; newPassword?: string }) {
    return this.authService.resetPassword(body.token || '', body.newPassword || '');
  }
}
