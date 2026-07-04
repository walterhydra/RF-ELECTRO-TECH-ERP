import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RejectionsService } from './rejections.service';
import { DispositionDto } from './rejections.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rejections')
export class RejectionsController {
  constructor(private readonly rejectionsService: RejectionsService) {}

  @Get('pending')
  getPendingRejections() {
    return this.rejectionsService.getPendingRejections();
  }

  @Post(':id/disposition')
  setDisposition(
    @Param('id') id: string,
    @Body() dto: DispositionDto,
    @Request() req: any
  ) {
    return this.rejectionsService.setDisposition(id, dto, req.user);
  }
}
