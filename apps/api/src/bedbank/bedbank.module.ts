import { Module } from '@nestjs/common';
import { BedbankController } from './bedbank.controller';
import { SupplierService } from './supplier.service';
import { MgBedbankConfig } from './adapters/mg/mg-bedbank.config';
import { MgBedbankClient } from './adapters/mg/mg-bedbank.client';
import { MgBedbankAdapter } from './adapters/mg/mg-bedbank.adapter';

@Module({
  providers: [
    MgBedbankConfig,
    MgBedbankClient,
    MgBedbankAdapter,
    SupplierService,
  ],
  controllers: [BedbankController],
  exports: [SupplierService],
})
export class BedbankModule {}
