import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Room } from '../rooms/room.entity';
import { Guest } from '../guests/guest.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'guest_id' })
  guestId: string;

  @Column({ type: 'tstzrange' })
  period: string;

  @Column({ name: 'slot_type', length: 10 })
  slotType: string;

  @Column({ name: 'num_guests', type: 'smallint', default: 1 })
  numGuests: number;

  @Column({ length: 20, default: 'HOLD' })
  status: string;

  @Column({ name: 'total_price', type: 'decimal', precision: 14, scale: 2 })
  totalPrice: number;

  @Column({ length: 3, default: 'IDR' })
  currency: string;

  @Column({ name: 'hold_expires_at', type: 'timestamptz', nullable: true })
  holdExpiresAt: Date;

  @Column({ name: 'payment_order_id', type: 'varchar', length: 200, nullable: true, unique: true })
  paymentOrderId: string;

  @Column({ name: 'payment_expires_at', type: 'timestamptz', nullable: true })
  paymentExpiresAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => Guest)
  @JoinColumn({ name: 'guest_id' })
  guest: Guest;
}
