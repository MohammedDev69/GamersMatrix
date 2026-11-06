import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  icon?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  storeName?: string;

  @IsOptional()
  @IsString()
  defaultLocale?: string;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  supportWhatsApp?: string | null;

  @IsOptional()
  @IsString()
  supportEmail?: string | null;

  @IsOptional()
  @IsString()
  publicNotice?: string | null;

  @IsOptional()
  @IsString()
  seoTitleDefault?: string | null;

  @IsOptional()
  @IsString()
  seoDescriptionDefault?: string | null;
}

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role!: Role;
}

export class UpdateOrderStatusDto {
  @IsString()
  status!: string;
}

export class UpdateSoldCountDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  soldCount!: number;
}
