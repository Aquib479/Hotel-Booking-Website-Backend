import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';

import { Hotel } from './hotels/hotel.entity';
import { Room } from './rooms/room.entity';
import { Guest } from './guests/guest.entity';
import { Booking } from './booking/booking.entity';

import { AuthModule } from './auth/auth.module';
import { BedbankModule } from './bedbank/bedbank.module';
import { SearchService } from './search/search.service';
import { SearchController } from './search/search.controller';
import { BookingService } from './booking/booking.service';
import { BookingController } from './booking/booking.controller';
import { PaymentService } from './payment/payment.service';
import { PaymentController } from './payment/payment.controller';
import { HotelsService } from './hotels/hotels.service';
import { HotelsController } from './hotels/hotels.controller';
import { PublicHotelsController } from './hotels/public-hotels.controller';
import { RoomsService } from './rooms/rooms.service';
import { RoomsController } from './rooms/rooms.controller';

import { GistConflictFilter } from './common/gist-conflict.filter';
import { GlobalExceptionFilter } from './common/http-exception.filter';
import { S3Service } from './common/s3.service';
import { DbBootstrapService } from './common/db-bootstrap.service';

@Module({})
export class AppModule {
  static forRoot(): DynamicModule {
    const skipDb = process.env.SKIP_DB === 'true';

    if (skipDb) {
      // Local / CI smoke-test: Bedbank BFF only (no Postgres)
      return {
        module: AppModule,
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
          }),
          BedbankModule,
        ],
        providers: [
          { provide: APP_FILTER, useClass: GlobalExceptionFilter },
        ],
      };
    }

    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env', '../../.env'],
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (cfg: ConfigService) => ({
            type: 'postgres',
            url: cfg.get('DATABASE_URL'),
            entities: [Hotel, Room, Guest, Booking],
            synchronize: cfg.get('TYPEORM_SYNCHRONIZE') !== 'false',
            ssl: { rejectUnauthorized: false },
          }),
        }),
        TypeOrmModule.forFeature([Hotel, Room, Guest, Booking]),
        AuthModule,
        BedbankModule,
      ],
      controllers: [
        SearchController,
        BookingController,
        PaymentController,
        HotelsController,
        PublicHotelsController,
        RoomsController,
      ],
      providers: [
        SearchService,
        BookingService,
        PaymentService,
        HotelsService,
        RoomsService,
        S3Service,
        DbBootstrapService,
        { provide: APP_FILTER, useClass: GlobalExceptionFilter },
        { provide: APP_FILTER, useClass: GistConflictFilter },
      ],
    };
  }
}
