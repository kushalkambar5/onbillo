export interface User {
  id: string;
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
  id: string;
  createdBy: string | null;
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
  id: string;
  shopId: string;
  userId: string;
  role: "owner" | "shop_worker";
  isActive: boolean;
  joinedAt: string;
  user?: User;
}

export interface Product {
  id: string;
  barcode?: string | null;
  name: string;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  mrp: number; // in paise
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface ShopProduct {
  id: string;
  shopId: string;
  productId: string;
  unitPrice: number; // in paise
  isActive: boolean;
  product: Product;
}

export interface BillItem {
  id: string;
  billId: string;
  shopProductId: string;
  unitPrice: number; // in paise
  quantity: number;
  productName?: string;
  barcode?: string;
}

export interface Bill {
  id: string;
  shopId: string;
  billNumber: string;
  createdBy: string | null;
  totalPrice: number; // in paise
  notes: string | null;
  templetUsed: string;
  status: "active" | "cancelled";
  createdAt: string;
  items?: BillItem[];
  cashierName?: string;
}

export interface StaffRequest {
  id: string;
  shopId: string;
  requestedBy: string;
  requestedTo: string;
  role: "owner" | "shop_worker";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  shopName?: string;
  requesterName?: string;
  receiverEmail?: string;
  receiverName?: string;
}
