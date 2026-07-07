import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { users, shops, products } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AdminService {
  constructor(private dbService: DbService) {}

  async listUsers() {
    return await this.dbService.db.select().from(users);
  }

  async togglePremium(id: number, isPremium: boolean) {
    const [user] = await this.dbService.db.update(users).set({
      isPremium,
      updatedAt: new Date(),
    }).where(eq(users.id, id)).returning();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async toggleBan(id: number, isBanned: boolean) {
    const [user] = await this.dbService.db.update(users).set({
      isBanned,
      updatedAt: new Date(),
    }).where(eq(users.id, id)).returning();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async listShops() {
    return await this.dbService.db.select().from(shops);
  }

  async listPendingProducts() {
    return await this.dbService.db.select().from(products).where(eq(products.status, 'pending'));
  }

  async approveProduct(id: number) {
    const [product] = await this.dbService.db.update(products).set({
      status: 'approved',
      updatedAt: new Date(),
    }).where(eq(products.id, id)).returning();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async rejectProduct(id: number, reason: string) {
    const [product] = await this.dbService.db.update(products).set({
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date(),
    }).where(eq(products.id, id)).returning();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
