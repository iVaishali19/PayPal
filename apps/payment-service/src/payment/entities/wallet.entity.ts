import { Column, DataType, Model, Table } from 'sequelize-typescript';

// Running balance per seller account.
@Table({ tableName: 'wallets', timestamps: true })
export class Wallet extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  account!: string;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  balance!: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'USD' })
  currency!: string;
}
