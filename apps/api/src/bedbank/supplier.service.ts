import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupplierAdapter } from './supplier.interface';
import { MgBedbankAdapter } from './adapters/mg/mg-bedbank.adapter';

/**
 * Picks the active bedbank supplier server-side.
 * Frontend never sends a source — switch via BEDBANK_DEFAULT_SOURCE (or later multi-supplier logic).
 */
@Injectable()
export class SupplierService {
  private readonly adapters = new Map<string, SupplierAdapter>();
  private readonly defaultSource: string;

  constructor(mg: MgBedbankAdapter, config: ConfigService) {
    this.adapters.set('mg', mg);
    this.defaultSource = config.get<string>('BEDBANK_DEFAULT_SOURCE', 'mg');
  }

  /** Active supplier for all public bedbank routes. */
  active(): SupplierAdapter {
    return this.resolve(this.defaultSource);
  }

  resolve(source: string): SupplierAdapter {
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
