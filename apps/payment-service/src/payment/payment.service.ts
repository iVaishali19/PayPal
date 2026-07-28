import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { PayPalService } from './paypal/paypal.service';
import { PaymentEventsPublisher } from './events/payment-events.publisher';
import { PaymentOrder } from './entities/payment-order.entity';
import { PaymentEvent } from './entities/payment-event.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Wallet } from './entities/wallet.entity';
import { PaymentOrderStatus } from './payment-status.enum';

export interface CreatePaymentPayload {
  checkoutId: string;
  paymentOrderId: string;
  domain: string;
  referenceId: string;
  payerId: string;
  amount: string;
  currency: string;
  buyerEmail: string;
  sellerAccount: string;
  paymentCategory: string;
  returnUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
  description?: string;
  metadata?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger('PaymentService');

  constructor(
    @InjectModel(PaymentOrder) private readonly paymentOrderModel: typeof PaymentOrder,
    @InjectModel(PaymentEvent) private readonly paymentEventModel: typeof PaymentEvent,
    @InjectModel(LedgerEntry) private readonly ledgerModel: typeof LedgerEntry,
    @InjectModel(Wallet) private readonly walletModel: typeof Wallet,
    private readonly sequelize: Sequelize,
    private readonly paypalService: PayPalService,
    private readonly eventsPublisher: PaymentEventsPublisher,
  ) {}

  // Create → returns an approveUrl the user must visit.
  async createPayment(input: CreatePaymentPayload) {
    // Idempotency: if we already have an order for this key, return it.
    const existing = await this.paymentOrderModel.findOne({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      this.logger.log(`Idempotent hit for key ${input.idempotencyKey}`);
      return this.buildCreateResponse(existing);
    }

    await this.paymentEventModel.create({
      checkoutId: input.checkoutId,
      domain: input.domain,
      referenceId: input.referenceId,
      buyerEmail: input.buyerEmail,
      sellerAccount: input.sellerAccount,
      status: 'OPEN',
    });

    const order = await this.paymentOrderModel.create({
      paymentOrderId: input.paymentOrderId,
      checkoutId: input.checkoutId,
      amount: input.amount,
      currency: input.currency,
      paymentOrderStatus: PaymentOrderStatus.NOT_STARTED,
      domain: input.domain,
      referenceId: input.referenceId,
      payerId: input.payerId,
      buyerEmail: input.buyerEmail,
      sellerAccount: input.sellerAccount,
      paymentCategory: input.paymentCategory,
      idempotencyKey: input.idempotencyKey,
      description: input.description,
      metadata: input.metadata,
    });

    const paypalOrder = await this.paypalService.createOrder({
      paymentOrderId: order.paymentOrderId,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      idempotencyKey: input.idempotencyKey,
    });

    await order.update({
      paymentOrderStatus: PaymentOrderStatus.EXECUTING,
      paypalOrderId: paypalOrder.paypalOrderId,
    });

    return this.buildCreateResponse(order, paypalOrder.approveUrl);
  }

  // Capture → actually moves the money after the user approved.
  async capturePayment(paymentOrderId?: string, paypalOrderId?: string) {
    const order = await this.findOrder(paymentOrderId, paypalOrderId);

    if (order.paymentOrderStatus === PaymentOrderStatus.SUCCESS) {
      return this.buildCaptureResponse(order); // already captured (idempotent)
    }

    let capture: { status: string; captureId: string };
    try {
      capture = await this.paypalService.captureOrder(order.paypalOrderId);
    } catch (err) {
      await order.update({ paymentOrderStatus: PaymentOrderStatus.FAILED });
      throw err;
    }

    if (capture.status !== 'COMPLETED') {
      await order.update({ paymentOrderStatus: PaymentOrderStatus.FAILED });
      throw new Error(`PayPal capture status: ${capture.status}`);
    }

    await this.finalizeSuccessfulPayment(order, capture.captureId);
    return this.buildCaptureResponse(order);
  }

  async getStatus(paymentOrderId: string) {
    const order = await this.findOrder(paymentOrderId);
    return order;
  }

  // Runs in a single DB transaction so money data stays consistent.
  private async finalizeSuccessfulPayment(order: PaymentOrder, captureId: string) {
    await this.sequelize.transaction(async (t) => {
      await order.update(
        {
          paymentOrderStatus: PaymentOrderStatus.SUCCESS,
          captureId,
        },
        { transaction: t },
      );

      // Update seller wallet balance.
      const [wallet] = await this.walletModel.findOrCreate({
        where: { account: order.sellerAccount || 'default' },
        defaults: { account: order.sellerAccount || 'default', balance: '0', currency: order.currency },
        transaction: t,
      });
      const newBalance = (Number(wallet.balance) + Number(order.amount)).toFixed(2);
      await wallet.update({ balance: newBalance }, { transaction: t });

      // Ledger entries (audit trail).
      await this.ledgerModel.create(
        {
          paymentOrderId: order.paymentOrderId,
          account: order.sellerAccount || 'default',
          entryType: 'CREDIT',
          amount: order.amount,
          currency: order.currency,
        },
        { transaction: t },
      );

      // Mark checkout event done.
      await this.paymentEventModel.update(
        { status: 'DONE' },
        { where: { checkoutId: order.checkoutId }, transaction: t },
      );
    });

    // Publish AFTER the transaction commits.
    this.eventsPublisher.publishCompleted({
      domain: order.domain,
      referenceId: order.referenceId,
      paymentOrderId: order.paymentOrderId,
      paypalOrderId: order.paypalOrderId,
      captureId,
      amount: order.amount,
      currency: order.currency,
    });
  }

  private async findOrder(paymentOrderId?: string, paypalOrderId?: string) {
    const where: Record<string, string> = {};
    if (paymentOrderId) where.paymentOrderId = paymentOrderId;
    else if (paypalOrderId) where.paypalOrderId = paypalOrderId;
    else throw new Error('paymentOrderId or paypalOrderId is required');

    const order = await this.paymentOrderModel.findOne({ where });
    if (!order) throw new Error('Payment order not found');
    return order;
  }

  private buildCreateResponse(order: PaymentOrder, approveUrl?: string) {
    return {
      status: 200,
      message: 'ok',
      paymentOrderId: order.paymentOrderId,
      paypalOrderId: order.paypalOrderId || '',
      approveUrl: approveUrl || '',
      paymentOrderStatus: order.paymentOrderStatus,
    };
  }

  private buildCaptureResponse(order: PaymentOrder) {
    return {
      status: 200,
      message: 'ok',
      paymentOrderId: order.paymentOrderId,
      paypalOrderId: order.paypalOrderId || '',
      captureId: order.captureId || '',
      paymentOrderStatus: order.paymentOrderStatus,
    };
  }
}
