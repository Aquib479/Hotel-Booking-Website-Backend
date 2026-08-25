import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { MgBedbankConfig } from './mg-bedbank.config';

@Injectable()
export class MgBedbankClient {
  private readonly logger = new Logger(MgBedbankClient.name);

  constructor(private readonly config: MgBedbankConfig) {}

  async searchHotel(body: Record<string, unknown>): Promise<any> {
    return this.post('/1.0/Hotel/SearchHotel', body);
  }

  async recheckHotel(body: Record<string, unknown>): Promise<any> {
    return this.post('/1.0/Hotel/RecheckHotel', body);
  }

  async bookHotel(body: Record<string, unknown>): Promise<any> {
    return this.post('/1.0/Hotel/BookHotel', body);
  }

  async getReservationDetails(body: Record<string, unknown>): Promise<any> {
    return this.post('/1.0/hotel/GetRSVNDetails', body);
  }

  async getReservationList(body: Record<string, unknown>): Promise<any> {
    return this.post('/1.0/hotel/GetRSVNList', body);
  }

  async cancelReservation(body: Record<string, unknown>): Promise<any> {
    return this.post('/1.0/Hotel/CancelReservation', body);
  }

  async getHotelDetail(body: Record<string, unknown>): Promise<any> {
    return this.post('/1.0/Hotel/GetHotelDetail', body);
  }

  async getDestinations(): Promise<any> {
    return this.post('/1.0/hotel/GetDestinations', {});
  }

  async getNationalities(): Promise<any> {
    return this.post('/1.0/hotel/GetNationalities', {});
  }

  async getMealPlans(): Promise<any> {
    return this.post('/1.0/hotel/GetMealPlans', {});
  }

  /**
   * Inject Login credentials and POST to MG. Returns MG response body as-is.
   * Path casing must match MG exactly (/Hotel/ vs /hotel/).
   */
  private async post(
    path: string,
    body: Record<string, unknown>,
  ): Promise<any> {
    if (!this.config.agencyCode || !this.config.username || !this.config.password) {
      throw new ServiceUnavailableException(
        'MG Bedbank credentials are not configured',
      );
    }

    const payload = {
      ...body,
      Login: this.config.login,
    };

    const url = `${this.config.baseUrl}${path}`;

    try {
      const { data } = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 60_000,
      });

      if (data && data.status === false) {
        this.logger.warn(
          `MG ${path} failed: ${data.errorCode} ${data.errorMessage}`,
        );
        throw new BadGatewayException({
          message: data.errorMessage ?? 'MG Bedbank request failed',
          errorCode: data.errorCode,
          supplier: 'mg',
        });
      }

      return data;
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;

      const axiosErr = err as AxiosError;
      this.logger.error(
        `MG ${path} HTTP error: ${axiosErr.message}`,
        axiosErr.response?.data
          ? JSON.stringify(axiosErr.response.data)
          : undefined,
      );
      throw new BadGatewayException({
        message: 'Failed to reach MG Bedbank',
        supplier: 'mg',
        detail: axiosErr.message,
      });
    }
  }
}
