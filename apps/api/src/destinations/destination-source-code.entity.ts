import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Destination } from './destination.entity';

@Entity('destination_source_codes')
@Unique('uq_destination_source_city', ['source', 'cityCode'])
@Unique('uq_destination_source_pair', ['destinationId', 'source'])
export class DestinationSourceCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_destination_source_codes_destination')
  @Column({ name: 'destination_id', type: 'uuid' })
  destinationId: string;

  @ManyToOne(() => Destination, (d) => d.sourceCodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'destination_id' })
  destination: Destination;

  /** Supplier key, e.g. mg, tbo */
  @Column({ length: 32 })
  source: string;

  @Column({ name: 'country_code', length: 32 })
  countryCode: string;

  @Column({ name: 'city_code', length: 64 })
  cityCode: string;

  @Column({ name: 'raw_name', type: 'varchar', length: 200, nullable: true })
  rawName: string | null;

  @Column({ name: 'synced_at', type: 'timestamptz' })
  syncedAt: Date;
}
