import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface CustomRequest extends Request {
  user?: {
    id?: number;
    clerkId?: string;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<CustomRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const timestamp = new Date().toISOString();
    const route = `${request.method} ${request.url}`;
    const userId = request.user?.id || request.user?.clerkId || 'anonymous';

    // Helper to recursively sanitize inputs (body, query, params)
    const sanitizeInput = (data: unknown): unknown => {
      if (data === null || data === undefined) {
        return data;
      }
      if (Array.isArray(data)) {
        return data.map((item: unknown) => sanitizeInput(item));
      }
      if (typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        const sanitized: Record<string, unknown> = {};
        const sensitiveKeys = [
          'password',
          'token',
          'secret',
          'authorization',
          'signature',
          'credential',
          'apikey',
          'ssn',
          'card',
        ];
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          const isSensitive = sensitiveKeys.some((sk) =>
            key.toLowerCase().includes(sk),
          );
          if (isSensitive) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = sanitizeInput(val);
          }
        }
        return sanitized;
      }
      return data;
    };

    const sanitizedBody = sanitizeInput(request.body);
    const sanitizedQuery = sanitizeInput(request.query);
    const sanitizedParams = sanitizeInput(request.params);

    const errorContext = {
      timestamp,
      route,
      userId,
      input: {
        body: sanitizedBody,
        query: sanitizedQuery,
        params: sanitizedParams,
      },
      message:
        exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    // Log error context server-side
    if (status >= 500) {
      this.logger.error(
        `Error occurred: ${JSON.stringify(errorContext, null, 2)}`,
      );
    } else {
      this.logger.warn(
        `Client exception: ${JSON.stringify(errorContext, null, 2)}`,
      );
    }

    if (status >= 500) {
      // Replace response for database errors or internal exceptions with generic message
      response.status(status).json({
        statusCode: status,
        message: 'Something went wrong',
      });
    } else {
      // For client exceptions (4xx), return the actual details
      const exceptionResponse =
        exception instanceof HttpException
          ? (exception.getResponse() as string | Record<string, unknown>)
          : {
              message:
                exception instanceof Error ? exception.message : 'Bad request',
            };

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        response.status(status).json({
          statusCode: status,
          ...exceptionResponse,
        });
      } else {
        response.status(status).json({
          statusCode: status,
          message: exceptionResponse,
        });
      }
    }
  }
}
