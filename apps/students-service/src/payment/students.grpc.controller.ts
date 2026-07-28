import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ApplicationPaymentService } from './application-payment.service';

// Implements students.proto — the contract the API gateway calls.
@Controller()
export class StudentsGrpcController {
  constructor(private readonly service: ApplicationPaymentService) {}

  @GrpcMethod('StudentsService', 'InitiateApplicationPayment')
  async initiate(data: { application_id: number; domain: string; coupon_code?: string }) {
    const res = await this.service.initiateTuitionPayment(
      Number(data.application_id),
      data.domain,
    );
    return {
      status: res.status,
      message: res.message,
      approve_url: res.approveUrl || '',
      paypal_order_id: (res as { paypalOrderId?: string }).paypalOrderId || '',
      payment_order_id: (res as { paymentOrderId?: string }).paymentOrderId || '',
    };
  }

  @GrpcMethod('StudentsService', 'CaptureApplicationPayment')
  async capture(data: { application_id: number; paypal_order_id: string }) {
    const res = await this.service.captureTuitionPayment(
      Number(data.application_id),
      data.paypal_order_id,
    );
    return {
      status: res.status,
      message: res.message,
      application_status: res.applicationStatus,
    };
  }

  @GrpcMethod('StudentsService', 'GetApplication')
  getApplication(data: { application_id: number }) {
    const app = this.service.getApplication(Number(data.application_id));
    return {
      application_id: app?.id || 0,
      student_id: app?.studentId || '',
      amount: app?.amount || '0',
      currency: app?.currency || 'USD',
      payment_status: app?.paymentStatus || 'UNKNOWN',
    };
  }
}
