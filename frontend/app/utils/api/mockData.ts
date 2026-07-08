import { User, Shop, ShopMember, Product, ShopProduct, Bill, StaffRequest } from "./types";

export const mockUser: User = {
  id: "99",
  clerkId: "mock_clerk_id",
  email: "kushal@onbillo.com",
  phone: "+91 9876543210",
  name: "Kushal Kambar",
  role: "app_admin",
  isPremium: true,
  isBanned: false,
  createdAt: new Date().toISOString(),
};

export const mockShops: Shop[] = [
  {
    id: "1",
    createdBy: "99",
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
    id: "2",
    createdBy: "101",
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

export const mockShopMembers: Record<string, ShopMember[]> = {
  "1": [
    { id: "1", shopId: "1", userId: "99", role: "owner", isActive: true, joinedAt: new Date().toISOString(), user: mockUser }
  ],
  "2": [
    { id: "2", shopId: "2", userId: "99", role: "shop_worker", isActive: true, joinedAt: new Date().toISOString(), user: mockUser },
    { id: "3", shopId: "2", userId: "101", role: "owner", isActive: true, joinedAt: new Date().toISOString(), user: { ...mockUser, id: "101", email: "owner@cafe.com", name: "Ananya Sharma", role: "user" } }
  ]
};

export const mockGlobalProducts: Product[] = [
  { id: "1", barcode: "8901058002315", name: "Maggi 2-Min Masala Noodles", brand: "Nestle", category: "Packaged Foods", mrp: 3000, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: "2", barcode: "5449000000996", name: "Coca-Cola Classic Can 300ml", brand: "Coca-Cola", category: "Beverages", mrp: 4000, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: "3", barcode: "8901058860229", name: "Tata Salt Iodized 1kg", brand: "Tata", category: "Pantry Staples", mrp: 2800, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: "4", barcode: "8901063015423", name: "Britannia Marie Gold Biscuits 250g", brand: "Britannia", category: "Snacks", mrp: 3500, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: "5", barcode: "8901262010045", name: "Amul Butter Pasteurised 100g", brand: "Amul", category: "Dairy", mrp: 5600, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: "6", barcode: "8901030753068", name: "Surf Excel Easy Wash Detergent 1kg", brand: "Unilever", category: "Household", mrp: 14000, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: "7", barcode: "8901396326524", name: "Dettol Liquid Handwash Refill 200ml", brand: "Reckitt", category: "Personal Care", mrp: 9900, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: "8", barcode: "8901725181222", name: "Aashirvaad Shudh Chakki Atta 5kg", brand: "ITC", category: "Pantry Staples", mrp: 26000, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: "9", barcode: "8906007281354", name: "Fortune Kachi Ghani Mustard Oil 1L", brand: "Adani Wilmar", category: "Pantry Staples", mrp: 17500, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: "10", barcode: "8901356002048", name: "Parle-G Gluco Biscuits 800g", brand: "Parle", category: "Snacks", mrp: 8000, status: "approved", rejectionReason: null, createdBy: null, createdAt: new Date().toISOString() },
  { id: "11", barcode: "8901030818279", name: "Red Label Tea 500g", brand: "Brooke Bond", category: "Beverages", mrp: 19500, status: "pending", rejectionReason: null, createdBy: "99", createdAt: new Date().toISOString() },
];

export const mockShopProducts: Record<string, ShopProduct[]> = {
  "1": [
    { id: "1", shopId: "1", productId: "1", unitPrice: 2800, isActive: true, product: mockGlobalProducts[0] },
    { id: "2", shopId: "1", productId: "2", unitPrice: 3800, isActive: true, product: mockGlobalProducts[1] },
    { id: "3", shopId: "1", productId: "3", unitPrice: 2700, isActive: true, product: mockGlobalProducts[2] },
    { id: "4", shopId: "1", productId: "5", unitPrice: 5400, isActive: true, product: mockGlobalProducts[4] },
    { id: "5", shopId: "1", productId: "8", unitPrice: 25000, isActive: true, product: mockGlobalProducts[7] },
    { id: "6", shopId: "1", productId: "10", unitPrice: 7800, isActive: false, product: mockGlobalProducts[9] },
  ],
  "2": [
    { id: "7", shopId: "2", productId: "2", unitPrice: 4500, isActive: true, product: mockGlobalProducts[1] },
    { id: "8", shopId: "2", productId: "5", unitPrice: 6000, isActive: true, product: mockGlobalProducts[4] },
  ]
};

export const mockBills: Record<string, Bill[]> = {
  "1": [
    {
      id: "1001",
      shopId: "1",
      billNumber: "INV-KAMBAR-140",
      createdBy: "99",
      totalPrice: 10800,
      notes: "Regular customer",
      templetUsed: "1",
      status: "active",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      cashierName: "Kushal Kambar",
      items: [
        { id: "1", billId: "1001", shopProductId: "1", unitPrice: 2800, quantity: 2, productName: "Maggi 2-Min Masala Noodles" },
        { id: "2", billId: "1001", shopProductId: "2", unitPrice: 3800, quantity: 1, productName: "Coca-Cola Classic Can 300ml" },
        { id: "3", billId: "1001", shopProductId: "3", unitPrice: 2700, quantity: 1, productName: "Tata Salt Iodized 1kg" },
      ]
    },
    {
      id: "1002",
      shopId: "1",
      billNumber: "INV-KAMBAR-141",
      createdBy: "99",
      totalPrice: 50000,
      notes: "Festival package",
      templetUsed: "1",
      status: "active",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      cashierName: "Kushal Kambar",
      items: [
        { id: "4", billId: "1002", shopProductId: "8", unitPrice: 25000, quantity: 2, productName: "Aashirvaad Shudh Chakki Atta 5kg" },
      ]
    }
  ],
  "2": []
};

export const mockStaffRequests: StaffRequest[] = [
  { id: "1", shopId: "2", requestedBy: "101", requestedTo: "99", role: "shop_worker", status: "pending", createdAt: new Date().toISOString(), shopName: "Corner Cafe & Bakery", requesterName: "Ananya Sharma" }
];

export const mockAdminUsers: User[] = [
  mockUser,
  { id: "101", clerkId: "clerk_101", email: "ananya@cornercafe.com", phone: "+91 9988776655", name: "Ananya Sharma", role: "user", isPremium: false, isBanned: false, createdAt: new Date().toISOString() },
  { id: "102", clerkId: "clerk_102", email: "worker@kambar.com", phone: null, name: "Rahul Kumar", role: "user", isPremium: false, isBanned: false, createdAt: new Date().toISOString() },
  { id: "103", clerkId: "clerk_103", email: "spammer@bad.com", phone: "+91 9000000000", name: "Suresh Spammer", role: "user", isPremium: false, isBanned: true, createdAt: new Date().toISOString() }
];
