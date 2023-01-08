import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Token } from './token.entity';

@Entity({ name: 'eventList' })
export class EventList {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Token, (token) => token.id)
  @JoinColumn({ name: `tokenId` })
  tokenId: number;

  @Column()
  method: string;

  @Column()
  occurTime: string;
}
