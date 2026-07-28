import 'reflect-metadata';
import './load-env';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { protoPath } from './proto-path';

// The payment-service runs TWO servers in one process:
//   - HTTP  (health checks, webhooks, admin/testing)  -> default port 3003
//   - gRPC  (fast, typed internal calls from other services) -> default 50061
async function bootstrap() {
  const logger = new Logger('PaymentService');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api', { exclude: ['health'] });

  const grpcPort = process.env.PAYMENT_GRPC_PORT || '50061';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'payment',
      protoPath: protoPath('payment.proto'),
      url: `0.0.0.0:${grpcPort}`,
      loader: { keepCase: true },
    },
  });

  await app.startAllMicroservices();

  const httpPort = process.env.PAYMENT_HTTP_PORT || '3003';
  await app.listen(httpPort);

  logger.log(`HTTP server listening on :${httpPort}`);
  logger.log(`gRPC server listening on :${grpcPort}`);
}

bootstrap();
