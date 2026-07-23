import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { RoomsService } from '../rooms/rooms.service';

@Controller('hotels')
export class PublicHotelsController {
  constructor(
    private hotelsService: HotelsService,
    private roomsService: RoomsService,
  ) {}

  @Get()
  list(@Query('q') q?: string, @Query('city') city?: string) {
    return this.hotelsService.searchActive(q, city);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.hotelsService.findActiveById(id);
  }

  @Get(':id/rooms')
  listRooms(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.listByHotel(id);
  }
}
