import { Module } from '@nestjs/common';
import { SubJobCardsService } from './sub-job-cards.service';
import { SubJobCardsController } from './sub-job-cards.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { StageScopeGuard } from '../../common/guards/stage-scope.guard';

@Module({
  imports: [PrismaModule],
  controllers: [SubJobCardsController],
  providers: [SubJobCardsService, StageScopeGuard],
  exports: [SubJobCardsService],
})
export class SubJobCardsModule {}
