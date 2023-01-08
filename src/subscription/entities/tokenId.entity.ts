import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'token_id' })
export class TokenId {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tokenNumber: string;

  @Column()
  collection: number;

  @Column()
  usd: number;

  @Column()
  currency: string;

  @Column()
  value: number;
}
