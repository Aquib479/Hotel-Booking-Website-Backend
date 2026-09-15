import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BedbankModule } from '../bedbank/bedbank.module';
import { Destination } from './destination.entity';
import { DestinationSourceCode } from './destination-source-code.entity';
import { Nationality } from './nationality.entity';
import { DestinationsService } from './destinations.service';
import { DestinationsSyncService } from './destinations-sync.service';
import { DestinationsController } from './destinations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Destination,
      DestinationSourceCode,
      Nationality,
    ]),
    BedbankModule,
  ],
  controllers: [DestinationsController],
  providers: [DestinationsService, DestinationsSyncService],
  exports: [DestinationsService],
})
export class DestinationsModule {}
