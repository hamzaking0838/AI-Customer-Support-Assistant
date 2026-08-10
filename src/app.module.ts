import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AiService } from './ai/ai.service';
import { EmailService } from './email/email.service';
import { SupportController } from './support/support.controller';
import { SupportService } from './support/support.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
  controllers: [SupportController],
  providers: [SupportService, AiService, EmailService],
})
export class AppModule {}
