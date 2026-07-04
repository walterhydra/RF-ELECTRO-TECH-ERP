import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'rfelectro_production_jwt_secret_key_2026_super_secure',
    });
  }

  async validate(payload: any) {
    // If this is a customer token, reject on internal JWT strategy
    if (payload.role === 'CUSTOMER') {
      throw new UnauthorizedException('Customer tokens are not permitted on internal staff routes.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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
      throw new UnauthorizedException('User is inactive or no longer exists.');
    }

    const permissions = user.role.permissions.map((p) => p.permission.key);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      roleName: user.role.name,
      roleId: user.roleId,
      departmentId: user.departmentId,
      departmentName: user.department?.name || null,
      assignedStageId: user.assignedStageId,
      assignedStageName: user.assignedStage?.name || null,
      permissions,
    };
  }
}
