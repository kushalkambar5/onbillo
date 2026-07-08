import { apiCall } from "./client";
import { User, Shop, Product } from "./types";

export const adminApi = {
  getStats: async (token: string | null): Promise<any> => {
    return await apiCall<any>({
      url: "/api/admin/stats",
      method: "GET"
    }, token);
  },
  listUsers: async (token: string | null): Promise<User[]> => {
    return await apiCall<User[]>({
      url: "/api/admin/users",
      method: "GET"
    }, token);
  },
  togglePremium: async (token: string | null, userId: string, isPremium: boolean): Promise<User> => {
    return await apiCall<User>({
      url: `/api/admin/users/${userId}/premium`,
      method: "PUT",
      data: { isPremium }
    }, token);
  },
  toggleBan: async (token: string | null, userId: string, isBanned: boolean): Promise<User> => {
    return await apiCall<User>({
      url: `/api/admin/users/${userId}/ban`,
      method: "PUT",
      data: { isBanned }
    }, token);
  },
  listShops: async (token: string | null): Promise<Shop[]> => {
    return await apiCall<Shop[]>({
      url: "/api/admin/shops",
      method: "GET"
    }, token);
  },
  listPendingProducts: async (token: string | null): Promise<Product[]> => {
    return await apiCall<Product[]>({
      url: "/api/admin/products/pending",
      method: "GET"
    }, token);
  },
  approveProduct: async (token: string | null, productId: string): Promise<Product> => {
    return await apiCall<Product>({
      url: `/api/admin/products/${productId}/approve`,
      method: "PUT"
    }, token);
  },
  rejectProduct: async (token: string | null, productId: string, reason: string): Promise<Product> => {
    return await apiCall<Product>({
      url: `/api/admin/products/${productId}/reject`,
      method: "PUT",
      data: { reason }
    }, token);
  }
};
