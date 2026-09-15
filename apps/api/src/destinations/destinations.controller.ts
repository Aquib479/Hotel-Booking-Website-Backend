import { Controller, Get, Post, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DestinationsService } from './destinations.service';
import { DestinationsSyncService } from './destinations-sync.service';

@ApiTags('Destinations')
@Controller()
export class DestinationsController {
  constructor(
    private readonly destinations: DestinationsService,
    private readonly sync: DestinationsSyncService,
  ) {}

  @Get('destinations/autocomplete')
  @ApiOperation({
    summary: 'Autocomplete destinations',
    description:
      'Search local destination master by city/country name. Returns destinationId for bedbank search.',
  })
  @ApiQuery({ name: 'q', required: true, example: 'Jakarta' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({ description: 'Matching destinations' })
  autocomplete(
    @Query('q') q: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.destinations.autocomplete(q, limit);
  }

  @Get('nationalities')
  @ApiOperation({
    summary: 'List nationalities',
    description: 'Local nationality master (synced from supplier).',
  })
  @ApiOkResponse({ description: 'Nationality list' })
  nationalities() {
    return this.destinations.listNationalities();
  }

  @Post('admin/destinations/sync')
  @ApiOperation({
    summary: 'Sync destinations and nationalities from MG',
    description:
      'Requires ADMIN_SEED_ENABLED=true. Pulls GetDestinations + GetNationalities into local tables.',
  })
  @ApiOkResponse({ description: 'Sync counts' })
  syncFromMg() {
    return this.sync.syncFromMg();
  }
}
