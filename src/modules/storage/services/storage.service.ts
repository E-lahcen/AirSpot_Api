import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly logger = new Logger(StorageService.name);
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>(
      'MINIO_BUCKET_NAME',
      'airspot-videos',
    );

    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      // port: parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10),
      useSSL:
        this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>(
        'MINIO_ACCESS_KEY',
        'minioadmin',
      ),
      secretKey: this.configService.get<string>(
        'MINIO_SECRET_KEY',
        'minioadmin',
      ),
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1'); // Region is required but often ignored by MinIO
        this.logger.log(`Bucket '${this.bucketName}' created successfully.`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error ensuring bucket exists: ${err.message}`,
        err.stack,
      );
    }
  }

  async uploadFile(
    filename: string,
    fileBuffer: Buffer | Readable,
    size: number,
    contentType: string,
  ): Promise<string> {
    try {
      await this.minioClient.putObject(
        this.bucketName,
        filename,
        fileBuffer,
        size,
        { 'Content-Type': contentType },
      );

      // Return the URL. If it's localhost, it might not be reachable from outside if running in docker.
      // But usually we return the public URL.
      // For now, let's construct a URL based on the endpoint.
      const protocol =
        this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true'
          ? 'https'
          : 'http';
      const endpoint = this.configService.get<string>(
        'MINIO_ENDPOINT',
        'localhost',
      );
      // If there is a public URL configured, use it. Otherwise construct it.
      const publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL');
      if (publicUrl) {
        return `${publicUrl}/${this.bucketName}/${filename}`;
      }

      return `${protocol}://${endpoint}/${this.bucketName}/${filename}`;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error uploading file to MinIO: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  getFileUrl(filename: string): string {
    // Presigned URL could be an option, but for public read buckets, direct URL is fine.
    // Let's assume public read for now or just return the direct URL.
    const protocol =
      this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true'
        ? 'https'
        : 'http';
    const endpoint = this.configService.get<string>(
      'MINIO_ENDPOINT',
      'localhost',
    );

    const publicUrl = this.configService.get<string>('MINIO_PUBLIC_URL');
    if (publicUrl) {
      return `${publicUrl}/${this.bucketName}/${filename}`;
    }

    return `${protocol}://${endpoint}/${this.bucketName}/${filename}`;
  }
}
