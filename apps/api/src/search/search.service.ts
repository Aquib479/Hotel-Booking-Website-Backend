import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../rooms/room.entity';
import { Hotel } from '../hotels/hotel.entity';
import { resolveSlot, SlotType } from '../common/slots';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Room) private rooms: Repository<Room>,
    @InjectRepository(Hotel) private hotels: Repository<Hotel>,
  ) {}

  /**
   * User-facing discovery: find hotels with available rooms matching criteria.
   * Returns one entry per hotel with aggregated room info (count, cheapest price, room types).
   */
  async searchHotels(params: {
    q?: string;
    city?: string;
    date: string;
    slotType: SlotType;
    guests?: number;
  }) {
    const slot = resolveSlot(params.date, params.slotType);
    const minGuests = params.guests ?? 1;

    const qb = this.rooms
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.hotel', 'h')
      .where('h.is_active = true')
      .andWhere('r.is_active = true')
      .andWhere('r.max_occupancy >= :minGuests', { minGuests })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.room_id = r.id
            AND b.status IN ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED')
            AND b.period && tstzrange(:start::timestamptz, :end::timestamptz, '[)')
        )`,
        { start: slot.start.toISOString(), end: slot.end.toISOString() },
      );

    if (params.q?.trim()) {
      qb.andWhere(
        '(h.name ILIKE :q OR h.city ILIKE :q OR h.address ILIKE :q OR h.country ILIKE :q)',
        { q: `%${params.q.trim()}%` },
      );
    }

    if (params.city?.trim()) {
      qb.andWhere('h.city ILIKE :city', { city: `%${params.city.trim()}%` });
    }

    qb.orderBy('h.name', 'ASC');

    const availableRooms = await qb.getMany();

    const hotelMap = new Map<string, {
      hotel: Hotel;
      rooms: Room[];
    }>();

    for (const room of availableRooms) {
      const hotelId = room.hotel.id;
      if (!hotelMap.has(hotelId)) {
        hotelMap.set(hotelId, { hotel: room.hotel, rooms: [] });
      }
      hotelMap.get(hotelId)!.rooms.push(room);
    }

    return {
      date: params.date,
      slotType: params.slotType,
      startTime: slot.start.toISOString(),
      endTime: slot.end.toISOString(),
      results: Array.from(hotelMap.values()).map(({ hotel, rooms }) => {
        const prices = rooms.map((r) =>
          params.slotType === 'HALF_DAY' ? +r.price12h : +r.price24h,
        );
        return {
          hotel: {
            id: hotel.id,
            name: hotel.name,
            address: hotel.address,
            city: hotel.city,
            country: hotel.country,
            rating: hotel.rating != null ? +hotel.rating : null,
            latitude: hotel.latitude != null ? +hotel.latitude : null,
            longitude: hotel.longitude != null ? +hotel.longitude : null,
            source: hotel.source,
            imageUrl: hotel.imageUrl,
            imageUrls: hotel.imageUrls,
          },
          availableRooms: rooms.length,
          startingPrice: Math.min(...prices),
          currency: rooms[0].currency,
          roomTypes: [...new Set(rooms.map((r) => r.roomType).filter(Boolean))],
          maxOccupancy: Math.max(...rooms.map((r) => r.maxOccupancy)),
        };
      }),
    };
  }

  /**
   * Room-level availability for a specific hotel (hotel detail page).
   * Returns all available rooms for the given hotel + date + slot.
   */
  async checkAvailability(hotelId: string, date: string, slotType: SlotType) {
    const hotel = await this.hotels.findOne({ where: { id: hotelId, isActive: true } });
    if (!hotel) throw new NotFoundException('Hotel not found');

    const slot = resolveSlot(date, slotType);

    const rooms = await this.rooms
      .createQueryBuilder('r')
      .where('r.hotel_id = :hotelId', { hotelId })
      .andWhere('r.is_active = true')
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.room_id = r.id
            AND b.status IN ('HOLD', 'PENDING_PAYMENT', 'CONFIRMED')
            AND b.period && tstzrange(:start::timestamptz, :end::timestamptz, '[)')
        )`,
        { start: slot.start.toISOString(), end: slot.end.toISOString() },
      )
      .getMany();

    return {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        rating: hotel.rating != null ? +hotel.rating : null,
        latitude: hotel.latitude != null ? +hotel.latitude : null,
        longitude: hotel.longitude != null ? +hotel.longitude : null,
        imageUrl: hotel.imageUrl,
      },
      date,
      slotType,
      startTime: slot.start.toISOString(),
      endTime: slot.end.toISOString(),
      rooms: rooms.map((r) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        roomType: r.roomType,
        description: r.description,
        maxOccupancy: r.maxOccupancy,
        amenities: r.amenities,
        imageUrls: r.imageUrls,
        price: slotType === 'HALF_DAY' ? +r.price12h : +r.price24h,
        currency: r.currency,
      })),
    };
  }
}
