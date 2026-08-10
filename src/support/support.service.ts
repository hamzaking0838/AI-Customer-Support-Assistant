import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { EmailService } from '../email/email.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { SendSupportEmailDto } from './dto/send-support-email.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly aiService: AiService,
    private readonly emailService: EmailService,
  ) {}

  async generateChatResponse(dto: CreateSupportRequestDto) {
    const reply = await this.aiService.generateResponse(dto.name, dto.message);
    return {
      success: true,
      customerName: dto.name,
      reply,
    };
  }

  async sendSupportEmail(dto: SendSupportEmailDto) {
    // 1. Generate the response first
    const reply = await this.aiService.generateResponse(dto.name, dto.message);
    
    // 2. Send it via Resend
    await this.emailService.sendSupportEmail(dto.name, dto.email, dto.message, reply);

    return {
      success: true,
      message: 'Support response generated and email sent successfully.',
      reply, // we can also return reply for UI debuggability
    };
  }
}
