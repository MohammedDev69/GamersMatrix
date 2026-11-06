import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** Provider retries must not be blocked by global rate limits — HMAC is the gate. */
  @SkipThrottle()
  @Post('webhook')
  webhook(
    @Body() body: Record<string, unknown>,
    @Headers('hmac') hmacHeader?: string,
    @Query('hmac') hmacQuery?: string,
  ) {
    return this.paymentsService.handleWebhook(body, hmacHeader || hmacQuery);
  }

  @Get('return')
  async handleReturn(
    @Query() query: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.paymentsService.handleReturn(query);
    return res.redirect(redirectUrl);
  }
}
