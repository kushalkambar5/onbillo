// Onbillo API client with Resilient Mock Mode Fallback

export interface User {
  id: number;
  clerkId: string;
  email: string;
  phone: string | null;
  name: string;
  role: "app_admin" | "user";
  isPremium: boolean;
  isBanned: boolean;
  createdAt: string;
}

export interface Shop {
  id: number;
  createdBy: number | null;
  name: string;
  gstNumber: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  currency: "rupees";
  taxType: "gst_inclusive" | "gst_exclusive" | "no_tax";
  taxRate: string; // decimal from db
  invoiceTemplet: string;
  invoicePrefix: string;
  invoiceCounter: number;
  footerText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShopMember {
  id: number;
  shopId: number;
  userId: number;
  role: "owner" | "shop_worker";
  isActive: boolean;
  joinedAt: string;
  user?: User;
}

export interface Product {
  id: number;
  barcode?: string | null;
  name: string;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  mrp: number; // in paise
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  createdBy?: number | null;
  createdAt: string;
}

export interface ShopProduct {
  id: number;
  shopId: number;
  productId: number;
  unitPrice: number; // in paise
  isActive: boolean;
  product: Product;
}

export interface BillItem {
  id: number;
  billId: number;
  shopProductId: number;
  unitPrice: number; // in paise
  quantity: number;
  productName?: string;
  barcode?: string;
}

export interface Bill {
  id: number;
  shopId: number;
  billNumber: string;
  createdBy: number | null;
  totalPrice: number; // in paise
  notes: string | null;
  templetUsed: string;
  status: "active" | "cancelled";
  createdAt: string;
  items?: BillItem[];
  cashierName?: string;
}

export interface StaffRequest {
  id: number;
  shopId: number;
  requestedBy: number;
  requestedTo: number;
  role: "owner" | "shop_worker";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  shopName?: string;
  requesterName?: string;
  receiverEmail?: string;
  receiverName?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Client-side Mock Mode Tracker
let isMockModeActive = false;

export function isMockMode(): boolean {
  if (typeof window !== "undefined") {
    return (window as any).__isMockMode || isMockModeActive;
  }
  return isMockModeActive;
}

function setMockMode(active: boolean) {
  isMockModeActive = active;
  if (typeof window !== "undefined") {
    (window as any).__isMockMode = active;
    // Dispatch a custom event to notify listeners (e.g. status indicator)
    window.dispatchEvent(new Event("mockModeChange"));
  }
}

// --- MOCK DATABASE ---
const mockUser: User = {
  id: 99,
  clerkId: "mock_clerk_id",
  email: "kushal@onbillo.com",
  phone: "+91 9876543210",
  name: "Kushal Kambar",
  role: "app_admin",
  isPremium: true,
  isBanned: false,
  createdAt: new Date().toISOString(),
};

const mockShops: Shop[] = [
  {
    id: 1,
    createdBy: 99,
    name: "Kambar Groceries",
    gstNumber: "29AAAAA0000A1Z1",
    addressLine1: "123 Market Road, Koramangala",
    addressLine2: "4th Block",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
    phone: "+91 8023456789",
    email: "info@kambargroceries.com",
    logoUrl: null,
    currency: "rupees",
    taxType: "gst_inclusive",
    taxRate: "18.00",
    invoiceTemplet: "1",
    invoicePrefix: "INV-KAMBAR-",
    invoiceCounter: 142,
    footerText: "Thank you for shopping at Kambar Groceries! Visit again.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    createdBy: 101,
    name: "Corner Cafe & Bakery",
    gstNumber: "29BBBBB1111B2Z2",
    addressLine1: "45 HSR Layout, Sector 3",
    addressLine2: "Opposite HDFC Bank",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560102",
    phone: "+91 8098765432",
    email: "contact@cornercafe.com",
    logoUrl: null,
    currency: "rupees",
    taxType: "gst_exclusive",
    taxRate: "5.00",
    invoiceTemplet: "2",
    invoicePrefix: "CCB/",
    invoiceCounter: 89,
    footerText: "Hope you enjoyed our fresh bakes!",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const mockShopMembers: Record<number, ShopMember[]> = {
  1: [
    { id: 1, shopId: 1, userId: 99, role: "owner", isActive: true, joinedAt: new Date().toISOString(), user: mockUser }
  ],
  2: [
    { id: 2, shopId: 2, userId: 99, role: "shop_worker", isActive: true, joinedAt: new Date().toISOString(), user: mockUser },
    { id: 3, shopId: 2, userId: 101, role: "owner", isActive: true, joinedAt: new Date().toISOString(), user: { ...mockUser, id: 101, email: "owner@cafe.com", name: "Ananya Sharma", role: "user" } }
  ]
};

const mockGlobalProducts: Product[] = [
  { id: 1, barcode: "8901058002315", name: "Maggi 2-Min Masala Noodles", brand: "Nestle", category: "Packaged Foods", mrp: 3000, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: 2, barcode: "5449000000996", name: "Coca-Cola Classic Can 300ml", brand: "Coca-Cola", category: "Beverages", mrp: 4000, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: 3, barcode: "8901058860229", name: "Tata Salt Iodized 1kg", brand: "Tata", category: "Pantry Staples", mrp: 2800, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: 4, barcode: "8901063015423", name: "Britannia Marie Gold Biscuits 250g", brand: "Britannia", category: "Snacks", mrp: 3500, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: 5, barcode: "8901262010045", name: "Amul Butter Pasteurised 100g", brand: "Amul", category: "Dairy", mrp: 5600, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: 6, barcode: "8901030753068", name: "Surf Excel Easy Wash Detergent 1kg", brand: "Unilever", category: "Household", mrp: 14000, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: 7, barcode: "8901396326524", name: "Dettol Liquid Handwash Refill 200ml", brand: "Reckitt", category: "Personal Care", mrp: 9900, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: 8, barcode: "8901725181222", name: "Aashirvaad Shudh Chakki Atta 5kg", brand: "ITC", category: "Pantry Staples", mrp: 26000, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: 9, barcode: "8906007281354", name: "Fortune Kachi Ghani Mustard Oil 1L", brand: "Adani Wilmar", category: "Pantry Staples", mrp: 17500, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: 10, barcode: "8901356002048", name: "Parle-G Gluco Biscuits 800g", brand: "Parle", category: "Snacks", mrp: 8000, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: 11, barcode: "8901030818279", name: "Red Label Tea 500g", brand: "Brooke Bond", category: "Beverages", mrp: 19500, status: "pending", rejectionReason: null, createdBy: 99, createdAt: new Date().toISOString() },
];

const mockShopProducts: Record<number, ShopProduct[]> = {
  1: [
    { id: 1, shopId: 1, productId: 1, unitPrice: 2800, isActive: true, product: mockGlobalProducts[0] },
    { id: 2, shopId: 1, productId: 2, unitPrice: 3800, isActive: true, product: mockGlobalProducts[1] },
    { id: 3, shopId: 1, productId: 3, unitPrice: 2700, isActive: true, product: mockGlobalProducts[2] },
    { id: 4, shopId: 1, productId: 5, unitPrice: 5400, isActive: true, product: mockGlobalProducts[4] },
    { id: 5, shopId: 1, productId: 8, unitPrice: 25000, isActive: true, product: mockGlobalProducts[7] },
    { id: 6, shopId: 1, productId: 10, unitPrice: 7800, isActive: false, product: mockGlobalProducts[9] },
  ],
  2: [
    { id: 7, shopId: 2, productId: 2, unitPrice: 4500, isActive: true, product: mockGlobalProducts[1] },
    { id: 8, shopId: 2, productId: 5, unitPrice: 6000, isActive: true, product: mockGlobalProducts[4] },
  ]
};

const mockBills: Record<number, Bill[]> = {
  1: [
    {
      id: 1001,
      shopId: 1,
      billNumber: "INV-KAMBAR-140",
      createdBy: 99,
      totalPrice: 10800,
      notes: "Regular customer",
      templetUsed: "1",
      status: "active",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      cashierName: "Kushal Kambar",
      items: [
        { id: 1, billId: 1001, shopProductId: 1, unitPrice: 2800, quantity: 2, productName: "Maggi 2-Min Masala Noodles" },
        { id: 2, billId: 1001, shopProductId: 2, unitPrice: 3800, quantity: 1, productName: "Coca-Cola Classic Can 300ml" },
        { id: 3, billId: 1001, shopProductId: 3, unitPrice: 2700, quantity: 1, productName: "Tata Salt Iodized 1kg" },
      ]
    },
    {
      id: 1002,
      shopId: 1,
      billNumber: "INV-KAMBAR-141",
      createdBy: 99,
      totalPrice: 50000,
      notes: "Festival package",
      templetUsed: "1",
      status: "active",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      cashierName: "Kushal Kambar",
      items: [
        { id: 4, billId: 1002, shopProductId: 8, unitPrice: 25000, quantity: 2, productName: "Aashirvaad Shudh Chakki Atta 5kg" },
      ]
    }
  ],
  2: []
};

const mockStaffRequests: StaffRequest[] = [
  { id: 1, shopId: 2, requestedBy: 101, requestedTo: 99, role: "shop_worker", status: "pending", createdAt: new Date().toISOString(), shopName: "Corner Cafe & Bakery", requesterName: "Ananya Sharma" }
];

const mockAdminUsers: User[] = [
  mockUser,
  { id: 101, clerkId: "clerk_101", email: "ananya@cornercafe.com", phone: "+91 9988776655", name: "Ananya Sharma", role: "user", isPremium: false, isBanned: false, createdAt: new Date().toISOString() },
  { id: 102, clerkId: "clerk_102", email: "worker@kambar.com", phone: null, name: "Rahul Kumar", role: "user", isPremium: false, isBanned: false, createdAt: new Date().toISOString() },
  { id: 103, clerkId: "clerk_103", email: "spammer@bad.com", phone: "+91 9000000000", name: "Suresh Spammer", role: "user", isPremium: false, isBanned: true, createdAt: new Date().toISOString() }
];

// --- API FETCH UTILITY WITH RESILIENT FALLBACK ---
async function apiRequest(path: string, token: string | null, options: RequestInit = {}): Promise<any> {
  if (isMockMode()) {
    throw new Error("Force mock mode");
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Content-Type", "application/json");

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `API Error: Status ${res.status}`);
    }

    setMockMode(false); // API call succeeded, make sure mock mode is disabled
    return await res.json();
  } catch (error) {
    console.warn(`NestJS API call failed for ${path}. Engaging resilient Mock Mode.`, error);
    setMockMode(true);
    throw error;
  }
}

// --- CONTROLLERS IMPLEMENTATION ---

export const usersApi = {
  getMe: async (token: string | null): Promise<User> => {
    try {
      return await apiRequest("/api/users/me", token);
    } catch {
      return mockUser;
    }
  },
  updateProfile: async (token: string | null, name: string, phone: string): Promise<User> => {
    try {
      // Backend only updates phone, so we call backend and mock update locally if needed
      await apiRequest("/api/users/me", token, {
        method: "PUT",
        body: JSON.stringify({ phone }),
      });
      mockUser.name = name;
      mockUser.phone = phone;
      return mockUser;
    } catch {
      mockUser.name = name;
      mockUser.phone = phone;
      return mockUser;
    }
  }
};

export const shopsApi = {
  getUserShops: async (token: string | null): Promise<{ shop: Shop; role: "owner" | "shop_worker" }[]> => {
    try {
      return await apiRequest("/api/shops", token);
    } catch {
      return mockShops.map(shop => ({
        shop,
        role: (mockShopMembers[shop.id]?.find(m => m.userId === mockUser.id)?.role || "shop_worker") as any
      }));
    }
  },
  getShop: async (token: string | null, shopId: number): Promise<Shop> => {
    try {
      return await apiRequest(`/api/shops/${shopId}`, token);
    } catch {
      const shop = mockShops.find(s => s.id === shopId);
      if (!shop) throw new Error("Shop not found");
      return shop;
    }
  },
  createShop: async (token: string | null, data: any): Promise<Shop> => {
    try {
      return await apiRequest("/api/shops", token, {
        method: "POST",
        body: JSON.stringify(data),
      });
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
      return await apiRequest(`/api/shops/${shopId}`, token, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch {
      const index = mockShops.findIndex(s => s.id === shopId);
      if (index === -1) throw new Error("Shop not found");
      mockShops[index] = { ...mockShops[index], ...data, updatedAt: new Date().toISOString() };
      return mockShops[index];
    }
  },
  getMembers: async (token: string | null, shopId: number): Promise<ShopMember[]> => {
    try {
      // Backend routing: staff is managed in staff controller
      return await apiRequest(`/api/staff/shop/${shopId}`, token);
    } catch {
      return mockShopMembers[shopId] || [];
    }
  }
};

export const productsApi = {
  getShopProducts: async (token: string | null, shopId: number): Promise<ShopProduct[]> => {
    try {
      return await apiRequest(`/api/products/shop/${shopId}`, token);
    } catch {
      return mockShopProducts[shopId] || [];
    }
  },
  searchGlobalProducts: async (token: string | null, query: string): Promise<Product[]> => {
    try {
      return await apiRequest(`/api/products/search?q=${encodeURIComponent(query)}`, token);
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
      return await apiRequest(`/api/products/shop/${shopId}/add`, token, {
        method: "POST",
        body: JSON.stringify({ productId, unitPrice }),
      });
    } catch {
      const prod = mockGlobalProducts.find(p => p.id === productId);
      if (!prod) throw new Error("Global product not found");

      // Check if already in shop
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
      return await apiRequest(`/api/products/shop/${shopId}/product/${shopProductId}`, token, {
        method: "PUT",
        body: JSON.stringify(data),
      });
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
      return await apiRequest("/api/products/global", token, {
        method: "POST",
        body: JSON.stringify(data),
      });
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

export const billsApi = {
  getShopBills: async (token: string | null, shopId: number): Promise<Bill[]> => {
    try {
      return await apiRequest(`/api/bills/shop/${shopId}`, token);
    } catch {
      return mockBills[shopId] || [];
    }
  },
  createBill: async (token: string | null, shopId: number, data: { items: { shopProductId: number; unitPrice: number; quantity: number }[]; notes?: string }): Promise<Bill> => {
    try {
      return await apiRequest(`/api/bills/shop/${shopId}`, token, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {
      const shop = mockShops.find(s => s.id === shopId);
      if (!shop) throw new Error("Shop not found");

      const counter = shop.invoiceCounter;
      shop.invoiceCounter += 1;

      const billNum = `${shop.invoicePrefix}${counter}`;
      let grandTotal = 0;

      const billItems: BillItem[] = data.items.map((item, idx) => {
        const shopProd = mockShopProducts[shopId]?.find(sp => sp.id === item.shopProductId);
        grandTotal += item.unitPrice * item.quantity;
        return {
          id: Date.now() + idx,
          billId: Date.now(),
          shopProductId: item.shopProductId,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          productName: shopProd?.product.name || "Unknown Product",
          barcode: shopProd?.product.barcode || undefined
        };
      });

      const newBill: Bill = {
        id: Date.now(),
        shopId,
        billNumber: billNum,
        createdBy: mockUser.id,
        totalPrice: grandTotal,
        notes: data.notes || null,
        templetUsed: shop.invoiceTemplet,
        status: "active",
        createdAt: new Date().toISOString(),
        cashierName: mockUser.name,
        items: billItems
      };

      if (!mockBills[shopId]) mockBills[shopId] = [];
      mockBills[shopId].unshift(newBill);
      return newBill;
    }
  },
  voidBill: async (token: string | null, shopId: number, billId: number): Promise<Bill> => {
    try {
      return await apiRequest(`/api/bills/shop/${shopId}/${billId}/void`, token, {
        method: "PUT",
      });
    } catch {
      const list = mockBills[shopId] || [];
      const bill = list.find(b => b.id === billId);
      if (!bill) throw new Error("Bill not found");
      bill.status = "cancelled";
      return bill;
    }
  }
};

export const staffApi = {
  getPendingInvites: async (token: string | null): Promise<StaffRequest[]> => {
    try {
      return await apiRequest("/api/staff/invites", token);
    } catch {
      return mockStaffRequests.filter(req => req.requestedTo === mockUser.id && req.status === "pending");
    }
  },
  respondToInvite: async (token: string | null, requestId: number, accept: boolean): Promise<any> => {
    try {
      return await apiRequest(`/api/staff/invites/${requestId}`, token, {
        method: "PUT",
        body: JSON.stringify({ status: accept ? "accepted" : "rejected" }),
      });
    } catch {
      const idx = mockStaffRequests.findIndex(r => r.id === requestId);
      if (idx === -1) throw new Error("Invite not found");
      const req = mockStaffRequests[idx];
      req.status = accept ? "accepted" : "rejected";

      if (accept) {
        // Add user as shop member
        if (!mockShopMembers[req.shopId]) mockShopMembers[req.shopId] = [];
        mockShopMembers[req.shopId].push({
          id: Date.now(),
          shopId: req.shopId,
          userId: mockUser.id,
          role: req.role,
          isActive: true,
          joinedAt: new Date().toISOString(),
          user: mockUser
        });
        
        // Add to mockShops list if not already there (simulating join)
        const shopToAdd = mockShops.find(s => s.id === req.shopId);
        if (shopToAdd && !mockShops.some(s => s.id === req.shopId)) {
          mockShops.push(shopToAdd);
        }
      }

      mockStaffRequests.splice(idx, 1);
      return { success: true };
    }
  },
  sendInvite: async (token: string | null, shopId: number, email: string, role: "owner" | "shop_worker"): Promise<StaffRequest> => {
    try {
      return await apiRequest(`/api/staff/shop/${shopId}/invite`, token, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
    } catch {
      // Find receiver in mock users
      const receiver = mockAdminUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!receiver) throw new Error("User with this email not found in Onbillo database.");

      const newInvite: StaffRequest = {
        id: Date.now(),
        shopId,
        requestedBy: mockUser.id,
        requestedTo: receiver.id,
        role,
        status: "pending",
        createdAt: new Date().toISOString(),
        shopName: mockShops.find(s => s.id === shopId)?.name || "Shop",
        requesterName: mockUser.name,
        receiverEmail: receiver.email,
        receiverName: receiver.name
      };
      
      mockStaffRequests.push(newInvite);
      return newInvite;
    }
  },
  removeStaff: async (token: string | null, shopId: number, memberId: number): Promise<any> => {
    try {
      return await apiRequest(`/api/staff/shop/${shopId}/member/${memberId}`, token, {
        method: "DELETE",
      });
    } catch {
      const list = mockShopMembers[shopId] || [];
      const idx = list.findIndex(m => m.id === memberId);
      if (idx === -1) throw new Error("Staff member not found");
      list.splice(idx, 1);
      return { success: true };
    }
  }
};

export const adminApi = {
  getStats: async (token: string | null): Promise<any> => {
    try {
      return await apiRequest("/api/admin/stats", token); // custom endpoint or aggregate
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
      return await apiRequest("/api/admin/users", token);
    } catch {
      return mockAdminUsers;
    }
  },
  togglePremium: async (token: string | null, userId: number, isPremium: boolean): Promise<User> => {
    try {
      return await apiRequest(`/api/admin/users/${userId}/premium`, token, {
        method: "PUT",
        body: JSON.stringify({ isPremium }),
      });
    } catch {
      const user = mockAdminUsers.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      user.isPremium = isPremium;
      return user;
    }
  },
  toggleBan: async (token: string | null, userId: number, isBanned: boolean): Promise<User> => {
    try {
      return await apiRequest(`/api/admin/users/${userId}/ban`, token, {
        method: "PUT",
        body: JSON.stringify({ isBanned }),
      });
    } catch {
      const user = mockAdminUsers.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      user.isBanned = isBanned;
      return user;
    }
  },
  listShops: async (token: string | null): Promise<Shop[]> => {
    try {
      return await apiRequest("/api/admin/shops", token);
    } catch {
      return mockShops;
    }
  },
  listPendingProducts: async (token: string | null): Promise<Product[]> => {
    try {
      return await apiRequest("/api/admin/products/pending", token);
    } catch {
      return mockGlobalProducts.filter(p => p.status === "pending");
    }
  },
  approveProduct: async (token: string | null, productId: number): Promise<Product> => {
    try {
      return await apiRequest(`/api/admin/products/${productId}/approve`, token, {
        method: "PUT",
      });
    } catch {
      const prod = mockGlobalProducts.find(p => p.id === productId);
      if (!prod) throw new Error("Product not found");
      prod.status = "approved";
      return prod;
    }
  },
  rejectProduct: async (token: string | null, productId: number, reason: string): Promise<Product> => {
    try {
      return await apiRequest(`/api/admin/products/${productId}/reject`, token, {
        method: "PUT",
        body: JSON.stringify({ reason }),
      });
    } catch {
      const prod = mockGlobalProducts.find(p => p.id === productId);
      if (!prod) throw new Error("Product not found");
      prod.status = "rejected";
      prod.rejectionReason = reason;
      return prod;
    }
  }
};
