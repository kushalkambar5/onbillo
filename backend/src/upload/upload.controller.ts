import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { AuthGuard } from '../auth/auth.guard';
import { extname } from 'path';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const DeleteKeySchema = z
  .string()
  .min(1, 'Key is required')
  .max(1024, 'Key is too long')
  .regex(/^[a-zA-Z0-9\-_\.\/]+$/, 'Key contains invalid characters');

@Controller('api/upload')
@UseGuards(AuthGuard)
export class UploadController {
  private readonly logger = new Logger('InputValidation');

  constructor(private uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      this.logger.warn('File upload attempt failed: No file provided');
      throw new BadRequestException('No file uploaded');
    }

    const ext = extname(file.originalname).toLowerCase();

    if (
      !ALLOWED_MIME_TYPES.includes(file.mimetype) ||
      !ALLOWED_EXTENSIONS.includes(ext) ||
      file.size > MAX_FILE_SIZE
    ) {
      this.logger.warn(
        `File upload validation failed. MIME: ${file.mimetype}, Ext: ${ext}, Size: ${file.size} bytes`,
      );
      throw new BadRequestException(
        'Invalid file upload. Only images up to 5MB are allowed.',
      );
    }

    const url = await this.uploadService.uploadImage(file);
    return { url };
  }

  @Delete(':key')
  async deleteFile(
    @Param('key', new ZodValidationPipe(DeleteKeySchema)) key: string,
  ) {
    await this.uploadService.deleteImage(key);
    return { success: true };
  }
}
