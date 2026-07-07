import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { bills, billItems } from '../db/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class BillsService {
  constructor(private dbService: DbService) {}

  async createBill(shopId: number, data: any, userId: number) {
    return await this.dbService.db.transaction(async (tx) => {
      const [bill] = await tx.insert(bills).values({
        shopId,
        billNumber: data.billNumber,
        createdBy: userId,
        totalPrice: data.totalPrice,
        notes: data.notes,
        templetUsed: data.templetUsed || '1',
        status: 'active',
      }).returning();

      if (data.items && data.items.length > 0) {
        const itemsToInsert = data.items.map((item: any) => ({
          billId: bill.id,
          shopProductId: item.shopProductId,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        }));
        await tx.insert(billItems).values(itemsToInsert);
      }

      return bill;
    });
  }

  async listBills(shopId: number) {
    return await this.dbService.db.select().from(bills).where(eq(bills.shopId, shopId));
  }

  async getBillDetail(shopId: number, id: number) {
    const [bill] = await this.dbService.db.select().from(bills).where(and(eq(bills.id, id), eq(bills.shopId, shopId))).limit(1);
    if (!bill) throw new NotFoundException('Bill not found');

    const items = await this.dbService.db.select().from(billItems).where(eq(billItems.billId, id));
    return { ...bill, items };
  }

  async cancelBill(shopId: number, id: number) {
    const [bill] = await this.dbService.db.update(bills).set({
      status: 'cancelled',
    }).where(and(eq(bills.id, id), eq(bills.shopId, shopId))).returning();
    
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }
}
