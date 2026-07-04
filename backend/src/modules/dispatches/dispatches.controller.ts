import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DispatchesService } from './dispatches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('dispatches')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DispatchesController {
  constructor(private readonly dispatchesService: DispatchesService) {}

  @Post()
  @RequirePermissions('production.manage', 'sales.po.manage')
  createDispatch(@Body() data: any, @Request() req) {
    const createdById = req.user?.sub || req.user?.id || req.user?.userId;
    return this.dispatchesService.createDispatch(data, createdById);
  }

  @Patch(':id/confirm-delivery')
  @RequirePermissions('production.manage', 'sales.po.manage')
  @UseInterceptors(FileInterceptor('deliveryPhoto', {
    storage: diskStorage({
      destination: './uploads/deliveries',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      }
    })
  }))
  updateDeliveryStatus(
    @Param('id') id: string,
    @Body() data: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (file) {
      data.deliveryPhotoUrl = `/uploads/deliveries/${file.filename}`;
    }
    return this.dispatchesService.updateDeliveryStatus(id, data);
  }

  @Get()
  @RequirePermissions('production.view', 'sales.po.view')
  getAllDispatches() {
    return this.dispatchesService.getAllDispatches();
  }
}
