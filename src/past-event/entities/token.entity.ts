import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Contract } from './contract.entity';
import { EventList } from './eventlist.entity';

@Entity({ name: 'token' })
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Contract, (contract) => contract.id)
  @JoinColumn({ name: `contractId` })
  @Column()
  contractId: number;

  @OneToMany(() => EventList, (eventList) => eventList.tokenId)
  @JoinColumn()
  events!: EventList[];

  @Column()
  recentlySearchTime: string;
  //

  @Column()
  blockNumber: number;
}
