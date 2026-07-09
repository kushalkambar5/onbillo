import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { shops, users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ShopsService {
  constructor(private dbService: DbService) {}

  async createShop(data: any, userId: string) {
    return await this.dbService.db.transaction(async (tx) => {
      const [shop] = await tx
        .insert(shops)
        .values({
          name: data.name,
          gstNumber: data.gstNumber,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          phone: data.phone,
          email: data.email,
          logoUrl: data.logoUrl,
          createdBy: userId,
        })
        .returning();

      await tx
        .update(users)
        .set({
          shopId: shop.id,
          role: 'shop_owner',
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return shop;
    });
  }

  async getUserShops(userId: string) {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.shopId) {
      return [];
    }

    const [shop] = await this.dbService.db
      .select()
      .from(shops)
      .where(eq(shops.id, user.shopId))
      .limit(1);

    if (!shop) {
      return [];
    }

    const mappedRole = user.role === 'shop_owner' ? 'owner' : user.role;
    return [{ shop, role: mappedRole }];
  }

  async getShop(id: string) {
    const [shop] = await this.dbService.db
      .select()
      .from(shops)
      .where(eq(shops.id, id))
      .limit(1);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  async updateShop(id: string, data: any) {
    const [shop] = await this.dbService.db
      .update(shops)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, id))
      .returning();

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  async deleteShop(id: string) {
    await this.dbService.db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          shopId: null,
          role: null,
          updatedAt: new Date(),
        })
        .where(eq(users.shopId, id));

      await tx.delete(shops).where(eq(shops.id, id));
    });
    return { success: true };
  }
}
