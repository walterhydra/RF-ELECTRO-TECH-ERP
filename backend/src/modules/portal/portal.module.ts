import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { PortalJwtStrategy } from './strategies/portal-jwt.strategy';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PortalController],
  providers: [PortalService, PortalJwtStrategy],
  exports: [PortalService],
})
export class PortalModule {}
