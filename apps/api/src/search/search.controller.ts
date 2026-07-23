import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto, AvailabilityQueryDto } from './dto/search-query.dto';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  search(@Query() query: SearchQueryDto) {
    return this.searchService.searchHotels({
      q: query.q,
      city: query.city,
      date: query.date,
      slotType: query.slotType,
      guests: query.guests,
    });
  }

  @Get('availability')
  availability(@Query() query: AvailabilityQueryDto) {
    return this.searchService.checkAvailability(
      query.hotelId,
      query.date,
      query.slotType,
    );
  }
}
