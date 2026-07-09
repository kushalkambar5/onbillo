import { apiCall } from "./client";
import { Product, ShopProduct } from "./types";

export const productsApi = {
  getShopProducts: async (token: string | null, shopId: string): Promise<ShopProduct[]> => {
    return await apiCall<ShopProduct[]>({
      url: `/api/shops/${shopId}/products`,
      method: "GET"
    }, token);
  },
  searchGlobalProducts: async (token: string | null, query: string, shopId?: string): Promise<Product[]> => {
    const url = shopId
      ? `/api/products?q=${encodeURIComponent(query)}&shopId=${shopId}`
      : `/api/products?q=${encodeURIComponent(query)}`;
    return await apiCall<Product[]>({
      url,
      method: "GET"
    }, token);
  },
  addGlobalProductToShop: async (token: string | null, shopId: string, productId: string, unitPrice: number): Promise<ShopProduct> => {
    return await apiCall<ShopProduct>({
      url: `/api/shops/${shopId}/products`,
      method: "POST",
      data: { productId, unitPrice }
    }, token);
  },
  updateShopProduct: async (token: string | null, shopId: string, shopProductId: string, data: { unitPrice?: number; isActive?: boolean }): Promise<ShopProduct> => {
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
    shopId: string,
    data: {
      barcode?: string | null;
      name: string;
      brand?: string | null;
      category?: string | null;
      mrp: number;
      unitPrice: number;
      imageUrl?: string | null;
    }
  ): Promise<ShopProduct> => {
    return await apiCall<ShopProduct>({
      url: `/api/shops/${shopId}/products/custom`,
      method: "POST",
      data
    }, token);
  },
  deleteShopProduct: async (token: string | null, shopId: string, shopProductId: string): Promise<{ success: boolean }> => {
    return await apiCall<{ success: boolean }>({
      url: `/api/shops/${shopId}/products/${shopProductId}`,
      method: "DELETE"
    }, token);
  },
  uploadImage: async (token: string | null, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    return await apiCall<{ url: string }>({
      url: "/api/upload",
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }, token);
  },
  deleteImage: async (token: string | null, key: string): Promise<{ success: boolean }> => {
    return await apiCall<{ success: boolean }>({
      url: `/api/upload/${key}`,
      method: "DELETE"
    }, token);
  }
};

