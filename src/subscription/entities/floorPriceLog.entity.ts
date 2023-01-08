import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Collection } from './collection.entity';

@Entity({ name: 'floorprice_log' })
export class FloorPriceLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  timestamp: string;

  @ManyToOne(() => Collection, (collection) => collection.id)
  @JoinColumn({ name: `collection_id` })
  @Column({ name: `collection_id` })
  collection: number;

  @Column({ name: `floor_price` })
  floorPrice: number;

  @Column({ name: `eth_price` })
  ethPrice: number;
}
