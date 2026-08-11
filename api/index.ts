import 'dotenv/config';
import * as express from 'express';
import * as path from 'path';
import serverless from 'serverless-http';
import { NestFactory, HttpAdapterHost, BaseExceptionFilter } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
// Load AppModule from compiled output if available (dist), otherwise fall back to src.
let AppModule: any;
// Resolve AppModule from several well-known locations to be robust across
// local builds and Vercel's serverless runtime bundling.
const tryRequire = (p: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(p);
    return mod && mod.AppModule ? mod.AppModule : null;
  } catch (err) {
    return null;
  }
};

AppModule =
  tryRequire(path.join(process.cwd(), 'dist', 'src', 'app.module')) ||
  tryRequire(path.join(process.cwd(), 'src', 'app.module')) ||
  tryRequire(path.join(__dirname, '..', 'dist', 'src', 'app.module')) ||
  tryRequire(path.join(__dirname, '..', 'src', 'app.module'));

if (!AppModule) {
  throw new Error('Could not load AppModule from dist or src.');
}

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

let handler: any;

async function bootstrapServer() {
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

  return serverless(expressApp);
}

export default async function (req: any, res: any) {
  if (!handler) {
    handler = await bootstrapServer();
  }
  return handler(req, res);
}
