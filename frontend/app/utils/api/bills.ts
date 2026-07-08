import { apiCall } from "./client";
import { Bill } from "./types";

export const billsApi = {
  getShopBills: async (token: string | null, shopId: string): Promise<Bill[]> => {
    return await apiCall<Bill[]>({
      url: `/api/shops/${shopId}/bills`,
      method: "GET"
    }, token);
  },
  createBill: async (token: string | null, shopId: string, data: { items: { shopProductId: string; unitPrice: number; quantity: number }[]; notes?: string }): Promise<Bill> => {
    return await apiCall<Bill>({
      url: `/api/shops/${shopId}/bills`,
      method: "POST",
      data
    }, token);
  },
  voidBill: async (token: string | null, shopId: string, billId: string): Promise<Bill> => {
    return await apiCall<Bill>({
      url: `/api/shops/${shopId}/bills/${billId}/cancel`,
      method: "PUT"
    }, token);
  }
};
