import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Room } from './room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { S3Service } from '../common/s3.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private rooms: Repository<Room>,
    private config: ConfigService,
    private s3: S3Service,
  ) {}

  private checkAdminEnabled() {
    if (this.config.get('ADMIN_SEED_ENABLED') !== 'true') {
      throw new ForbiddenException('Admin endpoints are disabled');
    }
  }

  async create(dto: CreateRoomDto) {
    this.checkAdminEnabled();
    return this.rooms.save(this.rooms.create(dto));
  }

  async list(hotelId?: string) {
    this.checkAdminEnabled();
    const where: any = { isActive: true };
    if (hotelId) where.hotelId = hotelId;
    return this.rooms.find({ where });
  }

  /** Public: active rooms for a hotel. */
  async listByHotel(hotelId: string) {
    return this.rooms.find({
      where: { hotelId, isActive: true },
      order: { roomType: 'ASC', roomNumber: 'ASC' },
    });
  }

  async addImage(
    roomId: string,
    file: Express.Multer.File | undefined,
  ) {
    this.checkAdminEnabled();
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const room = await this.rooms.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const url = await this.s3.uploadRoomImage(room.hotelId, roomId, file);
    room.imageUrls = [...(room.imageUrls ?? []), url];

    return this.rooms.save(room);
  }
}
