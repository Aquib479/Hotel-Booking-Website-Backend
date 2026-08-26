import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
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
 * Bedbank BFF. Supplier is chosen server-side — clients never send a source.
 * Login / credentials injected server-side.
 */
@ApiTags('Bedbank')
@Controller('bedbank')
export class BedbankController {
  constructor(private readonly suppliers: SupplierService) {}

  @Post('search')
  @ApiOperation({
    summary: 'Search hotels',
    description:
      'City or hotel-code availability search. Returns a sessionID (valid ~20 min) for recheck/book. Do not send Login.',
  })
  @ApiBody({ type: SearchHotelDto })
  @ApiOkResponse({ description: 'Search response (pass-through)' })
  search(@Body() body: Record<string, unknown>) {
    return this.suppliers.active().searchHotels(body);
  }

  @Post('recheck')
  @ApiOperation({
    summary: 'Recheck rate before booking',
    description: 'Requires SessionID and RateKey from search.',
  })
  @ApiBody({ type: RecheckHotelDto })
  @ApiOkResponse({ description: 'Recheck response (pass-through)' })
  recheck(@Body() body: Record<string, unknown>) {
    return this.suppliers.active().recheckHotel(body);
  }

  @Post('book')
  @ApiOperation({
    summary: 'Book hotel',
    description:
      'AgencyBookingID max 15 chars. Prefer RateKey from the latest recheck.',
  })
  @ApiBody({ type: BookHotelDto })
  @ApiOkResponse({ description: 'Book response (pass-through)' })
  book(@Body() body: Record<string, unknown>) {
    return this.suppliers.active().bookHotel(body);
  }

  @Post('reservation/details')
  @ApiOperation({
    summary: 'Get reservation details',
    description: 'Provide either MGBookingID or AgencyBookingID.',
  })
  @ApiBody({ type: ReservationDetailsDto })
  @ApiOkResponse({ description: 'Reservation details (pass-through)' })
  reservationDetails(@Body() body: Record<string, unknown>) {
    return this.suppliers.active().getReservationDetails(body);
  }

  @Post('reservation/list')
  @ApiOperation({
    summary: 'List reservations',
    description: 'DateType 1 = booking date, 2 = check-in date.',
  })
  @ApiBody({ type: ReservationListDto })
  @ApiOkResponse({ description: 'Reservation list (pass-through)' })
  reservationList(@Body() body: Record<string, unknown>) {
    return this.suppliers.active().getReservationList(body);
  }

  @Post('reservation/cancel')
  @ApiOperation({
    summary: 'Cancel reservation',
    description: 'Cancel by MGBookingID.',
  })
  @ApiBody({ type: CancelReservationDto })
  @ApiOkResponse({ description: 'Cancel response (pass-through)' })
  reservationCancel(@Body() body: Record<string, unknown>) {
    return this.suppliers.active().cancelReservation(body);
  }

  @Post('hotel/detail')
  @ApiOperation({
    summary: 'Get hotel detail / content',
    description: 'Photos, facilities, and room content for a hotel code.',
  })
  @ApiBody({ type: HotelDetailDto })
  @ApiOkResponse({ description: 'Hotel detail (pass-through)' })
  hotelDetail(@Body() body: Record<string, unknown>) {
    return this.suppliers.active().getHotelDetail(body);
  }

  @Get('destinations')
  @ApiOperation({
    summary: 'Get destinations',
    description: 'Continents → countries → cities (city codes for search).',
  })
  @ApiOkResponse({ description: 'Destinations (pass-through)' })
  destinations() {
    return this.suppliers.active().getDestinations();
  }

  @Get('nationalities')
  @ApiOperation({
    summary: 'Get nationalities',
    description: 'Nationality codes for search/book.',
  })
  @ApiOkResponse({ description: 'Nationalities (pass-through)' })
  nationalities() {
    return this.suppliers.active().getNationalities();
  }

  @Get('meal-plans')
  @ApiOperation({
    summary: 'Get meal plans',
    description: 'Meal plan codes (e.g. RO, BDBF, HB, FB, AI).',
  })
  @ApiOkResponse({ description: 'Meal plans (pass-through)' })
  mealPlans() {
    return this.suppliers.active().getMealPlans();
  }
}
