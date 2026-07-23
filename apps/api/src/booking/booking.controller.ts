import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BookingService } from './booking.service';
import { HoldBookingDto } from './dto/hold-booking.dto';

@Controller('bookings')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Post('hold')
  @UseGuards(JwtAuthGuard)
  hold(@Body() body: HoldBookingDto, @Request() req: any) {
    return this.bookingService.createHold(req.user.id, {
      roomId: body.roomId,
      date: body.date,
      slotType: body.slotType,
      numGuests: body.numGuests ?? 1,
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  myBookings(@Request() req: any) {
    return this.bookingService.listMyBookings(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.bookingService.getById(id, req.user.id);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  confirm(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.bookingService.confirmHold(id, req.user.id);
  }

  @Post(':id/release')
  @UseGuards(JwtAuthGuard)
  release(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.bookingService.releaseHold(id, req.user.id);
  }
}
