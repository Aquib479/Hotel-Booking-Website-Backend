import { BadRequestException, Injectable } from '@nestjs/common';
import { SupplierAdapter } from './supplier.interface';
import { MgBedbankAdapter } from './adapters/mg/mg-bedbank.adapter';

/**
 * Resolves the active supplier adapter by source key.
 * Future: register TboAdapter as 'tbo', add searchAll() for price comparison.
 */
@Injectable()
export class SupplierService {
  private readonly adapters = new Map<string, SupplierAdapter>();

  constructor(mg: MgBedbankAdapter) {
    this.adapters.set('mg', mg);
  }

  resolve(source: string = 'mg'): SupplierAdapter {
    const adapter = this.adapters.get(source);
    if (!adapter) {
      throw new BadRequestException(`Unknown supplier: ${source}`);
    }
    return adapter;
  }

  listSources(): string[] {
    return [...this.adapters.keys()];
  }
}
