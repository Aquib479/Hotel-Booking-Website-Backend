import { Controller, Post, Body, BadRequestException, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { BookingService } from '../booking/booking.service';

@Controller('bookings')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private payment: PaymentService,
    private booking: BookingService,
  ) {}

  @Post('payment-callback')
  async handleWebhook(@Body() body: any) {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    const valid = this.payment.verifySignature(
      order_id,
      status_code,
      gross_amount,
      signature_key,
    );
    if (!valid) {
      throw new BadRequestException('Invalid signature');
    }

    const isPaid =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    const isFailed = ['deny', 'cancel', 'expire', 'failure'].includes(
      transaction_status,
    );

    if (isPaid) {
      await this.booking.onPaymentSuccess(order_id);
    } else if (isFailed) {
      await this.booking.onPaymentFailed(order_id);
    }

    this.logger.log(`Webhook ${order_id}: ${transaction_status}`);
    return { status: 'ok' };
  }
}
