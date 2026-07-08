import { apiCall } from "./client";
import { Bill } from "./types";

export const billsApi = {
  getShopBills: async (token: string | null, shopId: number): Promise<Bill[]> => {
    return await apiCall<Bill[]>({
      url: `/api/shops/${shopId}/bills`,
      method: "GET"
    }, token);
  },
  createBill: async (token: string | null, shopId: number, data: { items: { shopProductId: number; unitPrice: number; quantity: number }[]; notes?: string }): Promise<Bill> => {
    return await apiCall<Bill>({
      url: `/api/shops/${shopId}/bills`,
      method: "POST",
      data
    }, token);
  },
  voidBill: async (token: string | null, shopId: number, billId: number): Promise<Bill> => {
    return await apiCall<Bill>({
      url: `/api/shops/${shopId}/bills/${billId}/cancel`,
      method: "PUT"
    }, token);
  }
};
