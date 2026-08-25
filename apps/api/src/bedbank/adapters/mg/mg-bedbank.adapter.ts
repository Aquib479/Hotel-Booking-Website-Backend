import { Injectable } from '@nestjs/common';
import { SupplierAdapter } from '../../supplier.interface';
import { MgBedbankClient } from './mg-bedbank.client';

/**
 * Thin pass-through to MgBedbankClient.
 * Pre/post-processing (markup, normalization, caching) belongs here later.
 */
@Injectable()
export class MgBedbankAdapter implements SupplierAdapter {
  constructor(private readonly client: MgBedbankClient) {}

  searchHotels(params: any): Promise<any> {
    return this.client.searchHotel(params);
  }

  recheckHotel(params: any): Promise<any> {
    return this.client.recheckHotel(params);
  }

  bookHotel(params: any): Promise<any> {
    return this.client.bookHotel(params);
  }

  getReservationDetails(params: any): Promise<any> {
    return this.client.getReservationDetails(params);
  }

  getReservationList(params: any): Promise<any> {
    return this.client.getReservationList(params);
  }

  cancelReservation(params: any): Promise<any> {
    return this.client.cancelReservation(params);
  }

  getHotelDetail(params: any): Promise<any> {
    return this.client.getHotelDetail(params);
  }

  getDestinations(): Promise<any> {
    return this.client.getDestinations();
  }

  getNationalities(): Promise<any> {
    return this.client.getNationalities();
  }

  getMealPlans(): Promise<any> {
    return this.client.getMealPlans();
  }
}
