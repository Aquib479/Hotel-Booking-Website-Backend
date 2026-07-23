import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

export interface SnapTokenResult {
  token: string;
  redirectUrl: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly serverKey: string;
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    this.serverKey = config.get<string>('MIDTRANS_SERVER_KEY', '');
    const isProd = config.get<string>('MIDTRANS_IS_PRODUCTION') === 'true';
    this.baseUrl = isProd
      ? 'https://app.midtrans.com'
      : 'https://app.sandbox.midtrans.com';
  }

  async createSnapToken(params: {
    orderId: string;
    amount: number;
    guestName: string;
    guestPhone: string;
    description: string;
  }): Promise<SnapTokenResult> {
    const auth = Buffer.from(`${this.serverKey}:`).toString('base64');

    const { data } = await axios.post(
      `${this.baseUrl}/snap/v1/transactions`,
      {
        transaction_details: {
          order_id: params.orderId,
          gross_amount: params.amount,
        },
        customer_details: {
          first_name: params.guestName,
          phone: params.guestPhone,
        },
        item_details: [
          {
            id: params.orderId,
            price: params.amount,
            quantity: 1,
            name: params.description,
          },
        ],
      },
      { headers: { Authorization: `Basic ${auth}` } },
    );

    return { token: data.token, redirectUrl: data.redirect_url };
  }

  verifySignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string,
  ): boolean {
    const hash = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${this.serverKey}`)
      .digest('hex');
    return hash === signatureKey;
  }
}
