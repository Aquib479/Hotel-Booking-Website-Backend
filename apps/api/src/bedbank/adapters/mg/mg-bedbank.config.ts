import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MgBedbankConfig {
  readonly baseUrl: string;
  readonly agencyCode: string;
  readonly username: string;
  readonly password: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>(
      'MG_BEDBANK_BASE_URL',
      'https://uat-jarvis1-xmlsell.mgbedbank.com',
    );
    this.agencyCode = config.get<string>('MG_AGENCY_CODE', '');
    this.username = config.get<string>('MG_USERNAME', '');
    this.password = config.get<string>('MG_PASSWORD', '');
  }

  get login() {
    return {
      AgencyCode: this.agencyCode,
      Username: this.username,
      Password: this.password,
    };
  }
}
