import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('nationalities')
export class Nationality {
  @PrimaryColumn({ length: 16 })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Index('idx_nationalities_source')
  @Column({ length: 32, default: 'mg' })
  source: string;

  @Column({ name: 'synced_at', type: 'timestamptz' })
  syncedAt: Date;
}
