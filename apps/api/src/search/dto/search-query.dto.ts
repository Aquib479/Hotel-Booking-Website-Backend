import { IsString, IsIn, IsOptional, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsString()
  date: string;

  @IsIn(['HALF_DAY', 'FULL_DAY'])
  slotType: 'HALF_DAY' | 'FULL_DAY';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests?: number;
}

export class AvailabilityQueryDto {
  @IsUUID()
  hotelId: string;

  @IsString()
  date: string;

  @IsIn(['HALF_DAY', 'FULL_DAY'])
  slotType: 'HALF_DAY' | 'FULL_DAY';
}
