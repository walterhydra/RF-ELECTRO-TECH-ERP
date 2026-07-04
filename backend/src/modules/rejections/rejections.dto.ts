import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DispositionAction {
  SCRAP = 'SCRAP',
  REWORK = 'REWORK',
}

export class DispositionDto {
  @ApiProperty({ enum: DispositionAction })
  @IsEnum(DispositionAction)
  @IsNotEmpty()
  action: DispositionAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  reworkStageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qcRemarks?: string;
}
