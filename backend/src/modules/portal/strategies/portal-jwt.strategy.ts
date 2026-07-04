import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PortalJwtStrategy extends PassportStrategy(Strategy, 'portal-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'rfelectro_production_jwt_secret_key_2026_super_secure',
    });
  }

  async validate(payload: any) {
    if (payload.role !== 'CUSTOMER' || !payload.customerId) {
      throw new UnauthorizedException('Invalid customer portal token.');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: 'CUSTOMER',
      customerId: payload.customerId,
      customerName: payload.customerName,
    };
  }
}
