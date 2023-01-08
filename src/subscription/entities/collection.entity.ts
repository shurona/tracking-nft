import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToMany } from 'typeorm';
import { FloorPriceLog } from './floorPriceLog.entity';

@Entity({ name: 'collection' })
export class Collection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ name: `floor_price` })
  floorPrice: number;

  @Column()
  currency: string;

  @Column({ name: `expiration_date` })
  expirationDate: string;

  @OneToMany(() => FloorPriceLog, (floorPriceLog) => floorPriceLog.collection)
  @JoinColumn()
  floorPriceLogs: FloorPriceLog[];
}
