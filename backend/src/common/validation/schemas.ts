import { z } from 'zod';

// Helper Regex Patterns
// Phone: 7-20 chars, optional + followed by digits, dashes, spaces, parentheses
export const PhoneSchema = z
  .string()
  .min(7, 'Phone number must be at least 7 characters')
  .max(20, 'Phone number must be at most 20 characters')
  .regex(/^[+\d][- \d()]*$/, 'Phone number contains invalid characters');

// Email: Standard email validation, max 255 chars
export const EmailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must be at most 255 characters');

// Pincode: 3-20 chars, alphanumeric, dashes, spaces
export const PincodeSchema = z
  .string()
  .min(3, 'Pincode must be at least 3 characters')
  .max(20, 'Pincode must be at most 20 characters')
  .regex(/^[a-zA-Z0-9\-\s]+$/, 'Pincode contains invalid characters');

// Numeric Path Parameter Schema (for ids)
export const IdParamSchema = z
  .string()
  .regex(/^\d+$/, 'ID must be a numeric string')
  .transform(Number);

// Barcode: 1-255 characters, alphanumeric, dashes, underscores
export const BarcodeSchema = z
  .string()
  .min(1, 'Barcode cannot be empty')
  .max(255, 'Barcode must be at most 255 characters')
  .regex(
    /^[a-zA-Z0-9\-_]+$/,
    'Barcode must contain only alphanumeric characters, dashes, or underscores',
  );

// Search Query: 0-100 characters, alphanumeric, spaces, dots, dashes, underscores
export const SearchQuerySchema = z
  .string()
  .max(100, 'Search query must be at most 100 characters')
  .regex(/^[a-zA-Z0-9\s.\-_]*$/, 'Search query contains invalid characters')
  .optional();

// --- DTO SCHEMAS ---

// UsersController
export const UpdateMeSchema = z.object({
  phone: PhoneSchema,
});

// ShopsController
export const CreateShopSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters')
    .regex(
      /^[a-zA-Z0-9\s.,\-\/()#&'+:@!_]+$/,
      'Name contains invalid characters',
    ),
  gstNumber: z
    .string()
    .min(5, 'GST number must be at least 5 characters')
    .max(50, 'GST number must be at most 50 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'GST number must be alphanumeric')
    .optional()
    .nullable(),
  addressLine1: z
    .string()
    .min(1, 'Address Line 1 is required')
    .max(500, 'Address Line 1 must be at most 500 characters')
    .regex(
      /^[a-zA-Z0-9\s.,\-\/()#&'+:@!_\r\n]+$/,
      'Address contains invalid characters',
    ),
  addressLine2: z
    .string()
    .max(500, 'Address Line 2 must be at most 500 characters')
    .regex(
      /^[a-zA-Z0-9\s.,\-\/()#&'+:@!_\r\n]+$/,
      'Address contains invalid characters',
    )
    .optional()
    .nullable(),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be at most 100 characters')
    .regex(/^[a-zA-Z\s.-]+$/, 'City contains invalid characters'),
  state: z
    .string()
    .min(1, 'State is required')
    .max(100, 'State must be at most 100 characters')
    .regex(/^[a-zA-Z\s.-]+$/, 'State contains invalid characters'),
  pincode: PincodeSchema,
  phone: PhoneSchema.optional().nullable(),
  email: EmailSchema.optional().nullable(),
  logoUrl: z.string().url('Invalid logo URL').max(1000).optional().nullable(),
  currency: z.enum(['rupees']).optional(),
  taxType: z.enum(['gst_inclusive', 'gst_exclusive', 'no_tax']).optional(),
  taxRate: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Tax rate must be a valid decimal number')
    .optional(),
  invoiceTemplet: z.enum(['1', '2', '3', '4', '5']).optional(),
  invoicePrefix: z
    .string()
    .max(20)
    .regex(/^[a-zA-Z0-9\-_\/]+$/, 'Invoice prefix contains invalid characters')
    .optional(),
  footerText: z
    .string()
    .max(1000)
    .regex(
      /^[a-zA-Z0-9\s.,\-\/()#&'+:@!_\r\n]*$/,
      'Footer text contains invalid characters',
    )
    .optional()
    .nullable(),
});

export const UpdateShopSchema = CreateShopSchema.partial();

// ProductsController
export const CreateProductSchema = z.object({
  barcode: BarcodeSchema.optional().nullable(),
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be at most 255 characters')
    .regex(
      /^[a-zA-Z0-9\s.,\-\/()#&'+:@!_]+$/,
      'Product name contains invalid characters',
    ),
  brand: z
    .string()
    .max(255, 'Brand must be at most 255 characters')
    .regex(
      /^[a-zA-Z0-9\s.,\-\/()#&'+:@!_]+$/,
      'Brand name contains invalid characters',
    )
    .optional()
    .nullable(),
  category: z
    .string()
    .max(255, 'Category must be at most 255 characters')
    .regex(
      /^[a-zA-Z0-9\s.,\-\/()#&'+:@!_]+$/,
      'Category contains invalid characters',
    )
    .optional()
    .nullable(),
  imageUrl: z.string().url('Invalid image URL').max(1000).optional().nullable(),
  mrp: z
    .number()
    .int('MRP must be in cents/paise (integer)')
    .positive('MRP must be positive'),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const CreateCustomProductSchema = CreateProductSchema.extend({
  unitPrice: z.number().int().positive('Unit price must be positive'),
});


// ShopProductsController
export const CreateShopProductSchema = z.object({
  productId: z.number().int().positive(),
  unitPrice: z.number().int().positive('Unit price must be positive'),
  isActive: z.boolean().optional(),
});

export const UpdateShopProductSchema = CreateShopProductSchema.omit({
  productId: true,
}).partial();

// BillsController
export const CreateBillSchema = z.object({
  notes: z
    .string()
    .max(2000, 'Notes must be at most 2000 characters')
    .regex(
      /^[a-zA-Z0-9\s.,\-\/()#&'+:@!_\r\n]*$/,
      'Notes contain invalid characters',
    )
    .optional()
    .nullable(),
  items: z
    .array(
      z.object({
        shopProductId: z.number().int().positive(),
        unitPrice: z.number().int().positive('Unit price must be positive'),
        quantity: z.number().int().positive('Quantity must be positive'),
      }),
    )
    .min(1, 'At least one item is required'),
});

// StaffController
export const InviteStaffRoleSchema = z.object({
  role: z.enum(['owner', 'shop_worker']),
});

export const InviteStaffByEmailSchema = z.object({
  email: EmailSchema,
  role: z.enum(['owner', 'shop_worker']),
});

// StaffRequestsController
export const RespondToInviteSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

// AdminController
export const TogglePremiumSchema = z.object({
  isPremium: z.boolean(),
});

export const ToggleBanSchema = z.object({
  isBanned: z.boolean(),
});

export const RejectProductSchema = z.object({
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be at most 500 characters')
    .regex(
      /^[a-zA-Z0-9\s.,\-\/()#&'+:@!_\r\n]+$/,
      'Reason contains invalid characters',
    ),
});
