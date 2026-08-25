/**
 * Supplier-agnostic contract for bedbank / wholesale hotel inventory.
 *
 * Today: MgBedbankAdapter.
 * Tomorrow: TboAdapter (etc.) — implement this interface, register in SupplierService.
 *
 * Params/returns are `any` for now (pass-through). Normalize to shared DTOs later.
 */
export interface SupplierAdapter {
  searchHotels(params: any): Promise<any>;
  recheckHotel(params: any): Promise<any>;
  bookHotel(params: any): Promise<any>;
  getReservationDetails(params: any): Promise<any>;
  getReservationList(params: any): Promise<any>;
  cancelReservation(params: any): Promise<any>;
  getHotelDetail(params: any): Promise<any>;
  getDestinations(): Promise<any>;
  getNationalities(): Promise<any>;
  getMealPlans(): Promise<any>;
}
