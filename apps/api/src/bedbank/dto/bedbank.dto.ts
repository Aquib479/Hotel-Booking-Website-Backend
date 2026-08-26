import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchRoomDto {
  @ApiProperty({ example: '1' })
  RoomNo: string;

  @ApiProperty({ example: '1' })
  NoOfAdults: string;

  @ApiPropertyOptional({ example: '' })
  NoOfChild?: string;

  @ApiPropertyOptional({ example: '' })
  Child1Age?: string;

  @ApiPropertyOptional({ example: '' })
  Child2Age?: string;

  @ApiProperty({ example: false })
  ExtraBed: boolean;
}

export class SearchHotelDto {
  @ApiProperty({ example: 'ID', description: 'Guest nationality ISO code' })
  Nationality: string;

  @ApiProperty({ example: 'ID', description: 'Destination country code' })
  Country: string;

  @ApiProperty({ example: 'ID-CGK', description: 'City code from GetDestinations' })
  City: string;

  @ApiProperty({
    example: { Code: ['ID10000117'] },
    description: 'Hotel codes. Use [""] for city-wide search.',
  })
  Hotels: { Code: string[] };

  @ApiProperty({ example: '2026-10-06' })
  CheckIn: string;

  @ApiProperty({ example: '2026-10-09' })
  CheckOut: string;

  @ApiProperty({
    example: {
      Room: [
        {
          RoomNo: '1',
          NoOfAdults: '1',
          NoOfChild: '',
          Child1Age: '',
          Child2Age: '',
          ExtraBed: false,
        },
      ],
    },
  })
  Rooms: { Room: SearchRoomDto[] };

  @ApiProperty({ example: 'IDR' })
  Currency: string;

  @ApiProperty({ example: 'En' })
  Language: string;

  @ApiProperty({ example: true })
  AvailFlag: boolean;

  @ApiProperty({ example: 'FULL' })
  DetailLevel: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Max hotels for city-wide search',
  })
  MaxNoOfHotel?: number;
}

export class RecheckRoomDetailsDto {
  @ApiProperty({ example: 'RM_214_0' })
  Code: string;

  @ApiProperty({ example: 'BDBF' })
  MealPlan: string;

  @ApiProperty({ example: 'Flexi' })
  CancellationPolicyType: string;

  @ApiProperty({ example: false })
  PackageRate: boolean;
}

export class RecheckRoomDto extends SearchRoomDto {
  @ApiProperty({
    example: '92db80ea-9c99-424c-aa18-762c25e806f0',
    description: 'Rate key from SearchHotel response',
  })
  RateKey: string;
}

export class RecheckHotelDto {
  @ApiProperty({
    example: '6ADE7581-A98C-4805-BECE-9638460C931D',
    description: 'Session ID from SearchHotel (valid ~20 min)',
  })
  SessionID: string;

  @ApiProperty({ example: 'ID' })
  Nationality: string;

  @ApiProperty({ example: 'ID' })
  Country: string;

  @ApiProperty({ example: 'ID-CGK' })
  City: string;

  @ApiProperty({ example: '2026-10-06' })
  CheckIn: string;

  @ApiProperty({ example: '2026-10-09' })
  CheckOut: string;

  @ApiProperty({ example: 'ID10000117' })
  HotelCode: string;

  @ApiProperty({ type: RecheckRoomDetailsDto })
  RoomDetails: RecheckRoomDetailsDto;

  @ApiProperty({
    example: {
      Room: [
        {
          RoomNo: '1',
          NoOfAdults: '1',
          NoOfChild: '',
          Child1Age: '',
          Child2Age: '',
          ExtraBed: false,
          RateKey: '92db80ea-9c99-424c-aa18-762c25e806f0',
        },
      ],
    },
  })
  Rooms: { Room: RecheckRoomDto[] };

  @ApiProperty({ example: 'IDR' })
  Currency: string;

  @ApiProperty({ example: 'EN' })
  Language: string;

  @ApiProperty({ example: true })
  AvailFlag: boolean;

  @ApiProperty({ example: 'FULL' })
  DetailLevel: string;
}

export class PaxDto {
  @ApiProperty({ example: 'Mr' })
  Salutation: string;

  @ApiProperty({ example: 'John' })
  FirstName: string;

  @ApiProperty({ example: 'Doe' })
  LastName: string;
}

export class BookRoomDto extends RecheckRoomDto {
  @ApiProperty({
    example: { Pax: [{ Salutation: 'Mr', FirstName: 'John', LastName: 'Doe' }] },
  })
  PaxDetails: { Pax: PaxDto[] };
}

export class BookHotelDto {
  @ApiProperty({
    example: '6ADE7581-A98C-4805-BECE-9638460C931D',
    description: 'Session ID from SearchHotel',
  })
  SessionID: string;

  @ApiProperty({
    example: 'RH260823011813',
    description: 'Your booking reference (max 15 chars)',
  })
  AgencyBookingID: string;

  @ApiProperty({ example: 'ID' })
  Nationality: string;

  @ApiProperty({ example: '2026-10-06' })
  CheckIn: string;

  @ApiProperty({ example: '2026-10-09' })
  CheckOut: string;

  @ApiProperty({ example: 'ID10000117' })
  HotelCode: string;

  @ApiProperty({ type: RecheckRoomDetailsDto })
  RoomDetails: RecheckRoomDetailsDto;

  @ApiProperty({
    example: {
      Room: [
        {
          RoomNo: '1',
          RateKey: '92db80ea-9c99-424c-aa18-762c25e806f0',
          NoOfAdults: '1',
          NoOfChild: '',
          Child1Age: '',
          Child2Age: '',
          ExtraBed: false,
          PaxDetails: {
            Pax: [{ Salutation: 'Mr', FirstName: 'John', LastName: 'Doe' }],
          },
        },
      ],
    },
  })
  Rooms: { Room: BookRoomDto[] };

  @ApiPropertyOptional({ example: 'Late check-in requested' })
  SpecialReq?: string;

  @ApiProperty({ example: false, description: 'true = hold, false = confirm' })
  OnHold: boolean;

  @ApiProperty({ example: true })
  AvailFlag: boolean;

  @ApiProperty({ example: 'IDR' })
  Currency: string;

  @ApiProperty({ example: 'EN' })
  Language: string;

  @ApiProperty({ example: 'FULL' })
  DetailLevel: string;
}

export class ReservationDetailsDto {
  @ApiPropertyOptional({
    example: 'AGID0542152608054476',
    description: 'Provide MGBookingID or AgencyBookingID',
  })
  MGBookingID?: string;

  @ApiPropertyOptional({
    example: 'RH260823011813',
    description: 'Provide MGBookingID or AgencyBookingID',
  })
  AgencyBookingID?: string;
}

export class ReservationListDto {
  @ApiProperty({
    example: '1',
    description: '1 = booking date, 2 = check-in date',
  })
  DateType: string;

  @ApiProperty({ example: '2026-08-23' })
  Date: string;

  @ApiProperty({ example: 'EN' })
  Language: string;

  @ApiProperty({ example: 'FULL' })
  DetailLevel: string;
}

export class CancelReservationDto {
  @ApiProperty({ example: 'AGID0542152608054476' })
  MGBookingID: string;
}

export class HotelDetailDto {
  @ApiProperty({ example: 'ID10000117' })
  HotelCode: string;
}
