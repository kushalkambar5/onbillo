import { apiCall } from "./client";
import { User, Shop, Product } from "./types";
import { mockUser, mockShops, mockGlobalProducts, mockAdminUsers } from "./mockData";

export const adminApi = {
  getStats: async (token: string | null): Promise<any> => {
    try {
      return await apiCall<any>({
        url: "/api/admin/stats", // Aggregate stats
        method: "GET"
      }, token);
    } catch {
      return {
        totalUsers: mockAdminUsers.length,
        totalShops: mockShops.length,
        totalProducts: mockGlobalProducts.length,
        pendingProducts: mockGlobalProducts.filter(p => p.status === "pending").length,
        monthlyRevenue: 1250000,
        activePOSDevices: 48,
        serverUptime: "99.98%"
      };
    }
  },
  listUsers: async (token: string | null): Promise<User[]> => {
    try {
      return await apiCall<User[]>({
        url: "/api/admin/users",
        method: "GET"
      }, token);
    } catch {
      return mockAdminUsers;
    }
  },
  togglePremium: async (token: string | null, userId: number, isPremium: boolean): Promise<User> => {
    try {
      return await apiCall<User>({
        url: `/api/admin/users/${userId}/premium`,
        method: "PUT",
        data: { isPremium }
      }, token);
    } catch {
      const user = mockAdminUsers.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      user.isPremium = isPremium;
      return user;
    }
  },
  toggleBan: async (token: string | null, userId: number, isBanned: boolean): Promise<User> => {
    try {
      return await apiCall<User>({
        url: `/api/admin/users/${userId}/ban`,
        method: "PUT",
        data: { isBanned }
      }, token);
    } catch {
      const user = mockAdminUsers.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      user.isBanned = isBanned;
      return user;
    }
  },
  listShops: async (token: string | null): Promise<Shop[]> => {
    try {
      return await apiCall<Shop[]>({
        url: "/api/admin/shops",
        method: "GET"
      }, token);
    } catch {
      return mockShops;
    }
  },
  listPendingProducts: async (token: string | null): Promise<Product[]> => {
    try {
      return await apiCall<Product[]>({
        url: "/api/admin/products/pending",
        method: "GET"
      }, token);
    } catch {
      return mockGlobalProducts.filter(p => p.status === "pending");
    }
  },
  approveProduct: async (token: string | null, productId: number): Promise<Product> => {
    try {
      return await apiCall<Product>({
        url: `/api/admin/products/${productId}/approve`,
        method: "PUT"
      }, token);
    } catch {
      const prod = mockGlobalProducts.find(p => p.id === productId);
      if (!prod) throw new Error("Product not found");
      prod.status = "approved";
      return prod;
    }
  },
  rejectProduct: async (token: string | null, productId: number, reason: string): Promise<Product> => {
    try {
      return await apiCall<Product>({
        url: `/api/admin/products/${productId}/reject`,
        method: "PUT",
        data: { reason }
      }, token);
    } catch {
      const prod = mockGlobalProducts.find(p => p.id === productId);
      if (!prod) throw new Error("Product not found");
      prod.status = "rejected";
      prod.rejectionReason = reason;
      return prod;
    }
  }
};
