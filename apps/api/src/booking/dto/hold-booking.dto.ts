import { IsString, IsUUID, IsIn, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class HoldBookingDto {
  @IsUUID()
  roomId: string;

  @IsString()
  date: string;

  @IsIn(['HALF_DAY', 'FULL_DAY'])
  slotType: 'HALF_DAY' | 'FULL_DAY';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  numGuests?: number = 1;
}
