import { z } from "zod";

const nullableString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    if (typeof val === "string") return val.trim();
    return val;
  }, schema.nullable().optional()) as unknown as z.ZodType<z.infer<T> | null>;

const requiredString = (fieldName: string, maxLen = 255, regexPattern?: RegExp, regexMessage?: string) => {
  let baseSchema = z.string({ message: `${fieldName} is required` }).min(1, `${fieldName} is required`);
  if (maxLen) {
    baseSchema = baseSchema.max(maxLen, `${fieldName} must be at most ${maxLen} characters`);
  }
  if (regexPattern && regexMessage) {
    baseSchema = baseSchema.regex(regexPattern, regexMessage);
  }
  return z.preprocess((val) => (typeof val === "string" ? val.trim() : val), baseSchema);
};

// --- BASE SCHEMAS ---

export const PhoneSchema = z.preprocess((val) => {
  if (typeof val !== "string") return val;
  const cleaned = val.trim();
  const startsWithPlus = cleaned.startsWith("+");
  const digitsOnly = cleaned.replace(/\D/g, "");
  return startsWithPlus ? `+${digitsOnly}` : digitsOnly;
}, z.string()
  .min(7, "Phone number must be at least 7 characters")
  .max(20, "Phone number must be at most 20 characters")
  .regex(/^\+?\d+$/, "Phone number must contain only digits and optional leading +")
) as unknown as z.ZodType<string>;

export const EmailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email must be at most 255 characters");

export const PincodeSchema = z
  .string()
  .min(3, "Pincode must be at least 3 characters")
  .max(20, "Pincode must be at most 20 characters")
  .regex(/^[a-zA-Z0-9\-\s]+$/, "Pincode contains invalid characters");

export const BarcodeSchema = z
  .string()
  .min(1, "Barcode cannot be empty")
  .max(255, "Barcode must be at most 255 characters")
  .regex(/^[a-zA-Z0-9\-_]+$/, "Barcode must contain only alphanumeric characters, dashes, or underscores");

// --- FORM SCHEMAS ---

// 1. User Profile update & Phone Prompt Modal
export const UpdateMeSchema = z.object({
  phone: PhoneSchema,
});

// 2. Shop Onboarding & Settings
export const CreateShopSchema = z.object({
  name: requiredString("Shop Name", 255, /^[a-zA-Z0-9\s.,\-\/()#&'+:@!_]+$/, "Shop Name contains invalid characters"),
  gstNumber: nullableString(
    z.string().min(5, "GST number must be at least 5 characters").max(50).regex(/^[a-zA-Z0-9]+$/, "GST number must be alphanumeric")
  ),
  addressLine1: requiredString("Address Line 1", 500, /^[a-zA-Z0-9\s.,\-\/()#&'+:@!_\r\n]+$/, "Address contains invalid characters"),
  addressLine2: nullableString(
    z.string().max(500).regex(/^[a-zA-Z0-9\s.,\-\/()#&'+:@!_\r\n]+$/, "Address contains invalid characters")
  ),
  city: requiredString("City", 100, /^[a-zA-Z\s.-]+$/, "City contains invalid characters"),
  state: requiredString("State", 100, /^[a-zA-Z\s.-]+$/, "State contains invalid characters"),
  pincode: PincodeSchema,
  phone: nullableString(PhoneSchema),
  email: nullableString(EmailSchema),
  logoUrl: nullableString(z.string().url("Invalid logo URL").max(1000)),
  currency: z.enum(["rupees"]).optional(),
  taxType: z.enum(["gst_inclusive", "gst_exclusive", "no_tax"]).optional(),
  taxRate: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Tax rate must be a valid decimal number")
    .optional(),
  invoiceTemplet: z.enum(["1", "2", "3", "4", "5"]).optional(),
  invoicePrefix: z
    .string()
    .max(20)
    .regex(/^[a-zA-Z0-9\-_\/]+$/, "Invoice prefix contains invalid characters")
    .optional(),
  footerText: nullableString(
    z.string().max(1000).regex(/^[a-zA-Z0-9\s.,\-\/()#&'+:@!_\r\n]*$/, "Footer text contains invalid characters")
  ),
});

export const UpdateShopSchema = CreateShopSchema.partial();

// 3. Staff invitation
export const InviteStaffByEmailSchema = z.object({
  email: EmailSchema,
  role: z.enum(["owner", "shop_worker"]),
});

// 4. Create custom product / new product request
export const CreateCustomProductSchema = z.object({
  barcode: nullableString(BarcodeSchema),
  name: requiredString("Product Name", 255, /^[a-zA-Z0-9\s.,\-\/()#&'+:@!_]+$/, "Product Name contains invalid characters"),
  brand: nullableString(
    z.string().max(255).regex(/^[a-zA-Z0-9\s.,\-\/()#&'+:@!_]+$/, "Brand name contains invalid characters")
  ),
  category: nullableString(
    z.string().max(255).regex(/^[a-zA-Z0-9\s.,\-\/()#&'+:@!_]+$/, "Category name contains invalid characters")
  ),
  imageUrl: nullableString(z.string().url("Invalid image URL").max(1000)),
  mrp: z
    .number({ message: "MRP must be a valid positive number" })
    .int("MRP must be in cents/paise (integer)")
    .positive("MRP must be positive"),
  unitPrice: z
    .number({ message: "Unit price must be a valid positive number" })
    .int()
    .positive("Unit price must be positive"),
});

// --- HELPER VALIDATION FUNCTION ---

export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: any
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const issue = result.error.issues[0];
    let fieldName = issue.path.join(".") || "Input";
    
    // Format fieldName nicely (e.g. gstNumber -> GST Number, addressLine1 -> Address Line 1)
    fieldName = fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace("Gst", "GST")
      .trim();

    return {
      success: false,
      error: `${fieldName}: ${issue.message}`,
    };
  }
}
