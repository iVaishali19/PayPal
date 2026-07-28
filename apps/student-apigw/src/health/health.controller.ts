import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'healthy',
      service: 'student-apigw',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
