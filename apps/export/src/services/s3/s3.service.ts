import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Lean S3 (DigitalOcean Spaces) helper for the export app's data-export
 * pipeline. Uploads a single generated report to the DOWNLOAD bucket and mints
 * short-TTL presigned GET URLs on demand — mirroring downloadapi's approach so
 * generated files never carry a long-lived link (see docs/outputs-feature-plan.md).
 */
@Injectable()
export class ExportS3Service {
  private readonly logger = new Logger(ExportS3Service.name);
  private readonly bucket: string;
  /** Short — URLs are minted per download click, never stored long-term. */
  private readonly PRESIGNED_TTL = 15 * 60; // 900s

  constructor(private readonly s3: S3Client, private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('DO_SPACES_DOWNLOAD_BUCKET_NAME');
  }

  /** Upload a generated report buffer to the download bucket. */
  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
    this.logger.log(`Uploaded export object ${key} (${body.length} bytes)`);
  }

  /** Fresh short-TTL presigned GET URL for a stored report key. */
  async getPresignedUrl(key: string): Promise<string> {
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: this.PRESIGNED_TTL,
    });
  }

  /**
   * Confirm an export object still exists (lifecycle rules auto-delete after
   * N days). Returns the key when present, else null so callers can surface a
   * regenerate-able "expired" state instead of signing a dead URL.
   */
  async resolveKey(key: string): Promise<string | null> {
    try {
      const resp = await this.s3.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: key }));
      return (resp.Contents || []).some((o) => o.Key === key) ? key : null;
    } catch (error: any) {
      this.logger.error(`Error resolving export key ${key}: ${error.message}`);
      return null;
    }
  }

  /** Best-effort delete of a generated export object (lifecycle also covers it). */
  async deleteObject(key: string): Promise<void> {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error: any) {
      this.logger.error(`Error deleting export object ${key}: ${error.message}`);
    }
  }
}
