import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Booking } from './booking.entity';
import { Room } from '../rooms/room.entity';
import { PaymentService } from '../payment/payment.service';
import { resolveSlot, SlotType } from '../common/slots';

function parsePeriod(period: string): { checkIn: string; checkOut: string } {
  const inner = period.replace(/[\[\]()]/g, '');
  const [start, end] = inner.split(',').map((s) => s.trim().replace(/"/g, ''));
  return { checkIn: start, checkOut: end };
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private readonly holdTtlMinutes: number;
  private readonly paymentTtlMinutes: number;

  constructor(
    @InjectRepository(Booking) private bookings: Repository<Booking>,
    @InjectRepository(Room) private rooms: Repository<Room>,
    private payment: PaymentService,
    private config: ConfigService,
  ) {
    this.holdTtlMinutes = config.get<number>('HOLD_TTL_MINUTES', 3);
    this.paymentTtlMinutes = config.get<number>('PAYMENT_TTL_MINUTES', 15);
  }

  async createHold(guestId: string, params: {
    roomId: string;
    date: string;
    slotType: SlotType;
    numGuests: number;
  }) {
    const room = await this.rooms.findOne({
      where: { id: params.roomId, isActive: true },
      relations: { hotel: true },
    });
    if (!room) throw new NotFoundException('Room not found');

    const slot = resolveSlot(params.date, params.slotType);
    const price = params.slotType === 'HALF_DAY' ? +room.price12h : +room.price24h;

    const holdExpiresAt = new Date(Date.now() + this.holdTtlMinutes * 60_000);

    const booking = this.bookings.create({
      roomId: params.roomId,
      guestId,
      period: slot.period,
      slotType: params.slotType,
      numGuests: params.numGuests,
      status: 'HOLD',
      totalPrice: price,
      currency: room.currency,
      holdExpiresAt,
    });

    const saved = await this.bookings.save(booking);

    return {
      bookingId: saved.id,
      status: 'HOLD',
      holdExpiresAt: saved.holdExpiresAt.toISOString(),
      checkIn: slot.start.toISOString(),
      checkOut: slot.end.toISOString(),
      slotType: params.slotType,
      numGuests: params.numGuests,
      totalPrice: price,
      currency: room.currency,
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
      },
      hotel: {
        id: room.hotel.id,
        name: room.hotel.name,
        address: room.hotel.address,
        city: room.hotel.city,
        country: room.hotel.country,
        rating: room.hotel.rating != null ? +room.hotel.rating : null,
        imageUrl: room.hotel.imageUrl ?? room.hotel.imageUrls?.[0] ?? null,
        imageUrls: room.hotel.imageUrls ?? [],
      },
    };
  }

  async getById(bookingId: string, guestId: string) {
    const booking = await this.bookings.findOne({
      where: { id: bookingId, guestId },
      relations: { room: { hotel: true }, guest: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.toResponse(booking);
  }

  async confirmHold(bookingId: string, guestId: string) {
    const orderId = `RH-${bookingId.slice(0, 8)}-${Date.now()}`;
    const paymentExpiresAt = new Date(Date.now() + this.paymentTtlMinutes * 60_000);

    const result = await this.bookings
      .createQueryBuilder()
      .update(Booking)
      .set({
        status: 'PENDING_PAYMENT',
        paymentOrderId: orderId,
        paymentExpiresAt,
      })
      .where('id = :id', { id: bookingId })
      .andWhere('guest_id = :gid', { gid: guestId })
      .andWhere("status = 'HOLD'")
      .andWhere('hold_expires_at > NOW()')
      .execute();

    if (result.affected === 0) {
      throw new ConflictException({
        code: 'HOLD_EXPIRED',
        message: 'Hold has expired or does not exist. Please search again.',
      });
    }

    const booking = await this.bookings.findOne({
      where: { id: bookingId },
      relations: { room: { hotel: true }, guest: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const snap = await this.payment.createSnapToken({
      orderId,
      amount: +booking.totalPrice,
      guestName: booking.guest.fullName,
      guestPhone: booking.guest.phone,
      description: `Room ${booking.room.roomNumber} | ${booking.slotType}`,
    });

    return {
      bookingId: booking.id,
      paymentOrderId: orderId,
      paymentExpiresAt: paymentExpiresAt.toISOString(),
      snapToken: snap.token,
      redirectUrl: snap.redirectUrl,
    };
  }

  async releaseHold(bookingId: string, guestId: string) {
    const result = await this.bookings
      .createQueryBuilder()
      .update(Booking)
      .set({ status: 'CANCELLED', cancelledAt: () => 'NOW()' })
      .where('id = :id', { id: bookingId })
      .andWhere('guest_id = :gid', { gid: guestId })
      .andWhere("status = 'HOLD'")
      .execute();

    if (result.affected === 0) {
      throw new ConflictException({
        code: 'CANNOT_RELEASE',
        message: 'Booking is not in HOLD status or does not belong to you.',
      });
    }

    return { released: true };
  }

  async onPaymentSuccess(orderId: string) {
    await this.bookings
      .createQueryBuilder()
      .update(Booking)
      .set({ status: 'CONFIRMED' })
      .where('payment_order_id = :orderId', { orderId })
      .andWhere('status IN (:...statuses)', {
        statuses: ['PENDING_PAYMENT', 'CANCELLED'],
      })
      .execute();
  }

  async onPaymentFailed(orderId: string) {
    await this.bookings
      .createQueryBuilder()
      .update(Booking)
      .set({ status: 'CANCELLED', cancelledAt: () => 'NOW()' })
      .where('payment_order_id = :orderId', { orderId })
      .andWhere("status = 'PENDING_PAYMENT'")
      .execute();
  }

  async listMyBookings(guestId: string) {
    const bookings = await this.bookings.find({
      where: { guestId },
      relations: { room: { hotel: true } },
      order: { createdAt: 'DESC' },
    });

    return bookings.map((b) => this.toResponse(b));
  }

  private toResponse(b: Booking) {
    const { checkIn, checkOut } = parsePeriod(b.period);
    return {
      id: b.id,
      status: b.status,
      slotType: b.slotType,
      numGuests: b.numGuests,
      checkIn,
      checkOut,
      totalPrice: +b.totalPrice,
      currency: b.currency,
      holdExpiresAt: b.holdExpiresAt?.toISOString() ?? null,
      paymentOrderId: b.paymentOrderId ?? null,
      paymentExpiresAt: b.paymentExpiresAt?.toISOString() ?? null,
      cancelledAt: b.cancelledAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
      room: b.room
        ? {
            id: b.room.id,
            roomNumber: b.room.roomNumber,
            roomType: b.room.roomType,
          }
        : null,
      hotel: b.room?.hotel
        ? {
            id: b.room.hotel.id,
            name: b.room.hotel.name,
            address: b.room.hotel.address,
            city: b.room.hotel.city,
            country: b.room.hotel.country,
            rating: b.room.hotel.rating != null ? +b.room.hotel.rating : null,
            imageUrl: b.room.hotel.imageUrl ?? b.room.hotel.imageUrls?.[0] ?? null,
            imageUrls: b.room.hotel.imageUrls ?? [],
          }
        : null,
      guest: b.guest
        ? {
            fullName: b.guest.fullName,
            email: b.guest.email,
            phone: b.guest.phone,
          }
        : null,
    };
  }
}
