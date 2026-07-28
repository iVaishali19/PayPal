import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface PayPalCreateOrderInput {
  paymentOrderId: string;
  amount: string;
  currency: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
}

// Encapsulates ALL communication with PayPal so credentials and REST
// calls live in exactly one place.
@Injectable()
export class PayPalService implements OnModuleInit {
  private readonly logger = new Logger('PayPalService');
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.logConfiguration();
  }

  private get apiBase(): string {
    return (
      this.config.get<string>('PAYPAL_API_BASE') ||
      'https://api-m.sandbox.paypal.com'
    );
  }

  // Startup sanity check: verify sandbox vs live at a glance (secrets masked).
  logConfiguration() {
    const clientId = this.config.get<string>('PAYPAL_CLIENT_ID') || '';
    const masked =
      clientId.length > 8
        ? `${clientId.slice(0, 4)}...${clientId.slice(-4)} (${clientId.length} chars)`
        : '(missing)';
    this.logger.log('PayPal configuration check:');
    this.logger.log(`  PAYPAL_API_BASE: ${this.apiBase}`);
    this.logger.log(`  PAYPAL_CLIENT_ID: ${masked}`);
    this.logger.log(
      `  credentialsPresent: ${Boolean(clientId && this.config.get('PAYPAL_CLIENT_SECRET'))}`,
    );
    this.logger.log(
      `  environment: ${this.apiBase.includes('sandbox') ? 'sandbox' : 'live'}`,
    );
  }

  // OAuth token, cached until (almost) expiry so we don't re-auth per call.
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const response = await axios.post(
      `${this.apiBase}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        auth: {
          username: this.config.get<string>('PAYPAL_CLIENT_ID') || '',
          password: this.config.get<string>('PAYPAL_CLIENT_SECRET') || '',
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiresAt = now + (response.data.expires_in - 60) * 1000;
    return this.accessToken as string;
  }

  // Orders v2 — step 1: create an order and get the approval link.
  async createOrder(input: PayPalCreateOrderInput) {
    const token = await this.getAccessToken();

    const response = await axios.post(
      `${this.apiBase}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            custom_id: input.paymentOrderId,
            description: input.description,
            amount: {
              currency_code: input.currency,
              value: input.amount,
            },
          },
        ],
        application_context: {
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
          brand_name: 'YourApp',
          user_action: 'PAY_NOW',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'PayPal-Request-Id': input.idempotencyKey,
          'Content-Type': 'application/json',
        },
      },
    );

    const paypalOrderId: string = response.data.id;
    const approveUrl: string | undefined = response.data.links?.find(
      (l: { rel: string; href: string }) => l.rel === 'approve',
    )?.href;

    return { paypalOrderId, approveUrl };
  }

  // Orders v2 — step 3: capture the approved funds.
  async captureOrder(paypalOrderId: string) {
    const token = await this.getAccessToken();

    const response = await axios.post(
      `${this.apiBase}/v2/checkout/orders/${paypalOrderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const capture =
      response.data.purchase_units?.[0]?.payments?.captures?.[0];
    return {
      status: response.data.status as string,
      captureId: (capture?.id as string) || '',
    };
  }
}
