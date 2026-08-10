import 'dotenv/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import { BaseExceptionFilter } from '@nestjs/core';

// Initialize Sentry before the application starts
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 1.0,
  });
  console.log('Sentry monitoring initialized successfully.');
} else {
  console.log('Sentry is not configured. Skipping initialization.');
}

// Exception filter to capture unhandled exceptions in Sentry
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Report non-4xx exceptions (like 500 Internal Server Errors) or completely unhandled errors to Sentry
    if (process.env.SENTRY_DSN && (!isHttp || status >= 500)) {
      Sentry.captureException(exception);
    }

    super.catch(exception, host);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Enable validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set Sentry filter globally if DSN is set
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));

  // Configure Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('AI Customer Support Assistant API')
    .setDescription(
      'An API to automate customer support replies using OpenAI and dispatch them via Resend email.',
    )
    .setVersion('1.0')
    .addTag('Support')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation is available at: http://localhost:${port}/api/docs`);
}
bootstrap();
