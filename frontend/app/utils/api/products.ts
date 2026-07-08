import { apiCall } from "./client";
import { Product, ShopProduct } from "./types";

export const productsApi = {
  getShopProducts: async (token: string | null, shopId: number): Promise<ShopProduct[]> => {
    return await apiCall<ShopProduct[]>({
      url: `/api/shops/${shopId}/products`,
      method: "GET"
    }, token);
  },
  searchGlobalProducts: async (token: string | null, query: string, shopId?: number): Promise<Product[]> => {
    const url = shopId
      ? `/api/products?q=${encodeURIComponent(query)}&shopId=${shopId}`
      : `/api/products?q=${encodeURIComponent(query)}`;
    return await apiCall<Product[]>({
      url,
      method: "GET"
    }, token);
  },
  addGlobalProductToShop: async (token: string | null, shopId: number, productId: number, unitPrice: number): Promise<ShopProduct> => {
    return await apiCall<ShopProduct>({
      url: `/api/shops/${shopId}/products`,
      method: "POST",
      data: { productId, unitPrice }
    }, token);
  },
  updateShopProduct: async (token: string | null, shopId: number, shopProductId: number, data: { unitPrice?: number; isActive?: boolean }): Promise<ShopProduct> => {
    return await apiCall<ShopProduct>({
      url: `/api/shops/${shopId}/products/${shopProductId}`,
      method: "PUT",
      data
    }, token);
  },
  requestNewGlobalProduct: async (token: string | null, data: { barcode: string; name: string; brand: string; category: string; mrp: number }): Promise<Product> => {
    return await apiCall<Product>({
      url: "/api/products",
      method: "POST",
      data
    }, token);
  },
  addCustomProduct: async (
    token: string | null,
    shopId: number,
    data: {
      barcode: string;
      name: string;
      brand: string;
      category: string;
      mrp: number;
      unitPrice: number;
    }
  ): Promise<ShopProduct> => {
    return await apiCall<ShopProduct>({
      url: `/api/shops/${shopId}/products/custom`,
      method: "POST",
      data
    }, token);
  }
};

