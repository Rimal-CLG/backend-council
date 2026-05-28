import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties from request bodies
      forbidNonWhitelisted: true, // Throw 400 if unknown properties are sent
      transform: true, // Auto-transform payloads to DTO class instances
    }),
  );

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
