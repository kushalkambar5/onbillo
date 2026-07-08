import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly logger = new Logger('InputValidation');

  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        this.logger.warn(
          `Validation failed for ${metadata.type} parameter "${metadata.data || ''}". Errors: ${JSON.stringify(errorDetails)}`,
        );

        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: errorDetails,
        });
      }

      this.logger.warn(`Validation failed with unknown error: ${error}`);
      throw new BadRequestException('Validation failed');
    }
  }
}
