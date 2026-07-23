import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Guest } from '../guests/guest.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Guest) private guests: Repository<Guest>,
    private jwt: JwtService,
  ) {}

  async register(data: {
    fullName: string;
    phone: string;
    email?: string;
    password: string;
  }) {
    const exists = await this.guests.findOne({ where: { phone: data.phone } });
    if (exists) {
      throw new BadRequestException('Phone number already registered');
    }

    const hash = await bcrypt.hash(data.password, 10);
    const guest = await this.guests.save(
      this.guests.create({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        passwordHash: hash,
      }),
    );

    return this.toAuthResponse(guest);
  }

  async login(phone: string, password: string) {
    const guest = await this.guests.findOne({ where: { phone } });
    if (!guest) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, guest.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.toAuthResponse(guest);
  }

  private toAuthResponse(guest: Guest) {
    return {
      id: guest.id,
      fullName: guest.fullName,
      phone: guest.phone,
      email: guest.email ?? null,
      createdAt: guest.createdAt,
      token: this.signToken(guest),
    };
  }

  private signToken(guest: Guest): string {
    return this.jwt.sign({ sub: guest.id, phone: guest.phone });
  }
}
