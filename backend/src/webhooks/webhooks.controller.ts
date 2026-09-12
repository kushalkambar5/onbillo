import {
  Controller,
  Post,
  Get,
  Req,
  Headers,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { Webhook } from 'svix';

@Controller('api/webhooks/clerk')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  // Lets you (and uptime checks) visit the URL in a browser to confirm routing works.
  // Clerk itself only ever sends POST.
  @Get()
  health() {
    return { ok: true, route: 'api/webhooks/clerk' };
  }

  @Post()
  async handleClerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ) {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      console.error('CLERK_WEBHOOK_SECRET is not set');
      throw new InternalServerErrorException('Webhook secret not configured');
    }

    // Express lowercases incoming headers; be tolerant of both cases.
    const svix_id =
      headers['svix-id'] ?? (headers as any)['Svix-Id'] ?? req.headers['svix-id'];
    const svix_timestamp =
      headers['svix-timestamp'] ??
      (headers as any)['Svix-Timestamp'] ??
      req.headers['svix-timestamp'];
    const svix_signature =
      headers['svix-signature'] ??
      (headers as any)['Svix-Signature'] ??
      req.headers['svix-signature'];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      throw new BadRequestException('Error occured -- no svix headers');
    }

    // IMPORTANT: verify the EXACT raw bytes Clerk sent, not JSON.stringify(req.body).
    // Requires NestFactory.create(AppModule, { rawBody: true }) in main.ts / api/index.ts.
    const rawBody: unknown =
      (req as any).rawBody ?? (req as any).body;
    const payload: string | Buffer =
      Buffer.isBuffer(rawBody) || typeof rawBody === 'string'
        ? (rawBody as string | Buffer)
        : Buffer.from(JSON.stringify((rawBody as object) ?? {}));

    const wh = new Webhook(secret);
    let evt: any;

    try {
      evt = wh.verify(payload, {
        'svix-id': Array.isArray(svix_id) ? svix_id[0] : (svix_id as string),
        'svix-timestamp': Array.isArray(svix_timestamp)
          ? svix_timestamp[0]
          : (svix_timestamp as string),
        'svix-signature': Array.isArray(svix_signature)
          ? svix_signature[0]
          : (svix_signature as string),
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      throw new BadRequestException('Error occured');
    }

    const { id } = evt.data;
    const eventType = evt.type;
    console.log(`Webhook with and ID of ${id} and type of ${eventType}`);

    // Ignore events we don't care about (e.g. session.created) instead of failing.
    // Return 200 so Clerk stops retrying them. Unsubscribe from them in the
    // Clerk dashboard too to reduce noise.
    if (
      eventType !== 'user.created' &&
      eventType !== 'user.updated' &&
      eventType !== 'user.deleted'
    ) {
      return { success: true, ignored: eventType };
    }

    await this.webhooksService.handleEvent(eventType, evt.data);

    return { success: true };
  }
}
