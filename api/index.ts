import 'dotenv/config';

const express = require('express');

import {
  NestFactory,
  HttpAdapterHost,
  BaseExceptionFilter,
} from '@nestjs/core';

import { ExpressAdapter } from '@nestjs/platform-express';

import {
  ValidationPipe,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

import * as Sentry from '@sentry/nestjs';

import { AppModule } from '../src/app.module';

// Initialize Sentry only when DSN exists
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

    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    if (
      process.env.SENTRY_DSN &&
      (!isHttp || status >= 500)
    ) {
      Sentry.captureException(exception);
    }

    super.catch(exception, host);
  }
}

let cachedServer: any;

async function bootstrapServer() {
  if (!cachedServer) {
    const expressApp = express();

    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    app.enableCors();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const { httpAdapter } = app.get(HttpAdapterHost);

    app.useGlobalFilters(
      new SentryExceptionFilter(httpAdapter),
    );

    // Root / health endpoint
    expressApp.get('/', (_req: any, res: any) => {
      res.status(200).json({
        status: 'ok',
        service: 'AI Customer Support Assistant',
        message: 'API is running successfully',
        docs: '/api/docs',
      });
    });

    // Swagger configuration
    const config = new DocumentBuilder()
      .setTitle('AI Customer Support Assistant API')
      .setDescription(
        'AI Customer Support Assistant API',
      )
      .setVersion('1.0')
      .addTag('Support')
      .build();

    const swaggerDocument =
      SwaggerModule.createDocument(app, config);

    // Swagger JSON
    expressApp.get(
      '/api/docs-json',
      (_req: any, res: any) => {
        res.status(200).json(swaggerDocument);
      },
    );

    // Swagger UI
    expressApp.get(
      '/api/docs',
      (_req: any, res: any) => {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>AI Customer Support Assistant API</title>

  <link
    rel="stylesheet"
    href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
  />

  <style>
    html {
      box-sizing: border-box;
    }

    *,
    *:before,
    *:after {
      box-sizing: inherit;
    }

    body {
      margin: 0;
      background: #fafafa;
    }
  </style>
</head>

<body>
  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>

  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(swaggerDocument)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: 'StandaloneLayout'
      });
    };
  </script>
</body>
</html>
        `;

        res.status(200).type('html').send(html);
      },
    );

    await app.init();

    cachedServer = expressApp;
  }

  return cachedServer;
}

export default async function handler(
  req: any,
  res: any,
) {
  try {
    const server = await bootstrapServer();

    return server(req, res);
  } catch (error) {
    console.error(
      'Vercel serverless handler error:',
      error,
    );

    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}