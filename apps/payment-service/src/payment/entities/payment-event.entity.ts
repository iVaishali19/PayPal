import { Column, DataType, Model, Table } from 'sequelize-typescript';

// A "checkout session": the buyer/seller context around one or more
// payment attempts.
@Table({ tableName: 'payment_events', timestamps: true })
export class PaymentEvent extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  checkoutId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  domain!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  referenceId!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  buyerEmail!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  sellerAccount!: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'OPEN' })
  status!: string;
}
