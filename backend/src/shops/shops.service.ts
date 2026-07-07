import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { shops, shopMembers } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ShopsService {
  constructor(private dbService: DbService) {}

  async createShop(data: any, userId: number) {
    return await this.dbService.db.transaction(async (tx) => {
      const [shop] = await tx.insert(shops).values({
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
      }).returning();

      await tx.insert(shopMembers).values({
        shopId: shop.id,
        userId: userId,
        role: 'owner',
      });

      return shop;
    });
  }

  async getUserShops(userId: number) {
    return await this.dbService.db
      .select({ shop: shops, role: shopMembers.role })
      .from(shopMembers)
      .innerJoin(shops, eq(shopMembers.shopId, shops.id))
      .where(eq(shopMembers.userId, userId));
  }

  async getShop(id: number) {
    const [shop] = await this.dbService.db.select().from(shops).where(eq(shops.id, id)).limit(1);
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  async updateShop(id: number, data: any) {
    const [shop] = await this.dbService.db.update(shops).set({ 
      ...data, 
      updatedAt: new Date() 
    }).where(eq(shops.id, id)).returning();
    
    if (!shop) {
        throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  async deleteShop(id: number) {
    await this.dbService.db.delete(shops).where(eq(shops.id, id));
    return { success: true };
  }
}
