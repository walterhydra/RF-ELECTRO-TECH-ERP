import { Module } from '@nestjs/common';
import { ProcessStagesController } from './process-stages.controller';
import { ProcessStagesService } from './process-stages.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProcessStagesController],
  providers: [ProcessStagesService],
  exports: [ProcessStagesService],
})
export class ProcessStagesModule {}
