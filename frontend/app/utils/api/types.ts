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
