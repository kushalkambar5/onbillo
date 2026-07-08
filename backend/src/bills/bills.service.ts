import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { bills, billItems, shops, shopProducts, products } from '../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

@Injectable()
export class BillsService {
  constructor(private dbService: DbService) {}

  async createBill(shopId: number, data: any, userId: number) {
    return await this.dbService.db.transaction(async (tx) => {
      // 1. Get the shop detail to read invoicePrefix and invoiceCounter
      const [shop] = await tx
        .select()
        .from(shops)
        .where(eq(shops.id, shopId))
        .limit(1);
      if (!shop) {
        throw new NotFoundException('Shop not found');
      }

      // 2. Generate bill number
      const counter = shop.invoiceCounter;
      const billNumber = `${shop.invoicePrefix || 'INV/'}${counter}`;

      // 3. Increment the shop's invoice counter
      await tx
        .update(shops)
        .set({
          invoiceCounter: counter + 1,
          updatedAt: new Date(),
        })
        .where(eq(shops.id, shopId));

      // 4. Calculate total price from items
      let totalPrice = 0;
      if (data.items && data.items.length > 0) {
        totalPrice = data.items.reduce(
          (sum: number, item: any) => sum + item.unitPrice * item.quantity,
          0,
        );
      }

      // 5. Insert the bill
      const [bill] = await tx
        .insert(bills)
        .values({
          shopId,
          billNumber,
          createdBy: userId,
          totalPrice,
          notes: data.notes || null,
          templetUsed: shop.invoiceTemplet || '1',
          status: 'active',
        })
        .returning();

      // 6. Insert items
      if (data.items && data.items.length > 0) {
        const itemsToInsert = data.items.map((item: any) => ({
          billId: bill.id,
          shopProductId: item.shopProductId,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        }));
        await tx.insert(billItems).values(itemsToInsert);
      }

      // 7. Fetch the items with product details for this bill
      const items = await tx
        .select({
          id: billItems.id,
          billId: billItems.billId,
          shopProductId: billItems.shopProductId,
          unitPrice: billItems.unitPrice,
          quantity: billItems.quantity,
          productName: products.name,
          barcode: products.barcode,
        })
        .from(billItems)
        .innerJoin(shopProducts, eq(shopProducts.id, billItems.shopProductId))
        .innerJoin(products, eq(products.id, shopProducts.productId))
        .where(eq(billItems.billId, bill.id));

      return { ...bill, items };
    });
  }

  async listBills(shopId: number) {
    const dbBills = await this.dbService.db
      .select()
      .from(bills)
      .where(eq(bills.shopId, shopId))
      .orderBy(desc(bills.createdAt));
    if (dbBills.length === 0) return [];

    const billIds = dbBills.map((b) => b.id);

    // Fetch all items for these bills, including product info
    const allItems = await this.dbService.db
      .select({
        id: billItems.id,
        billId: billItems.billId,
        shopProductId: billItems.shopProductId,
        unitPrice: billItems.unitPrice,
        quantity: billItems.quantity,
        productName: products.name,
        barcode: products.barcode,
      })
      .from(billItems)
      .innerJoin(shopProducts, eq(shopProducts.id, billItems.shopProductId))
      .innerJoin(products, eq(products.id, shopProducts.productId))
      .where(inArray(billItems.billId, billIds));

    const billItemsMap = new Map<number, any[]>();
    for (const item of allItems) {
      if (!billItemsMap.has(item.billId)) {
        billItemsMap.set(item.billId, []);
      }
      billItemsMap.get(item.billId)!.push(item);
    }

    return dbBills.map((b) => ({
      ...b,
      items: billItemsMap.get(b.id) || [],
    }));
  }

  async getBillDetail(shopId: number, id: number) {
    const [bill] = await this.dbService.db
      .select()
      .from(bills)
      .where(and(eq(bills.id, id), eq(bills.shopId, shopId)))
      .limit(1);
    if (!bill) throw new NotFoundException('Bill not found');

    const items = await this.dbService.db
      .select({
        id: billItems.id,
        billId: billItems.billId,
        shopProductId: billItems.shopProductId,
        unitPrice: billItems.unitPrice,
        quantity: billItems.quantity,
        productName: products.name,
        barcode: products.barcode,
      })
      .from(billItems)
      .innerJoin(shopProducts, eq(shopProducts.id, billItems.shopProductId))
      .innerJoin(products, eq(products.id, shopProducts.productId))
      .where(eq(billItems.billId, id));

    return { ...bill, items };
  }

  async cancelBill(shopId: number, id: number) {
    const [bill] = await this.dbService.db
      .update(bills)
      .set({
        status: 'cancelled',
      })
      .where(and(eq(bills.id, id), eq(bills.shopId, shopId)))
      .returning();

    if (!bill) throw new NotFoundException('Bill not found');

    // Fetch the cancelled bill with items
    const items = await this.dbService.db
      .select({
        id: billItems.id,
        billId: billItems.billId,
        shopProductId: billItems.shopProductId,
        unitPrice: billItems.unitPrice,
        quantity: billItems.quantity,
        productName: products.name,
        barcode: products.barcode,
      })
      .from(billItems)
      .innerJoin(shopProducts, eq(shopProducts.id, billItems.shopProductId))
      .innerJoin(products, eq(products.id, shopProducts.productId))
      .where(eq(billItems.billId, id));

    return { ...bill, items };
  }
}
