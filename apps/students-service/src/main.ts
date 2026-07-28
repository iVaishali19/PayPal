import 'reflect-metadata';
import './load-env';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { protoPath } from './proto-path';

// students-service exposes:
//   - a gRPC server (so the API gateway can call it)
//   - a RabbitMQ consumer (so it can react to payment.*.completed events)
//   - a tiny HTTP server for health checks
async function bootstrap() {
  const logger = new Logger('StudentsService');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', { exclude: ['health'] });

  const grpcPort = process.env.STUDENTS_GRPC_PORT || '50062';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'students',
      protoPath: protoPath('students.proto'),
      url: `0.0.0.0:${grpcPort}`,
      loader: { keepCase: true },
    },
  });

  // RabbitMQ consumer for payment events.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'payment_events',
      queueOptions: { durable: true },
      noAck: true,
    },
  });

  await app.startAllMicroservices();

  const httpPort = process.env.STUDENTS_HTTP_PORT || '3004';
  await app.listen(httpPort);

  logger.log(`HTTP listening on :${httpPort}`);
  logger.log(`gRPC listening on :${grpcPort}`);
}

bootstrap();
