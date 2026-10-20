import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

interface PendingOtpSession {
  userId: string;
  email: string;
  userName: string;
  otp: string;
  expiresAt: number;
  tempToken: string;
  payload: any;
  userProfile: any;
}

const TARGET_OTP_EMAIL = process.env.OTP_TARGET_EMAIL || 'ocbpl.qms@gmail.com';

@Injectable()
export class AuthService {
  private pendingOtps = new Map<string, PendingOtpSession>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async sendOtpEmail(otp: string, userEmail: string, userName: string) {
    console.log(`\n======================================================`);
    console.log(`🔐 [2FA LOGIN OTP GENERATED]`);
    console.log(`User: ${userEmail} (${userName})`);
    console.log(`Target Email: ${TARGET_OTP_EMAIL}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Valid for: 10 minutes`);
    console.log(`======================================================\n`);

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: Number(process.env.SMTP_PORT || 465) === 465,
        auth: {
          user: process.env.SMTP_USER || 'ocbpl.qms@gmail.com',
          pass: process.env.SMTP_PASS || 'dehnhzzfsjvttbow',
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: bold;">RF ELECTRO TECH ERP</h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Security Login Verification Code</p>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <p style="color: #475569; font-size: 14px; margin: 0 0 16px;">A login request was initiated for user: <strong>${userEmail}</strong> (${userName})</p>
            <div style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #1e40af; padding: 12px 20px; background: #eff6ff; border: 2px dashed #93c5fd; border-radius: 8px; display: inline-block; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 14px;">Enter this 6-digit verification code to complete sign-in. Code expires in <strong>10 minutes</strong>.</p>
          </div>
          <div style="color: #94a3b8; font-size: 11px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            <p style="margin: 0;">Automated security notification from RF Electro Tech ERP. If you did not request this code, please review active sessions.</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"RF Electro ERP" <ocbpl.qms@gmail.com>',
        to: TARGET_OTP_EMAIL,
        subject: `RF Electro ERP - Login OTP Verification Code: ${otp}`,
        text: `Your RF Electro ERP login OTP code is: ${otp}. Requested for ${userEmail} (${userName}). Valid for 10 minutes.`,
        html: htmlContent,
      });

      console.log(`✅ [LOGIN OTP SENT] Successfully sent email to ${TARGET_OTP_EMAIL}`);
    } catch (err: any) {
      console.warn(`⚠️ [LOGIN OTP SMTP NOTICE] Could not deliver via SMTP: ${err?.message || err}`);
      console.warn(`[OTP FALLBACK] The OTP ${otp} is recorded in server logs for ${TARGET_OTP_EMAIL}.`);
    }
  }

  async requestOtp(email: string, pass: string) {
    if (!email || !pass) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        department: true,
        assignedStage: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Please contact administrator.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const permissions = user.role.permissions.map((p) => p.permission.key);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
      departmentId: user.departmentId,
      assignedStageId: user.assignedStageId,
      assignedStageName: user.assignedStage?.name || null,
      permissions,
    };

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
      roleId: user.roleId,
      department: user.department ? { id: user.department.id, name: user.department.name } : null,
      assignedStage: user.assignedStage
        ? {
            id: user.assignedStage.id,
            name: user.assignedStage.name,
            code: user.assignedStage.code,
            defaultOrder: user.assignedStage.defaultOrder,
          }
        : null,
      permissions,
    };

    // Generate 6-digit OTP & session token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tempToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.pendingOtps.set(tempToken, {
      userId: user.id,
      email: user.email,
      userName: user.name,
      otp,
      expiresAt,
      tempToken,
      payload,
      userProfile,
    });

    // Send OTP to target admin email
    this.sendOtpEmail(otp, user.email, user.name);

    return {
      otpRequired: true,
      tempToken,
      targetEmail: TARGET_OTP_EMAIL,
      maskedEmail: TARGET_OTP_EMAIL,
      userEmail: user.email,
      userName: user.name,
      message: `Security verification OTP has been sent to ${TARGET_OTP_EMAIL}`,
    };
  }

  async verifyOtp(tempToken: string, otp: string, res?: any) {
    if (!tempToken || !otp) {
      throw new BadRequestException('Security token and OTP code are required');
    }

    const session = this.pendingOtps.get(tempToken);
    if (!session) {
      throw new BadRequestException('Verification session expired or not found. Please log in again.');
    }

    if (Date.now() > session.expiresAt) {
      this.pendingOtps.delete(tempToken);
      throw new BadRequestException('OTP code has expired. Please request a new code.');
    }

    if (session.otp !== otp.trim()) {
      throw new BadRequestException(`Incorrect OTP code. Please enter the code sent to ${TARGET_OTP_EMAIL}`);
    }

    // OTP Verified successfully!
    this.pendingOtps.delete(tempToken);

    // 30 days token for persistent device login
    const accessToken = this.jwtService.sign(session.payload, { expiresIn: '30d' });
    const refreshToken = this.jwtService.sign(
      { sub: session.userId, type: 'refresh' },
      { expiresIn: '90d' }
    );

    if (res && typeof res.cookie === 'function') {
      res.cookie('rf_session_token', accessToken, {
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
        httpOnly: false,
        path: '/',
        sameSite: 'lax',
      });
      res.cookie('rf_user_role', session.userProfile.role, {
        maxAge: 90 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        path: '/',
        sameSite: 'lax',
      });
    }

    return {
      success: true,
      accessToken,
      refreshToken,
      user: session.userProfile,
      cookieSet: true,
    };
  }

  async resendOtp(tempToken: string) {
    if (!tempToken) {
      throw new BadRequestException('Session token is required');
    }

    const session = this.pendingOtps.get(tempToken);
    if (!session) {
      throw new BadRequestException('Verification session expired. Please start login again.');
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    session.otp = newOtp;
    session.expiresAt = Date.now() + 10 * 60 * 1000;
    this.pendingOtps.set(tempToken, session);

    this.sendOtpEmail(newOtp, session.email, session.userName);

    return {
      success: true,
      message: `A new 6-digit verification code has been sent to ${TARGET_OTP_EMAIL}`,
    };
  }

  async login(email: string, pass: string, otp?: string, tempToken?: string, res?: any) {
    if (otp && tempToken) {
      return this.verifyOtp(tempToken, otp, res);
    }
    return this.requestOtp(email, pass);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        department: true,
        assignedStage: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const permissions = user.role.permissions.map((p) => p.permission.key);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
      roleId: user.roleId,
      department: user.department ? { id: user.department.id, name: user.department.name } : null,
      assignedStage: user.assignedStage
        ? {
            id: user.assignedStage.id,
            name: user.assignedStage.name,
            code: user.assignedStage.code,
            defaultOrder: user.assignedStage.defaultOrder,
          }
        : null,
      permissions,
    };
  }

  async refreshToken(token: string) {
    if (!token) throw new UnauthorizedException('Refresh token is required');

    try {
      const decoded = this.jwtService.verify(token);
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Re-fetch user to ensure they are still active and get current permissions
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          role: {
            include: { permissions: { include: { permission: true } } },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const permissions = user.role.permissions.map((p) => p.permission.key);

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        roleId: user.roleId,
        departmentId: user.departmentId,
        assignedStageId: user.assignedStageId,
        permissions,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      return { accessToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(email: string) {
    if (!email) throw new BadRequestException('Email is required');

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user && user.isActive) {
      const resetToken = this.jwtService.sign(
        { sub: user.id, type: 'reset' },
        { expiresIn: '1h' }
      );
      
      // Simulate sending email
      console.log(`\n=========================================`);
      console.log(`[SIMULATED EMAIL] Password Reset Request`);
      console.log(`To: ${user.email}`);
      console.log(`Token: ${resetToken}`);
      console.log(`=========================================\n`);
    }

    // Always return success to prevent email enumeration
    return { success: true, message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and new password are required');
    }

    try {
      const decoded = this.jwtService.verify(token);
      if (decoded.type !== 'reset') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      return { success: true, message: 'Password has been successfully reset' };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }
}
