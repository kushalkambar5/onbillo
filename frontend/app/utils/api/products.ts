import { apiCall } from "./client";
import { Product, ShopProduct } from "./types";

export const productsApi = {
  getShopProducts: async (token: string | null, shopId: number): Promise<ShopProduct[]> => {
    return await apiCall<ShopProduct[]>({
      url: `/api/shops/${shopId}/products`,
      method: "GET"
    }, token);
  },
  searchGlobalProducts: async (token: string | null, query: string): Promise<Product[]> => {
    return await apiCall<Product[]>({
      url: `/api/products?q=${encodeURIComponent(query)}`,
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
  }
};
