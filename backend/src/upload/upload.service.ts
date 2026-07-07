import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private s3: S3Client;
  private bucketName = process.env.R2_BUCKET || 'my-bucket';
  private publicUrl = process.env.R2_PUBLIC_URL || 'https://pub-xxxx.r2.dev';

  constructor() {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async uploadImage(file: any) {
    const key = `${Date.now()}-${file.originalname}`;
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    return `${this.publicUrl}/${key}`;
  }

  async deleteImage(key: string) {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    }));
  }
}
