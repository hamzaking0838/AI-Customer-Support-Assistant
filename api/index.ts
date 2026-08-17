import 'dotenv/config';
import * as express from 'express';
import { NestFactory, HttpAdapterHost, BaseExceptionFilter } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import { AppModule } from '../src/app.module';

// Initialize Sentry if configured
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 1.0,
  });
}

@Catch()
class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (process.env.SENTRY_DSN && (!isHttp || status >= 500)) {
      Sentry.captureException(exception);
    }

    super.catch(exception, host);
  }
}

let cachedServer: express.Express;

async function bootstrapServer() {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    app.enableCors();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));

    // Initialize Swagger only for docs path (harmless if not used)
    try {
      const config = new DocumentBuilder()
        .setTitle('AI Customer Support Assistant API')
        .setDescription('An API to automate customer support replies using OpenAI and dispatch them via Resend email.')
        .setVersion('1.0')
        .addTag('Support')
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
    } catch (e) {
      // ignore swagger init errors in serverless environment
    }

    await app.init();
    cachedServer = expressApp;
  }
  
  return cachedServer;
}

export default async function (req: any, res: any) {
  const server = await bootstrapServer();
  return server(req, res);
}
