import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { sql } from 'drizzle-orm';

@Injectable()
export class AnalyticsService {
  constructor(private dbService: DbService) {}

  async getSummary(shopId: number) {
    const result = await this.dbService.db.execute(sql`
      SELECT 
        COALESCE(SUM(total_price) FILTER (WHERE created_at >= CURRENT_DATE), 0) as todays_sales,
        COALESCE(SUM(total_price) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'), 0) as weekly_sales,
        COUNT(id) as total_bills
      FROM bills
      WHERE shop_id = ${shopId} AND status = 'active'
    `);
    
    return result[0] || { todays_sales: 0, weekly_sales: 0, total_bills: 0 };
  }

  async getTopProducts(shopId: number) {
    const result = await this.dbService.db.execute(sql`
      SELECT sp.product_id, p.name, SUM(bi.quantity) as total_quantity
      FROM bill_items bi
      JOIN bills b ON b.id = bi.bill_id
      JOIN shop_products sp ON sp.id = bi.shop_product_id
      JOIN products p ON p.id = sp.product_id
      WHERE b.shop_id = ${shopId} 
        AND b.status = 'active'
        AND b.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY sp.product_id, p.name
      ORDER BY total_quantity DESC
      LIMIT 5
    `);
    
    return result;
  }

  async getSalesTrend(shopId: number) {
    const result = await this.dbService.db.execute(sql`
      SELECT DATE(created_at) as date, COALESCE(SUM(total_price), 0) as revenue
      FROM bills
      WHERE shop_id = ${shopId} 
        AND status = 'active'
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);
    
    return result;
  }
}
