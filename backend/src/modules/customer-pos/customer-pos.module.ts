import { Module } from '@nestjs/common';
import { CustomerPosService } from './customer-pos.service';
import { CustomerPosController } from './customer-pos.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JobCardsModule } from '../job-cards/job-cards.module';

@Module({
  imports: [PrismaModule, JobCardsModule],
  controllers: [CustomerPosController],
  providers: [CustomerPosService],
  exports: [CustomerPosService],
})
export class CustomerPosModule {}
