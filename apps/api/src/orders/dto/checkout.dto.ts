import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export enum GiftDeliveryMethodDto {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
}

export class CheckoutDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  couponCode?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  acceptTerms?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isGift?: boolean;

  @ValidateIf((o: CheckoutDto) => o.isGift === true)
  @IsString()
  @MaxLength(120)
  recipientName?: string;

  @ValidateIf(
    (o: CheckoutDto) =>
      o.isGift === true && o.giftDeliveryMethod === GiftDeliveryMethodDto.EMAIL,
  )
  @IsEmail()
  recipientEmail?: string;

  @ValidateIf(
    (o: CheckoutDto) =>
      o.isGift === true &&
      o.giftDeliveryMethod === GiftDeliveryMethodDto.WHATSAPP,
  )
  @IsString()
  @MaxLength(32)
  recipientWhatsApp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  giftMessage?: string;

  @ValidateIf((o: CheckoutDto) => o.isGift === true)
  @IsEnum(GiftDeliveryMethodDto)
  giftDeliveryMethod?: GiftDeliveryMethodDto;
}
