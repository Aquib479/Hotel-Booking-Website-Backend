import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Hotel } from '../hotels/hotel.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id' })
  hotelId: string;

  @Column({ name: 'room_number', length: 20 })
  roomNumber: string;

  @Column({ name: 'room_type', type: 'varchar', length: 100, nullable: true })
  roomType: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'max_occupancy', type: 'smallint', default: 2 })
  maxOccupancy: number;

  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  amenities: string[];

  @Column({
    name: 'image_urls',
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  imageUrls: string[];

  @Column({ name: 'price_12h', type: 'decimal', precision: 14, scale: 2 })
  price12h: number;

  @Column({ name: 'price_24h', type: 'decimal', precision: 14, scale: 2 })
  price24h: number;

  @Column({ length: 3, default: 'IDR' })
  currency: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Hotel, (hotel) => hotel.rooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;
}
