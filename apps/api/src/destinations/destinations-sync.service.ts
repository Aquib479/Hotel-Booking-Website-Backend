import {
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, In, Repository } from 'typeorm';
import { SupplierService } from '../bedbank/supplier.service';
import { Destination } from './destination.entity';
import { DestinationSourceCode } from './destination-source-code.entity';
import { Nationality } from './nationality.entity';

type MgNamed = { code?: string; name?: string };
type MgCity = MgNamed;
type MgCountry = MgNamed & {
  cities?: { city?: MgCity | MgCity[] };
};
type MgContinent = MgNamed & {
  countries?: { country?: MgCountry | MgCountry[] };
};

export type DestinationsSyncResult = {
  source: string;
  continents: number;
  countries: number;
  citiesUpserted: number;
  nationalitiesUpserted: number;
};

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeSearchText(cityName: string, countryName: string): string {
  return `${cityName} ${countryName}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

@Injectable()
export class DestinationsSyncService {
  private readonly logger = new Logger(DestinationsSyncService.name);
  private static readonly CHUNK = 500;
  private static readonly SOURCE = 'mg';

  constructor(
    @InjectRepository(DestinationSourceCode)
    private readonly sourceCodes: Repository<DestinationSourceCode>,
    @InjectRepository(Nationality)
    private readonly nationalities: Repository<Nationality>,
    private readonly suppliers: SupplierService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  private checkAdminEnabled() {
    if (this.config.get('ADMIN_SEED_ENABLED') !== 'true') {
      throw new ForbiddenException('Admin endpoints are disabled');
    }
  }

  async syncFromMg(): Promise<DestinationsSyncResult> {
    this.checkAdminEnabled();

    const adapter = this.suppliers.resolve(DestinationsSyncService.SOURCE);
    const [destPayload, natPayload] = await Promise.all([
      adapter.getDestinations(),
      adapter.getNationalities(),
    ]);

    const continents = asArray(
      destPayload?.continents?.continent as MgContinent | MgContinent[],
    );

    type FlatCity = {
      continentCode: string | null;
      continentName: string | null;
      countryCode: string;
      countryName: string;
      cityCode: string;
      cityName: string;
    };

    const flat: FlatCity[] = [];
    let countryCount = 0;

    for (const continent of continents) {
      const countries = asArray(continent.countries?.country);
      countryCount += countries.length;
      for (const country of countries) {
        if (!country?.code || !country?.name) continue;
        const cities = asArray(country.cities?.city);
        for (const city of cities) {
          if (!city?.code || !city?.name) continue;
          flat.push({
            continentCode: continent.code ?? null,
            continentName: continent.name ?? null,
            countryCode: country.code,
            countryName: country.name,
            cityCode: city.code,
            cityName: city.name,
          });
        }
      }
    }

    this.logger.log(
      `MG destinations flattened: ${continents.length} continents, ${countryCount} countries, ${flat.length} cities`,
    );

    const citiesUpserted = await this.upsertCities(flat);
    const nationalitiesUpserted = await this.upsertNationalities(natPayload);

    return {
      source: DestinationsSyncService.SOURCE,
      continents: continents.length,
      countries: countryCount,
      citiesUpserted,
      nationalitiesUpserted,
    };
  }

  private async upsertCities(
    flat: Array<{
      continentCode: string | null;
      continentName: string | null;
      countryCode: string;
      countryName: string;
      cityCode: string;
      cityName: string;
    }>,
  ): Promise<number> {
    if (flat.length === 0) return 0;

    const existing = await this.sourceCodes.find({
      where: { source: DestinationsSyncService.SOURCE },
      select: { id: true, destinationId: true, cityCode: true },
    });
    const byCityCode = new Map(
      existing.map((row) => [row.cityCode, row] as const),
    );

    const syncedAt = new Date();
    let upserted = 0;

    for (let i = 0; i < flat.length; i += DestinationsSyncService.CHUNK) {
      const chunk = flat.slice(i, i + DestinationsSyncService.CHUNK);

      await this.dataSource.transaction(async (manager) => {
        const destRepo = manager.getRepository(Destination);
        const codeRepo = manager.getRepository(DestinationSourceCode);

        const toInsertDest: Destination[] = [];
        const toInsertCodes: Array<{
          destinationId?: string;
          pendingDestIndex?: number;
          cityCode: string;
          countryCode: string;
          rawName: string;
        }> = [];
        const toUpdate: Array<{
          destinationId: string;
          codeId: string;
          cityName: string;
          countryName: string;
          countryIso: string;
          continentCode: string | null;
          continentName: string | null;
          searchText: string;
          rawName: string;
        }> = [];

        for (const row of chunk) {
          const searchText = normalizeSearchText(row.cityName, row.countryName);
          const existingCode = byCityCode.get(row.cityCode);

          if (existingCode) {
            toUpdate.push({
              destinationId: existingCode.destinationId,
              codeId: existingCode.id,
              cityName: row.cityName,
              countryName: row.countryName,
              countryIso: row.countryCode,
              continentCode: row.continentCode,
              continentName: row.continentName,
              searchText,
              rawName: row.cityName,
            });
          } else {
            const pendingDestIndex = toInsertDest.length;
            toInsertDest.push(
              destRepo.create({
                cityName: row.cityName,
                countryName: row.countryName,
                countryIso: row.countryCode,
                continentCode: row.continentCode,
                continentName: row.continentName,
                searchText,
                isActive: true,
              }),
            );
            toInsertCodes.push({
              pendingDestIndex,
              cityCode: row.cityCode,
              countryCode: row.countryCode,
              rawName: row.cityName,
            });
          }
        }

        if (toInsertDest.length > 0) {
          const savedDests = await destRepo.save(toInsertDest);
          const codeEntities = toInsertCodes.map((c) =>
            codeRepo.create({
              destinationId: savedDests[c.pendingDestIndex!].id,
              source: DestinationsSyncService.SOURCE,
              countryCode: c.countryCode,
              cityCode: c.cityCode,
              rawName: c.rawName,
              syncedAt,
            }),
          );
          const savedCodes = await codeRepo.save(codeEntities);
          for (const code of savedCodes) {
            byCityCode.set(code.cityCode, {
              id: code.id,
              destinationId: code.destinationId,
              cityCode: code.cityCode,
            } as DestinationSourceCode);
          }
        }

        if (toUpdate.length > 0) {
          const destIds = [...new Set(toUpdate.map((u) => u.destinationId))];
          const dests = await destRepo.findBy({ id: In(destIds) });
          const destMap = new Map(dests.map((d) => [d.id, d]));

          for (const u of toUpdate) {
            const dest = destMap.get(u.destinationId);
            if (dest) {
              dest.cityName = u.cityName;
              dest.countryName = u.countryName;
              dest.countryIso = u.countryIso;
              dest.continentCode = u.continentCode;
              dest.continentName = u.continentName;
              dest.searchText = u.searchText;
              dest.isActive = true;
            }
          }
          await destRepo.save([...destMap.values()]);

          const codeIds = toUpdate.map((u) => u.codeId);
          const codes = await codeRepo.findBy({ id: In(codeIds) });
          const codeMap = new Map(codes.map((c) => [c.id, c]));
          for (const u of toUpdate) {
            const code = codeMap.get(u.codeId);
            if (code) {
              const flatRow = chunk.find((c) => c.cityCode === code.cityCode);
              if (flatRow) {
                code.countryCode = flatRow.countryCode;
              }
              code.rawName = u.rawName;
              code.syncedAt = syncedAt;
            }
          }
          await codeRepo.save([...codeMap.values()]);
        }
      });

      upserted += chunk.length;
      this.logger.log(
        `Destinations sync progress: ${Math.min(i + chunk.length, flat.length)}/${flat.length}`,
      );
    }

    return upserted;
  }

  private async upsertNationalities(natPayload: any): Promise<number> {
    const list = asArray(
      natPayload?.nationalityTypes?.nationalityType as
        | MgNamed
        | MgNamed[],
    ).filter((n) => n?.code && n?.name);

    if (list.length === 0) return 0;

    const syncedAt = new Date();
    let count = 0;

    for (let i = 0; i < list.length; i += DestinationsSyncService.CHUNK) {
      const chunk = list.slice(i, i + DestinationsSyncService.CHUNK);
      const codes = chunk.map((n) => n.code!);
      const existing = await this.nationalities.findBy({ code: In(codes) });
      const existingMap = new Map(existing.map((n) => [n.code, n]));

      const toSave = chunk.map((n) => {
        const row = existingMap.get(n.code!) ?? this.nationalities.create({
          code: n.code!,
        });
        row.name = n.name!;
        row.source = DestinationsSyncService.SOURCE;
        row.syncedAt = syncedAt;
        return row;
      });

      await this.nationalities.save(toSave);
      count += toSave.length;
    }

    return count;
  }
}
