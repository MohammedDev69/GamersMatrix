import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { PublicationStatus } from '@prisma/client';

export class TransitionPublicationDto {
  @IsEnum(PublicationStatus)
  status!: PublicationStatus;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}T/, {
    message: 'scheduledAt must be an ISO datetime',
  })
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
