import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CampaignStatus, CouponType, Role } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

class CreateCampaignDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsString()
  startsAt?: string | null;

  @IsOptional()
  @IsString()
  endsAt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priority?: number;
}

class CreateCouponDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsEnum(CouponType)
  type!: CouponType;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  value!: number;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxRedemptions?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minOrderEGP?: number;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;
}

class UpdateCouponDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxRedemptions?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minOrderEGP?: number | null;

  @IsOptional()
  @IsString()
  startsAt?: string | null;

  @IsOptional()
  @IsString()
  endsAt?: string | null;
}

@Controller()
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get('admin/campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'campaigns:write')
  list() {
    return this.campaigns.listCampaigns();
  }

  @Post('admin/campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'campaigns:write')
  create(@Body() dto: CreateCampaignDto) {
    return this.campaigns.createCampaign(dto);
  }

  @Patch('admin/campaigns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'campaigns:write')
  updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaigns.updateCampaign(id, dto);
  }

  @Post('admin/coupons')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'campaigns:write')
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.campaigns.createCoupon(dto);
  }

  @Patch('admin/coupons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @RequirePermissions('admin:access', 'campaigns:write')
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.campaigns.updateCoupon(id, dto);
  }

  @Get('coupons/validate')
  validate(
    @Query('code') code: string,
    @Query('orderTotal') orderTotal?: string,
  ) {
    return this.campaigns.validateCoupon(code, Number(orderTotal) || 0);
  }
}
