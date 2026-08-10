import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { getSupportEmailHtml } from './email.template';

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');
    this.fromEmail = this.configService.get<string>('resend.fromEmail') || 'onboarding@resend.dev';
    
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendSupportEmail(customerName: string, customerEmail: string, originalMessage: string, aiResponse: string): Promise<void> {
    if (!this.resend) {
      throw new InternalServerErrorException(
        'Resend API Key is not configured. Please set the RESEND_API_KEY environment variable.',
      );
    }

    try {
      const html = getSupportEmailHtml(customerName, originalMessage, aiResponse);
      
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [customerEmail],
        subject: `Support Response for ${customerName}`,
        html: html,
      });

      if (error) {
        throw new InternalServerErrorException(`Resend failed: ${error.message}`);
      }
    } catch (error) {
      throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
    }
  }
}
