import { Body, Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { SendSupportEmailDto } from './dto/send-support-email.dto';
import { SupportService } from './support.service';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a support response using AI' })
  @ApiResponse({
    status: 200,
    description: 'AI response successfully generated.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        customerName: { type: 'string', example: 'Ali' },
        reply: {
          type: 'string',
          example: 'I\'m sorry to hear that your order has not arrived yet. Please provide your order number...',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 500, description: 'Internal server error (e.g. AI error).' })
  async chat(@Body() dto: CreateSupportRequestDto) {
    return this.supportService.generateChatResponse(dto);
  }

  @Post('email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate support response using AI and send email to customer' })
  @ApiResponse({
    status: 200,
    description: 'AI response successfully generated and email sent via Resend.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Support response generated and email sent successfully.' },
        reply: { type: 'string', example: 'Hello Ali, I understand your order has not arrived...' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 500, description: 'Internal server error (e.g. AI or Resend error).' })
  async email(@Body() dto: SendSupportEmailDto) {
    return this.supportService.sendSupportEmail(dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEMPORARY: Sentry verification endpoint.
  // Call GET /support/test-sentry to verify Sentry captures exceptions.
  // REMOVE THIS ENDPOINT after confirming error appears in Sentry dashboard.
  // ─────────────────────────────────────────────────────────────────────────
  @Get('test-sentry')
  @ApiOperation({
    summary: '[TEMPORARY] Test Sentry error capture',
    description:
      'Intentionally throws an unhandled error to verify Sentry is correctly capturing server-side exceptions. REMOVE after testing.',
  })
  @ApiResponse({ status: 500, description: 'Intentional test error — check your Sentry dashboard.' })
  testSentry(): never {
    throw new Error('Test Sentry error - Customer Support Assistant');
  }
}

