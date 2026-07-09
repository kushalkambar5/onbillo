import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class WebhooksService {
  constructor(private dbService: DbService) {}

  async handleEvent(eventType: string, data: any) {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const email = data.email_addresses?.[0]?.email_address;
      const name =
        `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'No Name';
      const phone = data.phone_numbers?.[0]?.phone_number || null;

      const role =
        data.public_metadata?.role === 'app_admin' ? 'app_admin' : null;

      if (eventType === 'user.created') {
        await this.dbService.db.insert(users).values({
          clerkId: data.id,
          email: email || '',
          name,
          phone,
          role,
        });
      } else {
        const updateData: any = {
          email: email || '',
          name,
          phone,
          updatedAt: new Date(),
        };

        // Only overwrite local role if the webhook explicitly says they are app_admin
        if (role === 'app_admin') {
          updateData.role = 'app_admin';
        }

        await this.dbService.db
          .update(users)
          .set(updateData)
          .where(eq(users.clerkId, data.id));
      }
    } else if (eventType === 'user.deleted') {
      await this.dbService.db.delete(users).where(eq(users.clerkId, data.id));
    }
  }
}
