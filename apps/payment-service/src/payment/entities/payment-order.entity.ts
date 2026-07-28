import {
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { PaymentOrderStatus } from '../payment-status.enum';

// One row per payment attempt. Holds the link to PayPal (paypalOrderId)
// and the current state of the payment.
@Table({ tableName: 'payment_orders', timestamps: true })
export class PaymentOrder extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  paymentOrderId!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  checkoutId!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  paypalOrderId!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  captureId!: string;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentOrderStatus)),
    allowNull: false,
    defaultValue: PaymentOrderStatus.NOT_STARTED,
  })
  paymentOrderStatus!: PaymentOrderStatus;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  amount!: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'USD' })
  currency!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  domain!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  referenceId!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  payerId!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  buyerEmail!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  sellerAccount!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  paymentCategory!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  idempotencyKey!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  metadata!: string;
}
