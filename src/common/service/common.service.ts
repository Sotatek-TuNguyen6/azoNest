import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OriginWeb } from 'src/types/enum';

@Injectable()
export class CommonService {
  constructor(private readonly configService: ConfigService) {}
  getUrlByOrigin(origin: OriginWeb): string {
    let url: string;

    switch (origin) {
      case OriginWeb.AZO:
        url = this.configService.get<string>('AZO_URL');
        break;

      case OriginWeb.DG1:
        url = this.configService.get<string>('DG1_URL');
        break;

      default:
        throw new Error('Unsupported origin');
    }

    if (!url) {
      throw new Error(
        `URL for origin ${origin} not found in environment variables`,
      );
    }

    return url;
  }
}
