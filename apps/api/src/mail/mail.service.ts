import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Email delivery adapter.
 * When SMTP_* is not configured, messages are logged for development preview only —
 * they are not sent to a real mailbox.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly previewLog: MailMessage[] = [];

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('SMTP_HOST') &&
        this.config.get<string>('SMTP_USER') &&
        this.config.get<string>('SMTP_PASS'),
    );
  }

  /** Last N preview messages (dev only — never contains secrets beyond recipient/subject). */
  getPreviewLog(limit = 20) {
    return this.previewLog.slice(-limit).reverse();
  }

  async send(message: MailMessage): Promise<{
    delivered: boolean;
    mode: 'smtp' | 'preview';
  }> {
    if (!this.isConfigured()) {
      this.previewLog.push(message);
      if (this.previewLog.length > 50) this.previewLog.shift();
      this.logger.log(
        `[preview] to=${message.to} subject=${message.subject}\n${message.text}`,
      );
      return { delivered: false, mode: 'preview' };
    }

    // Real SMTP wiring deferred until a transport library is approved for production.
    // Documented: set SMTP_* then replace this branch with nodemailer/transporter.
    this.logger.warn(
      'SMTP env present but transport not wired — falling back to preview log',
    );
    this.previewLog.push(message);
    return { delivered: false, mode: 'preview' };
  }

  orderConfirmationTemplate(params: {
    customerName: string;
    orderNumber: string;
    totalEGP: number;
    status: string;
  }) {
    return {
      subject: `Gamers Matrix — Order ${params.orderNumber}`,
      text: [
        `Hello ${params.customerName},`,
        ``,
        `Your order ${params.orderNumber} is ${params.status}.`,
        `Total: ${params.totalEGP} EGP.`,
        `Digital delivery appears in your account only after server-side payment confirmation.`,
        ``,
        `— Gamers Matrix`,
      ].join('\n'),
    };
  }
}
