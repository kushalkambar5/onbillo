import { Controller, Post, Req, Headers, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { Webhook } from 'svix';

@Controller('api/webhooks/clerk')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  async handleClerkWebhook(@Req() req: Request, @Headers() headers: Record<string, string>) {
    const payload = JSON.stringify(req.body);
    const svix_id = headers['svix-id'];
    const svix_timestamp = headers['svix-timestamp'];
    const svix_signature = headers['svix-signature'];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      throw new BadRequestException('Error occured -- no svix headers');
    }

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET as string);
    let evt: any;

    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id as string,
        'svix-timestamp': svix_timestamp as string,
        'svix-signature': svix_signature as string,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      throw new BadRequestException('Error occured');
    }

    const { id } = evt.data;
    const eventType = evt.type;
    console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
    
    await this.webhooksService.handleEvent(eventType, evt.data);

    return { success: true };
  }
}
