import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

interface StudentsGrpcService {
  InitiateApplicationPayment(
    data: { application_id: number; domain: string; coupon_code?: string },
  ): Observable<Record<string, string>>;
  CaptureApplicationPayment(
    data: { application_id: number; paypal_order_id: string },
  ): Observable<Record<string, string>>;
  GetApplication(data: { application_id: number }): Observable<Record<string, string>>;
}

@Injectable()
export class StudentsClientService implements OnModuleInit {
  private students!: StudentsGrpcService;

  constructor(@Inject('STUDENTS_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.students = this.client.getService<StudentsGrpcService>('StudentsService');
  }

  initiatePayment(applicationId: number, domain: string, couponCode?: string) {
    return firstValueFrom(
      this.students.InitiateApplicationPayment({
        application_id: applicationId,
        domain,
        coupon_code: couponCode || '',
      }),
    );
  }

  capturePayment(applicationId: number, paypalOrderId: string) {
    return firstValueFrom(
      this.students.CaptureApplicationPayment({
        application_id: applicationId,
        paypal_order_id: paypalOrderId,
      }),
    );
  }

  getApplication(applicationId: number) {
    return firstValueFrom(this.students.GetApplication({ application_id: applicationId }));
  }
}
