import { apiCall } from "./client";
import { Shop, ShopMember } from "./types";
import { mockUser, mockShops, mockShopMembers, mockShopProducts, mockBills, mockGlobalProducts } from "./mockData";

export const shopsApi = {
  getUserShops: async (token: string | null): Promise<{ shop: Shop; role: "owner" | "shop_worker" }[]> => {
    try {
      return await apiCall<{ shop: Shop; role: "owner" | "shop_worker" }[]>({
        url: "/api/shops",
        method: "GET"
      }, token);
    } catch {
      return mockShops.map(shop => ({
        shop,
        role: (mockShopMembers[shop.id]?.find(m => m.userId === mockUser.id)?.role || "shop_worker") as any
      }));
    }
  },
  getShop: async (token: string | null, shopId: number): Promise<Shop> => {
    try {
      return await apiCall<Shop>({
        url: `/api/shops/${shopId}`,
        method: "GET"
      }, token);
    } catch {
      const shop = mockShops.find(s => s.id === shopId);
      if (!shop) throw new Error("Shop not found");
      return shop;
    }
  },
  createShop: async (token: string | null, data: any): Promise<Shop> => {
    try {
      return await apiCall<Shop>({
        url: "/api/shops",
        method: "POST",
        data
      }, token);
    } catch {
      const newShop: Shop = {
        id: mockShops.length + 1,
        createdBy: mockUser.id,
        name: data.name,
        gstNumber: data.gstNumber || null,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone || null,
        email: data.email || null,
        logoUrl: null,
        currency: "rupees",
        taxType: data.taxType || "no_tax",
        taxRate: data.taxRate || "0.00",
        invoiceTemplet: "1",
        invoicePrefix: "INV/",
        invoiceCounter: 1,
        footerText: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockShops.push(newShop);
      mockShopMembers[newShop.id] = [
        { id: Date.now(), shopId: newShop.id, userId: mockUser.id, role: "owner", isActive: true, joinedAt: new Date().toISOString(), user: mockUser }
      ];
      mockShopProducts[newShop.id] = [
        { id: Date.now(), shopId: newShop.id, productId: 1, unitPrice: 3000, isActive: true, product: mockGlobalProducts[0] }
      ];
      mockBills[newShop.id] = [];
      return newShop;
    }
  },
  updateShop: async (token: string | null, shopId: number, data: any): Promise<Shop> => {
    try {
      return await apiCall<Shop>({
        url: `/api/shops/${shopId}`,
        method: "PUT",
        data
      }, token);
    } catch {
      const index = mockShops.findIndex(s => s.id === shopId);
      if (index === -1) throw new Error("Shop not found");
      mockShops[index] = { ...mockShops[index], ...data, updatedAt: new Date().toISOString() };
      return mockShops[index];
    }
  },
  getMembers: async (token: string | null, shopId: number): Promise<ShopMember[]> => {
    try {
      return await apiCall<ShopMember[]>({
        url: `/api/staff/shop/${shopId}`,
        method: "GET"
      }, token);
    } catch {
      return mockShopMembers[shopId] || [];
    }
  }
};
