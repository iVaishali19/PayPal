import { Column, DataType, Model, Table } from 'sequelize-typescript';

// Immutable financial audit trail. One entry per money movement.
@Table({ tableName: 'ledger_entries', timestamps: true })
export class LedgerEntry extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  paymentOrderId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  account!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  entryType!: string; // CREDIT | DEBIT

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  amount!: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'USD' })
  currency!: string;
}
