import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import {
  BookHotelDto,
  CancelReservationDto,
  HotelDetailDto,
  RecheckHotelDto,
  ReservationDetailsDto,
  ReservationListDto,
  SearchHotelDto,
} from './dto/bedbank.dto';

/**
 * Thin BFF over wholesale bedbank suppliers.
 * Request bodies are forwarded as-is (Login injected server-side).
 * Query `source` selects the adapter (default: mg).
 */
@ApiTags('Bedbank')
@Controller('bedbank')
export class BedbankController {
  constructor(private readonly suppliers: SupplierService) {}

  @Post('search')
  @ApiOperation({
    summary: 'Search hotels',
    description:
      'Proxies MG SearchHotel. Creates a sessionID (valid ~20 min) used by recheck/book. Do not send Login — injected server-side.',
  })
  @ApiQuery({ name: 'source', required: false, example: 'mg' })
  @ApiBody({ type: SearchHotelDto })
  @ApiOkResponse({ description: 'Supplier search response (pass-through)' })
  search(
    @Body() body: Record<string, unknown>,
    @Query('source') source?: string,
  ) {
    return this.suppliers.resolve(source).searchHotels(body);
  }

  @Post('recheck')
  @ApiOperation({
    summary: 'Recheck rate before booking',
    description:
      'Proxies MG RecheckHotel. Requires SessionID and RateKey from search.',
  })
  @ApiQuery({ name: 'source', required: false, example: 'mg' })
  @ApiBody({ type: RecheckHotelDto })
  @ApiOkResponse({ description: 'Supplier recheck response (pass-through)' })
  recheck(
    @Body() body: Record<string, unknown>,
    @Query('source') source?: string,
  ) {
    return this.suppliers.resolve(source).recheckHotel(body);
  }

  @Post('book')
  @ApiOperation({
    summary: 'Book hotel',
    description:
      'Proxies MG BookHotel. AgencyBookingID max 15 chars. Use RateKey from recheck when available.',
  })
  @ApiQuery({ name: 'source', required: false, example: 'mg' })
  @ApiBody({ type: BookHotelDto })
  @ApiOkResponse({ description: 'Supplier book response (pass-through)' })
  book(
    @Body() body: Record<string, unknown>,
    @Query('source') source?: string,
  ) {
    return this.suppliers.resolve(source).bookHotel(body);
  }

  @Post('reservation/details')
  @ApiOperation({
    summary: 'Get reservation details',
    description:
      'Proxies MG GetRSVNDetails. Provide either MGBookingID or AgencyBookingID.',
  })
  @ApiQuery({ name: 'source', required: false, example: 'mg' })
  @ApiBody({ type: ReservationDetailsDto })
  @ApiOkResponse({ description: 'Supplier reservation details (pass-through)' })
  reservationDetails(
    @Body() body: Record<string, unknown>,
    @Query('source') source?: string,
  ) {
    return this.suppliers.resolve(source).getReservationDetails(body);
  }

  @Post('reservation/list')
  @ApiOperation({
    summary: 'List reservations',
    description:
      'Proxies MG GetRSVNList. DateType 1 = booking date, 2 = check-in date.',
  })
  @ApiQuery({ name: 'source', required: false, example: 'mg' })
  @ApiBody({ type: ReservationListDto })
  @ApiOkResponse({ description: 'Supplier reservation list (pass-through)' })
  reservationList(
    @Body() body: Record<string, unknown>,
    @Query('source') source?: string,
  ) {
    return this.suppliers.resolve(source).getReservationList(body);
  }

  @Post('reservation/cancel')
  @ApiOperation({
    summary: 'Cancel reservation',
    description: 'Proxies MG CancelReservation by MGBookingID.',
  })
  @ApiQuery({ name: 'source', required: false, example: 'mg' })
  @ApiBody({ type: CancelReservationDto })
  @ApiOkResponse({ description: 'Supplier cancel response (pass-through)' })
  reservationCancel(
    @Body() body: Record<string, unknown>,
    @Query('source') source?: string,
  ) {
    return this.suppliers.resolve(source).cancelReservation(body);
  }

  @Post('hotel/detail')
  @ApiOperation({
    summary: 'Get hotel detail / content',
    description:
      'Proxies MG GetHotelDetail (photos, facilities, room content).',
  })
  @ApiQuery({ name: 'source', required: false, example: 'mg' })
  @ApiBody({ type: HotelDetailDto })
  @ApiOkResponse({ description: 'Supplier hotel detail (pass-through)' })
  hotelDetail(
    @Body() body: Record<string, unknown>,
    @Query('source') source?: string,
  ) {
    return this.suppliers.resolve(source).getHotelDetail(body);
  }

  @Get('destinations')
  @ApiOperation({
    summary: 'Get destinations',
    description: 'Proxies MG GetDestinations (continents → countries → cities).',
  })
  @ApiQuery({ name: 'source', required: false, example: 'mg' })
  @ApiOkResponse({ description: 'Supplier destinations (pass-through)' })
  destinations(@Query('source') source?: string) {
    return this.suppliers.resolve(source).getDestinations();
  }

  @Get('nationalities')
  @ApiOperation({
    summary: 'Get nationalities',
    description: 'Proxies MG GetNationalities.',
  })
  @ApiQuery({ name: 'source', required: false, example: 'mg' })
  @ApiOkResponse({ description: 'Supplier nationalities (pass-through)' })
  nationalities(@Query('source') source?: string) {
    return this.suppliers.resolve(source).getNationalities();
  }

  @Get('meal-plans')
  @ApiOperation({
    summary: 'Get meal plans',
    description: 'Proxies MG GetMealPlans (e.g. RO, BDBF, HB, FB, AI).',
  })
  @ApiQuery({ name: 'source', required: false, example: 'mg' })
  @ApiOkResponse({ description: 'Supplier meal plans (pass-through)' })
  mealPlans(@Query('source') source?: string) {
    return this.suppliers.resolve(source).getMealPlans();
  }
}
