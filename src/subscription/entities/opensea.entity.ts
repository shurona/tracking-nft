import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'opensea' })
export class Opensea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: `event_type` })
  eventType: string;

  @Column()
  collection: string;

  @Column({ name: `event_time` })
  eventTime: string;

  @Column()
  link: string;

  @Column({ name: `orderhash` })
  orderHash: string;

  @Column()
  maker: string;

  @Column()
  taker: string | undefined;

  @Column()
  currency: string;

  @Column()
  value: string;

  @Column()
  note: string | undefined;
}
