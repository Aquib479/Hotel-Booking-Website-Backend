import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class S3Service {
  private readonly client: S3Client | null;
  private readonly bucket: string | undefined;
  private readonly publicBaseUrl: string | undefined;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get<string>('S3_MEDIA_BUCKET') || undefined;
    const region =
      this.config.get<string>('S3_MEDIA_REGION') || 'ap-southeast-1';
    this.publicBaseUrl =
      this.config.get<string>('S3_PUBLIC_BASE_URL')?.replace(/\/$/, '') ||
      (this.bucket
        ? `https://${this.bucket}.s3.${region}.amazonaws.com`
        : undefined);

    this.client = this.bucket
      ? new S3Client({ region })
      : null;
  }

  private ensureConfigured() {
    if (!this.client || !this.bucket || !this.publicBaseUrl) {
      throw new ServiceUnavailableException(
        'S3 media storage is not configured (S3_MEDIA_BUCKET)',
      );
    }
  }

  private validateFile(file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('Image must be 5MB or smaller');
    }
  }

  private async upload(keyPrefix: string, file: Express.Multer.File): Promise<string> {
    this.ensureConfigured();
    this.validateFile(file);

    const ext =
      EXT_BY_MIME[file.mimetype] ||
      extname(file.originalname).toLowerCase() ||
      '.jpg';
    const key = `${keyPrefix}/${randomUUID()}${ext}`;

    await this.client!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000',
      }),
    );

    return `${this.publicBaseUrl}/${key}`;
  }

  async uploadHotelImage(hotelId: string, file: Express.Multer.File): Promise<string> {
    return this.upload(`hotels/${hotelId}`, file);
  }

  async uploadRoomImage(hotelId: string, roomId: string, file: Express.Multer.File): Promise<string> {
    return this.upload(`hotels/${hotelId}/rooms/${roomId}`, file);
  }
}
