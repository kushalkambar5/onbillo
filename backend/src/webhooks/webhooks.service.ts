import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class WebhooksService {
  constructor(private dbService: DbService) {}

  private extractEmail(data: any): string {
    const email =
      data.email_addresses?.find((e: any) => e.id === data.primary_email_address_id)
        ?.email_address ??
      data.email_addresses?.[0]?.email_address ??
      data.email ??
      null;
    // users.email is NOT NULL UNIQUE — phone-only Clerk users have no email,
    // so use a deterministic placeholder that stays unique per Clerk user.
    return email || `no-email-${data.id}@placeholder.local`;
  }

  async handleEvent(eventType: string, data: any) {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const email = this.extractEmail(data);
      const name =
        `${data.first_name || ''} ${data.last_name || ''}`.trim() ||
        data.username ||
        'No Name';
      const phone = data.phone_numbers?.[0]?.phone_number || null;

      const role =
        data.public_metadata?.role === 'app_admin' ? 'app_admin' : null;

      // Idempotent upsert: Clerk retries the SAME message id on failure/timeout,
      // and user.updated can arrive before user.created (or for a deleted-then-recreated user).
      // Check-then-write keeps replays from hitting unique violations on clerk_id/email.
      const [existing] = await this.dbService.db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.clerkId, data.id))
        .limit(1);

      if (!existing) {
        try {
          await this.dbService.db.insert(users).values({
            clerkId: data.id,
            email,
            name,
            phone,
            role,
          });
        } catch (err: any) {
          // Race: two deliveries inserted concurrently, or email belongs to
          // a different clerkId. Fall back to updating the clerkId row if it
          // appeared, otherwise log and let the global filter return 500 so
          // Clerk retries (don't silently drop user provisioning).
          console.error(`webhook ${eventType} insert failed for ${data.id}:`, err?.message ?? err);
          const [retry] = await this.dbService.db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.clerkId, data.id))
            .limit(1);
          if (retry) {
            await this.dbService.db
              .update(users)
              .set({ email, name, phone, updatedAt: new Date(), ...(role === 'app_admin' ? { role } : {}) })
              .where(eq(users.clerkId, data.id));
            return;
          }
          throw err;
        }
      } else {
        const updateData: any = {
          email,
          name,
          phone,
          updatedAt: new Date(),
        };

        // Only overwrite local role if the webhook explicitly says they are app_admin
        if (role === 'app_admin') {
          updateData.role = 'app_admin';
        }

        try {
          await this.dbService.db
            .update(users)
            .set(updateData)
            .where(eq(users.clerkId, data.id));
        } catch (err) {
          console.error(`webhook ${eventType} update failed for ${data.id}:`, err);
          throw err;
        }
      }
    } else if (eventType === 'user.deleted') {
      // Idempotent: deleting a non-existent row is a success (Clerk may retry).
      await this.dbService.db.delete(users).where(eq(users.clerkId, data.id));
    }
  }
}
