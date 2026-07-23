import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsUUID()
  hotelId: string;

  @IsString()
  roomNumber: string;

  @IsOptional()
  @IsString()
  roomType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxOccupancy?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsNumber()
  @Type(() => Number)
  price12h: number;

  @IsNumber()
  @Type(() => Number)
  price24h: number;
}
