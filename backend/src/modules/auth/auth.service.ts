import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
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
      permissions,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
        roleId: user.roleId,
        department: user.department ? { id: user.department.id, name: user.department.name } : null,
        assignedStage: user.assignedStage ? { id: user.assignedStage.id, name: user.assignedStage.name } : null,
        permissions,
      },
    };
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
      assignedStage: user.assignedStage ? { id: user.assignedStage.id, name: user.assignedStage.name } : null,
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
