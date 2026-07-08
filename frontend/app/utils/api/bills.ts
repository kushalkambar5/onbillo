import { apiCall } from "./client";
import { Bill, BillItem } from "./types";
import { mockUser, mockShops, mockShopProducts, mockBills } from "./mockData";

export const billsApi = {
  getShopBills: async (token: string | null, shopId: number): Promise<Bill[]> => {
    try {
      return await apiCall<Bill[]>({
        url: `/api/bills/shop/${shopId}`,
        method: "GET"
      }, token);
    } catch {
      return mockBills[shopId] || [];
    }
  },
  createBill: async (token: string | null, shopId: number, data: { items: { shopProductId: number; unitPrice: number; quantity: number }[]; notes?: string }): Promise<Bill> => {
    try {
      return await apiCall<Bill>({
        url: `/api/bills/shop/${shopId}`,
        method: "POST",
        data
      }, token);
    } catch {
      const shop = mockShops.find(s => s.id === shopId);
      if (!shop) throw new Error("Shop not found");

      const counter = shop.invoiceCounter;
      shop.invoiceCounter += 1;

      const billNum = `${shop.invoicePrefix}${counter}`;
      let grandTotal = 0;

      const billItems: BillItem[] = data.items.map((item, idx) => {
        const shopProd = mockShopProducts[shopId]?.find(sp => sp.id === item.shopProductId);
        grandTotal += item.unitPrice * item.quantity;
        return {
          id: Date.now() + idx,
          billId: Date.now(),
          shopProductId: item.shopProductId,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          productName: shopProd?.product.name || "Unknown Product",
          barcode: shopProd?.product.barcode || undefined
        };
      });

      const newBill: Bill = {
        id: Date.now(),
        shopId,
        billNumber: billNum,
        createdBy: mockUser.id,
        totalPrice: grandTotal,
        notes: data.notes || null,
        templetUsed: shop.invoiceTemplet,
        status: "active",
        createdAt: new Date().toISOString(),
        cashierName: mockUser.name,
        items: billItems
      };

      if (!mockBills[shopId]) mockBills[shopId] = [];
      mockBills[shopId].unshift(newBill);
      return newBill;
    }
  },
  voidBill: async (token: string | null, shopId: number, billId: number): Promise<Bill> => {
    try {
      return await apiCall<Bill>({
        url: `/api/bills/shop/${shopId}/${billId}/void`,
        method: "PUT"
      }, token);
    } catch {
      const list = mockBills[shopId] || [];
      const bill = list.find(b => b.id === billId);
      if (!bill) throw new Error("Bill not found");
      bill.status = "cancelled";
      return bill;
    }
  }
};
