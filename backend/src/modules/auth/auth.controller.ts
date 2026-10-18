import { Controller, Post, Body, Get, UseGuards, Request, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal staff login / OTP verification' })
  @ApiResponse({ status: 200, description: 'Returns OTP challenge or access token with session cookie' })
  async login(
    @Body() body: { email?: string; password?: string; otp?: string; tempToken?: string },
    @Res({ passthrough: true }) res?: Response,
  ): Promise<any> {
    return this.authService.login(body.email || '', body.password || '', body.otp, body.tempToken, res);
  }

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate credentials and send 2FA OTP to milanpandavadra84@gmail.com' })
  async requestOtp(@Body() body: { email?: string; password?: string }): Promise<any> {
    return this.authService.requestOtp(body.email || '', body.password || '');
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code and issue JWT tokens with persistent cookie' })
  async verifyOtp(
    @Body() body: { tempToken?: string; otp?: string },
    @Res({ passthrough: true }) res?: Response,
  ): Promise<any> {
    return this.authService.verifyOtp(body.tempToken || '', body.otp || '', res);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend fresh OTP code to milanpandavadra84@gmail.com' })
  async resendOtp(@Body() body: { tempToken?: string }): Promise<any> {
    return this.authService.resendOtp(body.tempToken || '');
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
  @ApiOperation({ summary: 'Invalidate refresh token and clear cookies' })
  async logout(@Res({ passthrough: true }) res?: Response) {
    if (res && typeof res.clearCookie === 'function') {
      res.clearCookie('rf_session_token', { path: '/' });
      res.clearCookie('rf_user_role', { path: '/' });
    }
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
