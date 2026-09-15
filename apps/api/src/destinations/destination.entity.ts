import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { DestinationSourceCode } from './destination-source-code.entity';

@Entity('destinations')
export class Destination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'city_name', length: 200 })
  cityName: string;

  @Column({ name: 'country_name', length: 200 })
  countryName: string;

  @Column({ name: 'country_iso', type: 'varchar', length: 8, nullable: true })
  countryIso: string | null;

  @Column({ name: 'continent_code', type: 'varchar', length: 8, nullable: true })
  continentCode: string | null;

  @Column({ name: 'continent_name', type: 'varchar', length: 100, nullable: true })
  continentName: string | null;

  @Index('idx_destinations_search_text')
  @Column({ name: 'search_text', type: 'text' })
  searchText: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => DestinationSourceCode, (code) => code.destination)
  sourceCodes: DestinationSourceCode[];
}
