import { Module } from '@nestjs/common';
import { JobCardsService } from './job-cards.service';
import { JobCardsController } from './job-cards.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobCardsController],
  providers: [JobCardsService],
  exports: [JobCardsService],
})
export class JobCardsModule {}
