import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Fix H-3: Set security headers (X-Content-Type-Options, X-Frame-Options, CSP, HSTS, etc.)
  app.use(helmet());

  // Fix H-2: Explicit CORS policy — reject requests from unknown origins
  app.enableCors({
    origin: process.env.ALLOWED_ORIGIN || false,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Fix L-1: Global API version prefix
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties from request bodies
      forbidNonWhitelisted: true, // Throw 400 if unknown properties are sent
      transform: true, // Auto-transform payloads to DTO class instances
    }),
  );

  // Fix M-5: Global exception filter — normalizes all error responses, prevents stack trace leaks
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Fatal error starting server',
    err instanceof Error ? err.stack : String(err),
  );
  process.exit(1);
});
