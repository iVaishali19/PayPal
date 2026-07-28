import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { protoPath } from '../proto-path';
import { ApplicationsController } from './applications.controller';
import { StudentsClientService } from './students-client.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'STUDENTS_SERVICE',
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            package: 'students',
            protoPath: protoPath('students.proto'),
            url: process.env.STUDENTS_SERVICE_URL || 'localhost:50062',
            loader: { keepCase: true },
          },
        }),
      },
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [StudentsClientService],
})
export class ApplicationsModule {}
