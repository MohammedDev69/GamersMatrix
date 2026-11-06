import { IsOptional, IsString, MaxLength } from 'class-validator';

export class QuoteCartDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  couponCode?: string;
}
