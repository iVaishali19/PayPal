import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

// Strongly-typed remote procedures exposed by payment-service.
interface PaymentGrpcService {
  CreatePayment(data: Record<string, string>): Observable<Record<string, string>>;
  CapturePayment(data: Record<string, string>): Observable<Record<string, string>>;
  GetPaymentStatus(data: Record<string, string>): Observable<Record<string, string>>;
}

// Wraps the gRPC connection so business code never touches PayPal directly.
@Injectable()
export class PaymentClientService implements OnModuleInit {
  private paymentService!: PaymentGrpcService;

  constructor(@Inject('PAYMENT_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.paymentService = this.client.getService<PaymentGrpcService>('PaymentService');
  }

  createPayment(data: Record<string, string>) {
    return firstValueFrom(this.paymentService.CreatePayment(data));
  }

  capturePayment(data: { payment_order_id?: string; paypal_order_id?: string }) {
    return firstValueFrom(
      this.paymentService.CapturePayment({
        payment_order_id: data.payment_order_id || '',
        paypal_order_id: data.paypal_order_id || '',
      }),
    );
  }
}
