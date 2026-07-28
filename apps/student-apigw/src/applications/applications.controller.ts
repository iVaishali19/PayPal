import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { StudentsClientService } from './students-client.service';

class PayDto {
  @IsString()
  domain!: string; // frontend origin, e.g. http://localhost:3000

  @IsOptional()
  @IsString()
  couponCode?: string;
}

class CaptureDto {
  @IsString()
  paypalOrderId!: string;
}

// Public HTTP API for the frontend. In a real gateway this is where JWT
// authentication and request validation live. No PayPal credentials here.
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly students: StudentsClientService) {}

  @Post(':id/pay/applicationfee')
  pay(@Param('id', ParseIntPipe) id: number, @Body() body: PayDto) {
    return this.students.initiatePayment(id, body.domain, body.couponCode);
  }

  @Post(':id/pay/applicationfee/capture')
  capture(@Param('id', ParseIntPipe) id: number, @Body() body: CaptureDto) {
    return this.students.capturePayment(id, body.paypalOrderId);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.students.getApplication(id);
  }
}
