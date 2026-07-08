import { apiCall } from "./client";
import { Shop, ShopMember } from "./types";

export const shopsApi = {
  getUserShops: async (token: string | null): Promise<{ shop: Shop; role: "owner" | "shop_worker" }[]> => {
    return await apiCall<{ shop: Shop; role: "owner" | "shop_worker" }[]>({
      url: "/api/shops",
      method: "GET"
    }, token);
  },
  getShop: async (token: string | null, shopId: number): Promise<Shop> => {
    return await apiCall<Shop>({
      url: `/api/shops/${shopId}`,
      method: "GET"
    }, token);
  },
  createShop: async (token: string | null, data: any): Promise<Shop> => {
    return await apiCall<Shop>({
      url: "/api/shops",
      method: "POST",
      data
    }, token);
  },
  updateShop: async (token: string | null, shopId: number, data: any): Promise<Shop> => {
    return await apiCall<Shop>({
      url: `/api/shops/${shopId}`,
      method: "PUT",
      data
    }, token);
  },
  getMembers: async (token: string | null, shopId: number): Promise<ShopMember[]> => {
    return await apiCall<ShopMember[]>({
      url: `/api/shops/${shopId}/staff`,
      method: "GET"
    }, token);
  }
};
