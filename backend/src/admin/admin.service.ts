import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { users, shops, products } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class AdminService {
  constructor(private dbService: DbService) {}

  async getStats() {
    const [usersCount] = (await this.dbService.db.execute(
      sql`SELECT COUNT(*) as count FROM users`,
    )) as any[];
    const [shopsCount] = (await this.dbService.db.execute(
      sql`SELECT COUNT(*) as count FROM shops`,
    )) as any[];
    const [productsCount] = (await this.dbService.db.execute(
      sql`SELECT COUNT(*) as count FROM products`,
    )) as any[];
    const [pendingProductsCount] = (await this.dbService.db.execute(
      sql`SELECT COUNT(*) as count FROM products WHERE status = 'pending'`,
    )) as any[];

    const [monthlyRevenue] = (await this.dbService.db.execute(sql`
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM bills 
      WHERE status = 'active' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    `)) as any[];

    return {
      totalUsers: parseInt(usersCount.count || '0', 10),
      totalShops: parseInt(shopsCount.count || '0', 10),
      totalProducts: parseInt(productsCount.count || '0', 10),
      pendingProducts: parseInt(pendingProductsCount.count || '0', 10),
      monthlyRevenue: parseInt(monthlyRevenue.total || '0', 10),
      activePOSDevices: 4,
      serverUptime: '99.99%',
    };
  }

  async listUsers() {
    return await this.dbService.db.select().from(users);
  }

  async togglePremium(id: string, isPremium: boolean) {
    const [user] = await this.dbService.db
      .update(users)
      .set({
        isPremium,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async toggleBan(id: string, isBanned: boolean) {
    const [user] = await this.dbService.db
      .update(users)
      .set({
        isBanned,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async listShops() {
    return await this.dbService.db.select().from(shops);
  }

  async listPendingProducts() {
    return await this.dbService.db
      .select()
      .from(products)
      .where(eq(products.status, 'pending'));
  }

  async approveProduct(id: string) {
    const [product] = await this.dbService.db
      .update(products)
      .set({
        status: 'approved',
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async rejectProduct(id: string, reason: string) {
    const [product] = await this.dbService.db
      .update(products)
      .set({
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
