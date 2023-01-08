import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToMany } from 'typeorm';
import { Token } from './token.entity';

@Entity({ name: 'contract' })
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Token, (token) => token.contractId)
  @JoinColumn()
  tokens!: Token[];

  @Column()
  address: string;

  @Column()
  name: string;

  @Column()
  description: string;
}
