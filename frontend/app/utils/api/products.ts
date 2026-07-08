import { apiCall } from "./client";
import { Product, ShopProduct } from "./types";
import { mockUser, mockGlobalProducts, mockShopProducts } from "./mockData";

export const productsApi = {
  getShopProducts: async (token: string | null, shopId: number): Promise<ShopProduct[]> => {
    try {
      return await apiCall<ShopProduct[]>({
        url: `/api/products/shop/${shopId}`,
        method: "GET"
      }, token);
    } catch {
      return mockShopProducts[shopId] || [];
    }
  },
  searchGlobalProducts: async (token: string | null, query: string): Promise<Product[]> => {
    try {
      return await apiCall<Product[]>({
        url: `/api/products/search?q=${encodeURIComponent(query)}`,
        method: "GET"
      }, token);
    } catch {
      if (!query) return mockGlobalProducts.filter(p => p.status === "approved");
      const q = query.toLowerCase();
      return mockGlobalProducts.filter(
        p => p.status === "approved" &&
        ((p.name.toLowerCase().includes(q)) || (p.barcode && p.barcode.includes(q)) || (p.brand && p.brand.toLowerCase().includes(q)))
      );
    }
  },
  addGlobalProductToShop: async (token: string | null, shopId: number, productId: number, unitPrice: number): Promise<ShopProduct> => {
    try {
      return await apiCall<ShopProduct>({
        url: `/api/products/shop/${shopId}/add`,
        method: "POST",
        data: { productId, unitPrice }
      }, token);
    } catch {
      const prod = mockGlobalProducts.find(p => p.id === productId);
      if (!prod) throw new Error("Global product not found");

      const existing = mockShopProducts[shopId]?.find(sp => sp.productId === productId);
      if (existing) {
        existing.unitPrice = unitPrice;
        existing.isActive = true;
        return existing;
      }

      const newShopProduct: ShopProduct = {
        id: Date.now(),
        shopId,
        productId,
        unitPrice,
        isActive: true,
        product: prod
      };
      if (!mockShopProducts[shopId]) mockShopProducts[shopId] = [];
      mockShopProducts[shopId].push(newShopProduct);
      return newShopProduct;
    }
  },
  updateShopProduct: async (token: string | null, shopId: number, shopProductId: number, data: { unitPrice?: number; isActive?: boolean }): Promise<ShopProduct> => {
    try {
      return await apiCall<ShopProduct>({
        url: `/api/products/shop/${shopId}/product/${shopProductId}`,
        method: "PUT",
        data
      }, token);
    } catch {
      const list = mockShopProducts[shopId] || [];
      const prod = list.find(sp => sp.id === shopProductId);
      if (!prod) throw new Error("Shop product not found");
      if (data.unitPrice !== undefined) prod.unitPrice = data.unitPrice;
      if (data.isActive !== undefined) prod.isActive = data.isActive;
      return prod;
    }
  },
  requestNewGlobalProduct: async (token: string | null, data: { barcode: string; name: string; brand: string; category: string; mrp: number }): Promise<Product> => {
    try {
      return await apiCall<Product>({
        url: "/api/products/global",
        method: "POST",
        data
      }, token);
    } catch {
      const newProd: Product = {
        id: mockGlobalProducts.length + 1,
        barcode: data.barcode,
        name: data.name,
        brand: data.brand || null,
        category: data.category || null,
        imageUrl: null,
        mrp: data.mrp,
        status: "pending",
        rejectionReason: null,
        createdBy: mockUser.id,
        createdAt: new Date().toISOString()
      };
      mockGlobalProducts.push(newProd);
      return newProd;
    }
  }
};
