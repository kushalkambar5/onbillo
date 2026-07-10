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

    const [billingStats] = (await this.dbService.db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as count_1h,
        COALESCE(AVG(total_price) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour'), 0) as avg_1h,
        
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as count_1d,
        COALESCE(AVG(total_price) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day'), 0) as avg_1d,
        
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as count_7d,
        COALESCE(AVG(total_price) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'), 0) as avg_7d,
        
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 month') as count_1m,
        COALESCE(AVG(total_price) FILTER (WHERE created_at >= NOW() - INTERVAL '1 month'), 0) as avg_1m,
        
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '6 months') as count_6m,
        COALESCE(AVG(total_price) FILTER (WHERE created_at >= NOW() - INTERVAL '6 months'), 0) as avg_6m,
        
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 year') as count_1y,
        COALESCE(AVG(total_price) FILTER (WHERE created_at >= NOW() - INTERVAL '1 year'), 0) as avg_1y,
        
        COUNT(*) as count_all,
        COALESCE(AVG(total_price), 0) as avg_all
      FROM bills
      WHERE status = 'active'
    `)) as any[];

    const dbStart = Date.now();
    await this.dbService.db.execute(sql`SELECT 1`);
    const dbLatency = Date.now() - dbStart;

    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    let serverUptime = "";
    if (days > 0) serverUptime += `${days}d `;
    if (hours > 0 || days > 0) serverUptime += `${hours}h `;
    serverUptime += `${minutes}m`;

    const parseIntVal = (val: any) => parseInt(val || '0', 10);
    const parseFloatVal = (val: any) => Math.round(Number(val || 0));

    return {
      totalUsers: parseIntVal(usersCount.count),
      totalShops: parseIntVal(shopsCount.count),
      totalProducts: parseIntVal(productsCount.count),
      pendingProducts: parseIntVal(pendingProductsCount.count),
      invoices: {
        '1h': parseIntVal(billingStats.count_1h),
        '1d': parseIntVal(billingStats.count_1d),
        '7d': parseIntVal(billingStats.count_7d),
        '1m': parseIntVal(billingStats.count_1m),
        '6m': parseIntVal(billingStats.count_6m),
        '1y': parseIntVal(billingStats.count_1y),
        all: parseIntVal(billingStats.count_all),
      },
      averageBill: {
        '1h': parseFloatVal(billingStats.avg_1h),
        '1d': parseFloatVal(billingStats.avg_1d),
        '7d': parseFloatVal(billingStats.avg_7d),
        '1m': parseFloatVal(billingStats.avg_1m),
        '6m': parseFloatVal(billingStats.avg_6m),
        '1y': parseFloatVal(billingStats.avg_1y),
        all: parseFloatVal(billingStats.avg_all),
      },
      activePOSDevices: 4,
      serverUptime,
      dbLatency,
    };
  }

  async listUsers() {
    return await this.dbService.db
      .select({
        id: users.id,
        clerkId: users.clerkId,
        email: users.email,
        phone: users.phone,
        name: users.name,
        role: users.role,
        shopId: users.shopId,
        isPremium: users.isPremium,
        isBanned: users.isBanned,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        shopName: shops.name,
      })
      .from(users)
      .leftJoin(shops, eq(users.shopId, shops.id));
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
    const result = (await this.dbService.db.execute(sql`
      SELECT 
        s.id,
        s.name,
        s.phone,
        s.email,
        s.gst_number as "gstNumber",
        s.city,
        s.state,
        s.address_line_1 as "addressLine1",
        s.address_line_2 as "addressLine2",
        s.pincode,
        s.tax_type as "taxType",
        s.invoice_counter as "invoiceCounter",
        s.created_at as "createdAt",
        COALESCE(u.worker_count, 0) as "workerCount",
        COALESCE(b.bills_count_1h, 0) as "billsCount1h",
        COALESCE(b.bills_value_1h, 0) as "billsValue1h",
        COALESCE(b.bills_count_1d, 0) as "billsCount1d",
        COALESCE(b.bills_value_1d, 0) as "billsValue1d",
        COALESCE(b.bills_count_7d, 0) as "billsCount7d",
        COALESCE(b.bills_value_7d, 0) as "billsValue7d",
        COALESCE(b.bills_count_1m, 0) as "billsCount1m",
        COALESCE(b.bills_value_1m, 0) as "billsValue1m",
        COALESCE(b.bills_count_6m, 0) as "billsCount6m",
        COALESCE(b.bills_value_6m, 0) as "billsValue6m",
        COALESCE(b.bills_count_1y, 0) as "billsCount1y",
        COALESCE(b.bills_value_1y, 0) as "billsValue1y",
        COALESCE(b.bills_count_all, 0) as "billsCountAll",
        COALESCE(b.bills_value_all, 0) as "billsValueAll"
      FROM shops s
      LEFT JOIN (
        SELECT shop_id, COUNT(*) as worker_count 
        FROM users 
        WHERE role = 'shop_worker'
        GROUP BY shop_id
      ) u ON u.shop_id = s.id
      LEFT JOIN (
        SELECT 
          shop_id,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as bills_count_1h,
          SUM(total_price) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as bills_value_1h,
          
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as bills_count_1d,
          SUM(total_price) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as bills_value_1d,
          
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as bills_count_7d,
          SUM(total_price) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as bills_value_7d,
          
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 month') as bills_count_1m,
          SUM(total_price) FILTER (WHERE created_at >= NOW() - INTERVAL '1 month') as bills_value_1m,
          
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '6 months') as bills_count_6m,
          SUM(total_price) FILTER (WHERE created_at >= NOW() - INTERVAL '6 months') as bills_value_6m,
          
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 year') as bills_count_1y,
          SUM(total_price) FILTER (WHERE created_at >= NOW() - INTERVAL '1 year') as bills_value_1y,
          
          COUNT(*) as bills_count_all,
          SUM(total_price) as bills_value_all
        FROM bills
        WHERE status = 'active'
        GROUP BY shop_id
      ) b ON b.shop_id = s.id
      ORDER BY s.created_at DESC
    `)) as any[];

    const parseIntVal = (val: any) => parseInt(val || '0', 10);

    return result.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      email: s.email,
      gstNumber: s.gstNumber,
      city: s.city,
      state: s.state,
      addressLine1: s.addressLine1,
      addressLine2: s.addressLine2,
      pincode: s.pincode,
      taxType: s.taxType,
      invoiceCounter: s.invoiceCounter,
      createdAt: s.createdAt,
      workerCount: parseIntVal(s.workerCount),
      billsCount1h: parseIntVal(s.billsCount1h),
      billsValue1h: parseIntVal(s.billsValue1h),
      billsCount1d: parseIntVal(s.billsCount1d),
      billsValue1d: parseIntVal(s.billsValue1d),
      billsCount7d: parseIntVal(s.billsCount7d),
      billsValue7d: parseIntVal(s.billsValue7d),
      billsCount1m: parseIntVal(s.billsCount1m),
      billsValue1m: parseIntVal(s.billsValue1m),
      billsCount6m: parseIntVal(s.billsCount6m),
      billsValue6m: parseIntVal(s.billsValue6m),
      billsCount1y: parseIntVal(s.billsCount1y),
      billsValue1y: parseIntVal(s.billsValue1y),
      billsCountAll: parseIntVal(s.billsCountAll),
      billsValueAll: parseIntVal(s.billsValueAll),
    }));
  }

  async listPendingProducts() {
    return await this.dbService.db
      .select({
        id: products.id,
        barcode: products.barcode,
        name: products.name,
        brand: products.brand,
        category: products.category,
        imageUrl: products.imageUrl,
        mrp: products.mrp,
        status: products.status,
        rejectionReason: products.rejectionReason,
        createdBy: products.createdBy,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        creatorName: users.name,
        creatorShopName: shops.name,
      })
      .from(products)
      .leftJoin(users, eq(products.createdBy, users.id))
      .leftJoin(shops, eq(users.shopId, shops.id))
      .where(eq(products.status, 'pending'));
  }

  async approveProduct(id: string, editData?: any) {
    const updatePayload: any = {
      status: 'approved',
      updatedAt: new Date(),
    };

    if (editData) {
      if (editData.name !== undefined) updatePayload.name = editData.name;
      if (editData.brand !== undefined) updatePayload.brand = editData.brand;
      if (editData.category !== undefined) updatePayload.category = editData.category;
      if (editData.barcode !== undefined) updatePayload.barcode = editData.barcode;
      if (editData.mrp !== undefined) updatePayload.mrp = editData.mrp;
      if (editData.imageUrl !== undefined) updatePayload.imageUrl = editData.imageUrl;
    }

    const [product] = await this.dbService.db
      .update(products)
      .set(updatePayload)
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

  async listRejectedProducts() {
    return await this.dbService.db
      .select({
        id: products.id,
        barcode: products.barcode,
        name: products.name,
        brand: products.brand,
        category: products.category,
        imageUrl: products.imageUrl,
        mrp: products.mrp,
        status: products.status,
        rejectionReason: products.rejectionReason,
        createdBy: products.createdBy,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        creatorName: users.name,
        creatorShopName: shops.name,
      })
      .from(products)
      .leftJoin(users, eq(products.createdBy, users.id))
      .leftJoin(shops, eq(users.shopId, shops.id))
      .where(eq(products.status, 'rejected'));
  }

  async makeProductPending(id: string) {
    const [product] = await this.dbService.db
      .update(products)
      .set({
        status: 'pending',
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
