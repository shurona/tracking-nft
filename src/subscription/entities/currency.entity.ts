import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'currency' })
export class Currency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  symbol: string;

  @Column()
  decimals: number;

  @Column({ name: `eth_price` })
  ethPrice: number;

  @Column({ name: `usd_price` })
  usdPrice: number;
}
