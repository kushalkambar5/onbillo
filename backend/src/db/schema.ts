import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  pgEnum,
  unique,
  index,
} from 'drizzle-orm/pg-core';

// --- ENUMS ---
export const userRoleEnum = pgEnum('user_role', ['app_admin', 'user']);
export const currencyEnum = pgEnum('currency', ['rupees']);
export const taxTypeEnum = pgEnum('tax_type', [
  'gst_inclusive',
  'gst_exclusive',
  'no_tax',
]);
export const invoiceTempletEnum = pgEnum('invoice_templet', [
  '1',
  '2',
  '3',
  '4',
  '5',
]);
export const shopMemberRoleEnum = pgEnum('shop_member_role', [
  'owner',
  'shop_worker',
]);
export const productStatusEnum = pgEnum('product_status', [
  'pending',
  'approved',
  'rejected',
]);
export const billStatusEnum = pgEnum('bill_status', ['active', 'cancelled']);
export const staffRequestStatusEnum = pgEnum('request_status', [
  'pending',
  'accepted',
  'rejected',
]);

// --- TABLES ---

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  isPremium: boolean('is_premium').default(false).notNull(),
  isBanned: boolean('is_banned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const shops = pgTable('shops', {
  id: serial('id').primaryKey(),
  createdBy: integer('created_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  name: varchar('name', { length: 255 }).notNull(),
  gstNumber: varchar('gst_number', { length: 50 }),
  addressLine1: text('address_line_1').notNull(),
  addressLine2: text('address_line_2'),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 20 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  logoUrl: text('logo_url'),
  currency: currencyEnum('currency').default('rupees').notNull(),
  taxType: taxTypeEnum('tax_type').default('no_tax').notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 })
    .default('0.00')
    .notNull(),
  invoiceTemplet: invoiceTempletEnum('invoice_templet').default('1').notNull(),
  invoicePrefix: varchar('invoice_prefix', { length: 20 })
    .default('INV/')
    .notNull(),
  invoiceCounter: integer('invoice_counter').default(1).notNull(),
  footerText: text('footer_text'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const shopMembers = pgTable('shop_members', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: shopMemberRoleEnum('role').default('shop_worker').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    barcode: varchar('barcode', { length: 255 }).unique(),
    name: varchar('name', { length: 255 }).notNull(),
    brand: varchar('brand', { length: 255 }),
    category: varchar('category', { length: 255 }),
    imageUrl: text('image_url'),
    // Stored in paise/cents to avoid floating-point math errors
    mrp: integer('mrp').notNull(),
    status: productStatusEnum('status').default('pending').notNull(),
    rejectionReason: text('rejection_reason'),
    createdBy: integer('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    barcodeIdx: index('barcode_idx').on(table.barcode),
  }),
);

export const shopProducts = pgTable(
  'shop_products',
  {
    id: serial('id').primaryKey(),
    shopId: integer('shop_id')
      .references(() => shops.id, { onDelete: 'cascade' })
      .notNull(),
    productId: integer('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    // Stored in paise/cents
    unitPrice: integer('unit_price').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    shopProductIdx: index('shop_product_idx').on(table.shopId, table.productId),
  }),
);

export const bills = pgTable(
  'bills',
  {
    id: serial('id').primaryKey(),
    shopId: integer('shop_id')
      .references(() => shops.id, { onDelete: 'cascade' })
      .notNull(),
    billNumber: varchar('bill_number', { length: 100 }).notNull(),
    createdBy: integer('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    totalPrice: integer('total_price').notNull(),
    notes: text('notes'),
    templetUsed: invoiceTempletEnum('templet_used').default('1').notNull(),
    status: billStatusEnum('status').default('active').notNull(),
    // localId is completely removed
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    createdAtIndex: index('created_at_idx').on(table.createdAt),
    shopIdIndex: index('bills_shop_id_idx').on(table.shopId),
    // The offline dedup unique constraint is removed, keeping only the invoice integrity one:
    uniqueInvoice: unique('unique_invoice').on(table.shopId, table.billNumber),
  }),
);

export const billItems = pgTable('bill_items', {
  id: serial('id').primaryKey(),
  billId: integer('bill_id')
    .references(() => bills.id, { onDelete: 'cascade' })
    .notNull(),
  shopProductId: integer('shop_product_id')
    .references(() => shopProducts.id)
    .notNull(),
  // Static snapshot stored in paise/cents
  unitPrice: integer('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
});

export const staffRequests = pgTable(
  'staff_requests',
  {
    id: serial('id').primaryKey(),
    shopId: integer('shop_id')
      .references(() => shops.id, { onDelete: 'cascade' })
      .notNull(),
    requestedBy: integer('requested_by')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    requestedTo: integer('requested_to')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    role: shopMemberRoleEnum('role').default('shop_worker').notNull(),
    status: staffRequestStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Optional: Index to quickly find pending requests for a specific user
    requestedToIndex: index('requested_to_idx').on(table.requestedTo),
    uniqueShopRequestedTo: unique('unique_shop_requested_to').on(
      table.shopId,
      table.requestedTo,
    ),
  }),
);
