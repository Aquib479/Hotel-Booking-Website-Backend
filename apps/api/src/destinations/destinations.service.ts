import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destination } from './destination.entity';
import { DestinationSourceCode } from './destination-source-code.entity';
import { Nationality } from './nationality.entity';

export type DestinationAutocompleteItem = {
  id: string;
  cityName: string;
  countryName: string;
  label: string;
};

export type ResolvedDestinationCodes = {
  destinationId: string;
  source: string;
  countryCode: string;
  cityCode: string;
  cityName: string;
  countryName: string;
};

@Injectable()
export class DestinationsService {
  constructor(
    @InjectRepository(Destination)
    private readonly destinations: Repository<Destination>,
    @InjectRepository(DestinationSourceCode)
    private readonly sourceCodes: Repository<DestinationSourceCode>,
    @InjectRepository(Nationality)
    private readonly nationalities: Repository<Nationality>,
  ) {}

  async autocomplete(
    q: string,
    limit = 20,
  ): Promise<DestinationAutocompleteItem[]> {
    const query = (q ?? '').trim();
    if (query.length < 2) {
      return [];
    }

    const take = Math.min(Math.max(limit, 1), 50);
    const pattern = `%${query.toLowerCase()}%`;

    const rows = await this.destinations
      .createQueryBuilder('d')
      .where('d.is_active = true')
      .andWhere(
        '(d.search_text ILIKE :pattern OR d.city_name ILIKE :pattern OR d.country_name ILIKE :pattern)',
        { pattern },
      )
      .orderBy('d.city_name', 'ASC')
      .addOrderBy('d.country_name', 'ASC')
      .take(take)
      .getMany();

    return rows.map((d) => ({
      id: d.id,
      cityName: d.cityName,
      countryName: d.countryName,
      label: `${d.cityName}, ${d.countryName}`,
    }));
  }

  async listNationalities(): Promise<Array<{ code: string; name: string }>> {
    const rows = await this.nationalities.find({
      order: { name: 'ASC' },
    });
    return rows.map((n) => ({ code: n.code, name: n.name }));
  }

  async resolveCodes(
    destinationId: string,
    source: string,
  ): Promise<ResolvedDestinationCodes> {
    if (!destinationId) {
      throw new BadRequestException('destinationId is required');
    }

    const destination = await this.destinations.findOne({
      where: { id: destinationId, isActive: true },
    });
    if (!destination) {
      throw new NotFoundException(`Destination not found: ${destinationId}`);
    }

    const code = await this.sourceCodes.findOne({
      where: { destinationId, source },
    });
    if (!code) {
      throw new BadRequestException(
        `No ${source} codes mapped for destination ${destinationId}`,
      );
    }

    return {
      destinationId,
      source,
      countryCode: code.countryCode,
      cityCode: code.cityCode,
      cityName: destination.cityName,
      countryName: destination.countryName,
    };
  }
}
