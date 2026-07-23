import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Hotel } from './hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { S3Service } from '../common/s3.service';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel) private hotels: Repository<Hotel>,
    private config: ConfigService,
    private s3: S3Service,
  ) {}

  private checkAdminEnabled() {
    if (this.config.get('ADMIN_SEED_ENABLED') !== 'true') {
      throw new ForbiddenException('Admin endpoints are disabled');
    }
  }

  async create(dto: CreateHotelDto) {
    this.checkAdminEnabled();
    return this.hotels.save(this.hotels.create(dto));
  }

  /** Admin-gated list (seed tooling). */
  async list() {
    this.checkAdminEnabled();
    return this.listActive();
  }

  /** Public browse: active hotels only, with optional keyword / city filter. */
  async listActive() {
    return this.searchActive();
  }

  async searchActive(q?: string, city?: string) {
    const qb = this.hotels
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.rooms', 'r', 'r.is_active = true')
      .where('h.is_active = true');

    if (q?.trim()) {
      qb.andWhere(
        '(h.name ILIKE :q OR h.city ILIKE :q OR h.address ILIKE :q OR h.country ILIKE :q)',
        { q: `%${q.trim()}%` },
      );
    }

    if (city?.trim()) {
      qb.andWhere('h.city ILIKE :city', { city: `%${city.trim()}%` });
    }

    qb.orderBy('h.name', 'ASC');

    const hotels = await qb.getMany();

    return hotels.map((h) => {
      const rooms = h.rooms ?? [];
      const minPrice12h = rooms.length
        ? Math.min(...rooms.map((r) => +r.price12h))
        : null;
      const minPrice24h = rooms.length
        ? Math.min(...rooms.map((r) => +r.price24h))
        : null;
      const maxOccupancy = rooms.length
        ? Math.max(...rooms.map((r) => r.maxOccupancy))
        : null;
      const roomTypes = [...new Set(rooms.map((r) => r.roomType).filter(Boolean))];

      return {
        id: h.id,
        name: h.name,
        address: h.address,
        city: h.city,
        country: h.country,
        rating: h.rating != null ? +h.rating : null,
        latitude: h.latitude != null ? +h.latitude : null,
        longitude: h.longitude != null ? +h.longitude : null,
        source: h.source,
        imageUrl: h.imageUrl,
        imageUrls: h.imageUrls,
        createdAt: h.createdAt,
        roomCount: rooms.length,
        minPrice12h,
        minPrice24h,
        currency: rooms[0]?.currency ?? 'IDR',
        maxOccupancy,
        roomTypes,
      };
    });
  }

  async findActiveById(id: string) {
    const hotel = await this.hotels.findOne({ where: { id, isActive: true } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }
    return hotel;
  }

  async addImage(
    hotelId: string,
    file: Express.Multer.File | undefined,
    opts: { cover?: boolean } = {},
  ) {
    this.checkAdminEnabled();
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const hotel = await this.hotels.findOne({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const url = await this.s3.uploadHotelImage(hotelId, file);
    const imageUrls = [...(hotel.imageUrls ?? []), url];
    hotel.imageUrls = imageUrls;
    if (opts.cover || !hotel.imageUrl) {
      hotel.imageUrl = url;
    }

    return this.hotels.save(hotel);
  }
}
