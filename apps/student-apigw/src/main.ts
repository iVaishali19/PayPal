import 'reflect-metadata';
import './load-env';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// The only public door. Exposes HTTP to the frontend and forwards to
// internal services over gRPC. Holds NO PayPal credentials.
async function bootstrap() {
  const logger = new Logger('StudentApiGw');
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.GATEWAY_PORT || '3000';
  await app.listen(port);
  logger.log(`API gateway listening on :${port}`);
}

bootstrap();
