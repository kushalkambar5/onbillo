"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { shopsApi, Shop } from "../../../utils/api";
import { CreateShopSchema, UpdateShopSchema, validateSchema } from "../../../utils/validation";
import { mockShops } from "../../../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
import DevMockModeIndicator from "../../../components/DevMockModeIndicator";
import LogoUploadAndCrop from "../../../components/LogoUploadAndCrop";
import ThermalReceipt from "../../../components/ThermalReceipt";
import OnbilloReceipt from "../../../components/templates/3InchPrints/OnbilloReceipt";
import OnbilloBill from "../../../components/templates/3InchPrints/OnbilloBill";
import OnbilloInvoice from "../../../components/templates/3InchPrints/OnbilloInvoice";
import RaintechBill from "../../../components/templates/3InchPrints/RaintechBill";
import RaintechReceipt from "../../../components/templates/3InchPrints/RaintechReceipt";
import RaintechA4Invoice from "../../../components/templates/A4Prints/RaintechA4Invoice";

export default function ShopSettings({
  params: paramsPromise,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const params = use(paramsPromise);
  const shopId = params.shopId;
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formData, setFormData] = useState({
    name: "",
    phone: "+91",
    email: "",
    gstNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    taxType: "gst_inclusive",
    taxRate: "18.00",
    invoicePrefix: "INV/",
    invoiceTemplet: "1",
    footerText: "",
    logoUrl: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [initialFormData, setInitialFormData] = useState<typeof formData | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<any>(null);

  const isDirty = initialFormData
    ? Object.keys(formData).some(
        (key) => (formData as any)[key] !== (initialFormData as any)[key]
      )
    : false;

  const formatPhoneInput = (val: string) => {
    if (!val.startsWith("+91")) {
      if (val.length < 3) {
        val = "+91";
      } else {
        val = "+91" + val.replace(/\D/g, "");
      }
    }
    const prefix = "+91";
    const rest = val.slice(3);
    const cleanRest = rest.replace(/\D/g, "").slice(0, 10);
    return prefix + cleanRest;
  };

  const validateField = (name: string, value: string) => {
    const optionalFields = ["gstNumber", "addressLine2", "phone", "email", "taxRate", "invoicePrefix", "footerText", "logoUrl"];
    if (optionalFields.includes(name) && (!value.trim() || value === "+91")) {
      return "";
    }

    const shape = CreateShopSchema.shape as any;
    const fieldSchema = shape[name];
    if (fieldSchema) {
      const res = fieldSchema.safeParse(value);
      if (!res.success) {
        return res.error.issues[0].message;
      }
    }
    return "";
  };

  const handleFieldBlur = (name: string, value: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleFieldChange = (name: string, value: string) => {
    const updatedValue = name === "phone" ? formatPhoneInput(value) : value;
    setFormData(prev => ({ ...prev, [name]: updatedValue }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, updatedValue) }));
    }
  };

  const getMissingOrInvalidFields = () => {
    const list: string[] = [];
    if (!formData.name.trim()) list.push("Shop Name is required");
    if (!formData.addressLine1.trim()) list.push("Address Line 1 is required");
    if (!formData.city.trim()) list.push("City is required");
    if (!formData.state.trim()) list.push("State is required");
    if (!formData.pincode.trim()) list.push("Pincode is required");

    Object.keys(formData).forEach((key) => {
      const err = validateField(key, (formData as any)[key]);
      if (err) {
        list.push(err);
      }
    });

    return Array.from(new Set(list));
  };

  const missingOrInvalid = getMissingOrInvalidFields();
  const isFormValid = missingOrInvalid.length === 0;

  const isBoneyard = typeof window !== "undefined" && 
    ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));

  useEffect(() => {
    async function loadShopDetails() {
      try {
        if (isBoneyard) {
          const shop = mockShops.find(s => s.id === shopId) || mockShops[0];
          let loadedPhone = shop.phone || "+91";
          if (loadedPhone && !loadedPhone.startsWith("+91")) {
            loadedPhone = "+91" + loadedPhone.replace(/\D/g, "");
          }
          const loadedData = {
            name: shop.name,
            phone: loadedPhone,
            email: shop.email || "",
            gstNumber: shop.gstNumber || "",
            addressLine1: shop.addressLine1,
            addressLine2: shop.addressLine2 || "",
            city: shop.city,
            state: shop.state,
            pincode: shop.pincode,
            taxType: shop.taxType,
            taxRate: shop.taxRate,
            invoicePrefix: shop.invoicePrefix,
            invoiceTemplet: shop.invoiceTemplet,
            footerText: shop.footerText || "",
            logoUrl: shop.logoUrl || ""
          };
          setFormData(loadedData);
          setInitialFormData(loadedData);
          setLoading(false);
          return;
        }

        const token = await getToken();
        const shop = await shopsApi.getShop(token, shopId);
        let loadedPhone = shop.phone || "+91";
        if (loadedPhone && !loadedPhone.startsWith("+91")) {
          loadedPhone = "+91" + loadedPhone.replace(/\D/g, "");
        }
        const loadedData = {
          name: shop.name,
          phone: loadedPhone,
          email: shop.email || "",
          gstNumber: shop.gstNumber || "",
          addressLine1: shop.addressLine1,
          addressLine2: shop.addressLine2 || "",
          city: shop.city,
          state: shop.state,
          pincode: shop.pincode,
          taxType: shop.taxType,
          taxRate: shop.taxRate,
          invoicePrefix: shop.invoicePrefix,
          invoiceTemplet: shop.invoiceTemplet,
          footerText: shop.footerText || "",
          logoUrl: shop.logoUrl || ""
        };
        setFormData(loadedData);
        setInitialFormData(loadedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadShopDetails();
  }, [shopId, getToken, isBoneyard]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    handleFieldChange(e.target.name, e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched(
      Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    const fieldErrors = getMissingOrInvalidFields();
    if (fieldErrors.length > 0) {
      setMessage({ text: fieldErrors[0], type: "error" });
      return;
    }

    const validation = validateSchema(CreateShopSchema, formData);
    if (!validation.success) {
      setMessage({ text: validation.error, type: "error" });
      return;
    }
    console.log('[ShopSettings] validation.data to be saved:', validation.data);

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      if (isBoneyard) {
        const targetShopIdx = mockShops.findIndex(s => s.id === shopId);
        const idx = targetShopIdx !== -1 ? targetShopIdx : 0;
        mockShops[idx] = { ...mockShops[idx], ...validation.data };
        if (typeof window !== "undefined") {
          localStorage.setItem("mock_shops", JSON.stringify(mockShops));
        }
        setMessage({ text: "Shop configurations saved successfully!", type: "success" });
        setInitialFormData(formData);
        return;
      }
      const token = await getToken();
      await shopsApi.updateShop(token, shopId, validation.data);
      setMessage({ text: "Shop configurations saved successfully!", type: "success" });
      setInitialFormData(formData);
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to save settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const previewShop: Shop = {
    id: shopId,
    createdBy: null,
    name: formData.name || "ONBILLO STORE",
    gstNumber: formData.gstNumber || null,
    addressLine1: formData.addressLine1 || "Elangkavu, vadayar, vaikom",
    addressLine2: formData.addressLine2 || null,
    city: formData.city || "Kottayam",
    state: formData.state || "Kerala",
    pincode: formData.pincode || "686605",
    phone: formData.phone || "+918078311945",
    email: formData.email || "info@onbillo.com",
    logoUrl: formData.logoUrl || null,
    currency: "rupees",
    taxType: formData.taxType as any,
    taxRate: formData.taxRate,
    invoiceTemplet: formData.invoiceTemplet,
    invoicePrefix: formData.invoicePrefix,
    invoiceCounter: 1,
    footerText: formData.footerText || "Thanks for your Kind Visit",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const previewBill = {
    id: "preview-bill",
    shopId: shopId,
    billNumber: `${formData.invoicePrefix || "INV/"}0001`,
    createdBy: "cashier-clerk",
    totalPrice: 80070, // 800.70 in paise
    notes: "Cash Sale Preview",
    templetUsed: formData.invoiceTemplet || "1",
    status: "active" as const,
    createdAt: new Date().toISOString(),
    cashierName: "Onbillo Cashier",
    items: [
      {
        id: "item-1",
        billId: "preview-bill",
        shopProductId: "sp-1",
        unitPrice: 75000,
        mrp: 75000,
        quantity: 1,
        productName: "Tomato"
      },
      {
        id: "item-2",
        billId: "preview-bill",
        shopProductId: "sp-2",
        unitPrice: 3360,
        mrp: 5600,
        quantity: 1,
        productName: "Mango"
      },
      {
        id: "item-3",
        billId: "preview-bill",
        shopProductId: "sp-3",
        unitPrice: 1710,
        mrp: 17100,
        quantity: 1,
        productName: "Potato"
      }
    ]
  };

  const previewBillClassic = {
    id: "preview-bill-classic",
    shopId: shopId,
    billNumber: `${formData.invoicePrefix || "GST-"}0001-2024/25`,
    createdBy: "cashier-clerk",
    totalPrice: 25500, // 255.00 in paise
    notes: "Cash Sale Preview",
    templetUsed: formData.invoiceTemplet || "1",
    status: "active" as const,
    createdAt: new Date("2024-04-05T15:40:00").toISOString(),
    cashierName: "Onbillo Cashier",
    items: [
      {
        id: "item-1",
        billId: "preview-bill-classic",
        shopProductId: "sp-1",
        unitPrice: 11900,
        mrp: 14000,
        quantity: 1,
        productName: "APRNA 140"
      },
      {
        id: "item-2",
        billId: "preview-bill-classic",
        shopProductId: "sp-2",
        unitPrice: 13600,
        mrp: 16000,
        quantity: 1,
        productName: "APRNA 160"
      }
    ]
  };

  const templatesList = [
    {
      id: "3",
      name: "Onbillo Tax Invoice (3-Inch)",
      folder: "3InchPrints",
      description: "Space-efficient multi-line item table, logo placeholder, original S.Rate/Discount fields, and full GST table.",
      isAvailable: true,
      component: <OnbilloInvoice bill={previewBill} shop={previewShop} />
    },
    {
      id: "2",
      name: "Onbillo Classic Bill (3-Inch)",
      folder: "3InchPrints",
      description: "Classical POS layout with boxed table, unit PCS indicator, green savings banner, and red borders.",
      isAvailable: true,
      component: <OnbilloBill bill={previewBillClassic} shop={previewShop} />
    },
    {
      id: "4",
      name: "Onbillo 3-Inch Receipt",
      folder: "3InchPrints",
      description: "GST tax details table, Tender box summary, Code 39 barcode, and clean blue headings.",
      isAvailable: true,
      component: <OnbilloReceipt bill={previewBill} shop={previewShop} />
    },
    {
      id: "5",
      name: "Raintech 3-Inch Bill",
      folder: "3InchPrints",
      description: "High-contrast POS receipt template featuring Hindi labels, blue header title, double-column metadata, and shaded columns.",
      isAvailable: true,
      component: <RaintechBill bill={previewBill} shop={previewShop} />
    },
    {
      id: "6",
      name: "Raintech Classic POS (English)",
      folder: "3InchPrints",
      description: "Classic English POS layout with top/bottom scroll ornaments, gray boxed header, logo placeholder, and double-bar savings indicator.",
      isAvailable: true,
      component: <RaintechReceipt bill={previewBill} shop={previewShop} />
    },
    {
      id: "1",
      name: "Standard Compact Receipt",
      folder: "3InchPrints",
      description: "Simple thermal receipt template with basic items table, subtotal, and tax calculations.",
      isAvailable: true,
      component: <ThermalReceipt bill={previewBill} shop={previewShop} />
    },
    {
      id: "7",
      name: "Raintech A4 Invoice",
      folder: "A4Prints",
      description: "Full-page A4 print invoice featuring centered company profile, Logo placeholder, detailed Billed To section, structured products table, Rupees in Words, Bank Details, tax calculations table, and signature sections.",
      isAvailable: true,
      component: <RaintechA4Invoice bill={previewBill} shop={previewShop} />
    }
  ];

  return (
    <Skeleton name="shop-settings" loading={loading}>
      <div className="max-w-4xl space-y-8 select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-sans">Shop Settings</h1>
        <p className="text-xs text-mute mt-1">
          Configure business metadata, tax policies, and printer invoice layouts.
        </p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-lg text-xs font-semibold border flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-canvas-soft border-brand-primary/15 text-brand-primary"
              : "bg-error-soft border-error/15 text-error-deep"
          }`}
        >
          <span>{message.type === "success" ? "✓" : "⚠️"}</span>
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-canvas border border-hairline rounded-2xl p-6 md:p-8 shadow-sm">
        {/* Section 1: Business Identity */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-4 font-mono">
            Shop Profile Details
          </h3>

          <div className="mb-6 bg-canvas p-4 rounded-xl border border-hairline/80">
            <LogoUploadAndCrop
              value={formData.logoUrl}
              onChange={async (url) => {
                setFormData(prev => ({ ...prev, logoUrl: url || "" }));
                if (isBoneyard) {
                  const targetShopIdx = mockShops.findIndex(s => s.id === shopId);
                  const idx = targetShopIdx !== -1 ? targetShopIdx : 0;
                  mockShops[idx] = { ...mockShops[idx], logoUrl: url };
                  if (typeof window !== "undefined") {
                    localStorage.setItem("mock_shops", JSON.stringify(mockShops));
                  }
                  setMessage({
                    text: url ? "Shop logo updated successfully!" : "Shop logo removed successfully!",
                    type: "success"
                  });
                  setInitialFormData(prev => prev ? { ...prev, logoUrl: url || "" } : null);
                } else {
                  try {
                    const token = await getToken();
                    const validation = validateSchema(UpdateShopSchema, { logoUrl: url });
                    if (validation.success) {
                      await shopsApi.updateShop(token, shopId, { logoUrl: url });
                      setMessage({
                        text: url ? "Shop logo updated successfully!" : "Shop logo removed successfully!",
                        type: "success"
                      });
                      setInitialFormData(prev => prev ? { ...prev, logoUrl: url || "" } : null);
                    } else {
                      setMessage({ text: validation.error, type: "error" });
                    }
                  } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
                    setMessage({
                      text: errorMsg,
                      type: "error"
                    });
                  }
                }
              }}
              getToken={getToken}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Shop Name <span className="text-error-deep">*</span>
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {formData.name.length}/255 chars
                </span>
              </div>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur("name", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-semibold ${
                  touched.name && errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                }`}
              />
              {touched.name && errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  GSTIN / Tax Number
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {formData.gstNumber.length}/50 chars
                </span>
              </div>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur("gstNumber", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-mono ${
                  touched.gstNumber && errors.gstNumber ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                }`}
              />
              {touched.gstNumber && errors.gstNumber && (
                <p className="text-xs text-red-500 mt-1">{errors.gstNumber}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Business Phone
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {formData.phone.length === 0 ? 0 : Math.max(0, formData.phone.length - 3)}/10 digits
                </span>
              </div>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur("phone", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground ${
                  touched.phone && errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                }`}
              />
              {touched.phone && errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Business Email
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {formData.email.length}/255 chars
                </span>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur("email", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground ${
                  touched.email && errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                }`}
              />
              {touched.email && errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Available Bill Templates Showcase Section */}
          <div className="mt-6 bg-canvas-soft p-4 md:p-6 rounded-xl border border-hairline space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-mute mb-2 font-mono">
                Available Bill & Receipt Templates
              </h4>
              <p className="text-[11px] text-mute">
                Select your preferred layout for printed bills and receipts.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {templatesList.map((tmpl) => {
                const isA4 = tmpl.folder === "A4Prints";
                const isActive = formData.invoiceTemplet === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setFormData((prev) => ({ ...prev, invoiceTemplet: tmpl.id }))}
                    className={`p-3 border rounded-xl flex flex-col gap-3 transition-all duration-200 bg-canvas hover:border-brand-primary/40 cursor-pointer shadow-xs ${
                      isActive
                        ? "border-2 border-brand-primary ring-2 ring-brand-primary/15"
                        : "border-hairline"
                    }`}
                  >
                    {/* Preview Container at the top */}
                    <div className="w-full bg-zinc-50 dark:bg-zinc-900/30 border border-hairline/80 rounded-lg p-2 flex justify-center items-start h-[220px] overflow-hidden shadow-inner select-none">
                      <div className={`origin-top transform transition-transform duration-200 ${isA4 ? "scale-[0.18]" : "scale-[0.4]"}`}>
                        {tmpl.component}
                      </div>
                    </div>

                    {/* Metadata details at the bottom */}
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-bold text-foreground font-sans line-clamp-1">
                        {tmpl.name}
                      </h4>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold bg-brand-primary/10 text-brand-primary">
                          {tmpl.folder}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewingTemplate(tmpl);
                          }}
                          className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border border-hairline bg-canvas hover:bg-canvas-soft text-foreground hover:border-hairline-strong transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <svg className="w-2.5 h-2.5 text-mute" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <hr className="border-hairline" />

        {/* Section 2: Address */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-4 font-mono">
            Store Location
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Address Line 1 <span className="text-error-deep">*</span>
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {formData.addressLine1.length}/500 chars
                </span>
              </div>
              <input
                type="text"
                name="addressLine1"
                required
                value={formData.addressLine1}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur("addressLine1", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground ${
                  touched.addressLine1 && errors.addressLine1 ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                }`}
              />
              {touched.addressLine1 && errors.addressLine1 && (
                <p className="text-xs text-red-500 mt-1">{errors.addressLine1}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Address Line 2
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {formData.addressLine2.length}/500 chars
                </span>
              </div>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur("addressLine2", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground ${
                  touched.addressLine2 && errors.addressLine2 ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                }`}
              />
              {touched.addressLine2 && errors.addressLine2 && (
                <p className="text-xs text-red-500 mt-1">{errors.addressLine2}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    City <span className="text-error-deep">*</span>
                  </label>
                  <span className="text-[10px] text-mute font-mono">
                    {formData.city.length}/100 chars
                  </span>
                </div>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={(e) => handleFieldBlur("city", e.target.value)}
                  className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground ${
                    touched.city && errors.city ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                  }`}
                />
                {touched.city && errors.city && (
                  <p className="text-xs text-red-500 mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    State <span className="text-error-deep">*</span>
                  </label>
                  <span className="text-[10px] text-mute font-mono">
                    {formData.state.length}/100 chars
                  </span>
                </div>
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  onBlur={(e) => handleFieldBlur("state", e.target.value)}
                  className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground ${
                    touched.state && errors.state ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                  }`}
                />
                {touched.state && errors.state && (
                  <p className="text-xs text-red-500 mt-1">{errors.state}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Pincode <span className="text-error-deep">*</span>
                  </label>
                  <span className="text-[10px] text-mute font-mono">
                    {formData.pincode.length}/20 chars
                  </span>
                </div>
                <input
                  type="text"
                  name="pincode"
                  required
                  value={formData.pincode}
                  onChange={handleChange}
                  onBlur={(e) => handleFieldBlur("pincode", e.target.value)}
                  className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-mono ${
                    touched.pincode && errors.pincode ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline font-mono"
                  }`}
                />
                {touched.pincode && errors.pincode && (
                  <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <hr className="border-hairline" />

        {/* Section 3: Taxing */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-4 font-mono">
            GST & Taxation Preference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Tax Calculation Type
              </label>
              <select
                name="taxType"
                value={formData.taxType}
                onChange={handleChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
              >
                <option value="gst_inclusive">GST Inclusive (Item prices include tax)</option>
                <option value="gst_exclusive">GST Exclusive (Tax added at checkout)</option>
                <option value="no_tax">No Tax (Zero-rated / Exempt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Store Default Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                name="taxRate"
                value={formData.taxRate}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur("taxRate", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-mono ${
                  touched.taxRate && errors.taxRate ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline font-mono"
                }`}
              />
              {touched.taxRate && errors.taxRate && (
                <p className="text-xs text-red-500 mt-1">{errors.taxRate}</p>
              )}
            </div>
          </div>
        </div>

        <hr className="border-hairline" />

        {/* Section 4: Invoice settings */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-4 font-mono">
            Invoice Printer Styles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Bill Invoice Prefix
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {formData.invoicePrefix.length}/20 chars
                </span>
              </div>
              <input
                type="text"
                name="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur("invoicePrefix", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-mono ${
                  touched.invoicePrefix && errors.invoicePrefix ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline font-mono"
                }`}
              />
              {touched.invoicePrefix && errors.invoicePrefix && (
                <p className="text-xs text-red-500 mt-1">{errors.invoicePrefix}</p>
              )}
            </div>



            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Invoice Footer Terms / Message
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {formData.footerText.length}/1000 chars
                </span>
              </div>
              <textarea
                name="footerText"
                rows={3}
                placeholder="e.g. Terms: Goods once sold cannot be taken back. Thank you!"
                value={formData.footerText}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur("footerText", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs p-3 text-foreground leading-relaxed ${
                  touched.footerText && errors.footerText ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                }`}
              />
              {touched.footerText && errors.footerText && (
                <p className="text-xs text-red-500 mt-1">{errors.footerText}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit button blocker explainer */}
        {!isFormValid && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs font-medium text-yellow-700 dark:text-yellow-400 space-y-1">
            <p className="font-bold">⚠️ Please resolve the following to save settings:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {missingOrInvalid.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 border-t border-hairline flex justify-end">
          <button
            type="submit"
            disabled={saving || !isFormValid || !isDirty}
            className={`h-10 px-6 font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              isDirty && isFormValid && !saving
                ? "bg-brand-primary hover:bg-brand-secondary text-white shadow-sm shadow-brand-primary/10 cursor-pointer"
                : "bg-canvas-soft-2 text-mute border border-hairline cursor-not-allowed shadow-none"
            }`}
          >
            {saving ? (
              <>
                <svg className={`animate-spin h-3.5 w-3.5 ${isDirty && isFormValid && !saving ? "text-white" : "text-mute"}`} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Saving configurations…</span>
              </>
            ) : (
              "Save Workspace Settings"
            )}
          </button>
        </div>
      </form>

    </div>

    {previewingTemplate && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-xs select-none">
        {/* Close click-handler backdrop */}
        <div className="absolute inset-0" onClick={() => setPreviewingTemplate(null)} />
        
        <div className="relative bg-canvas border border-hairline rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-level-4 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-hairline bg-canvas">
            <div>
              <h3 className="text-sm font-bold text-foreground font-sans">
                {previewingTemplate.name}
              </h3>
              <p className="text-[10px] text-mute mt-0.5">
                {previewingTemplate.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewingTemplate(null)}
              className="p-1.5 rounded-lg border border-hairline bg-canvas hover:bg-canvas-soft text-mute hover:text-foreground cursor-pointer transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center items-start bg-zinc-50 dark:bg-zinc-950/60 min-h-[400px]">
            <div className="relative bg-white dark:bg-zinc-900 border border-hairline/80 rounded-xl p-6 shadow-md select-none origin-top max-w-full overflow-x-auto">
              <div className={previewingTemplate.folder === "A4Prints" ? "scale-[0.8] origin-top md:scale-100" : "scale-100"}>
                {previewingTemplate.component}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-between items-center p-4 border-t border-hairline bg-canvas">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-brand-primary/10 text-brand-primary">
              {previewingTemplate.folder}
            </span>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, invoiceTemplet: previewingTemplate.id }));
                setPreviewingTemplate(null);
              }}
              className="h-9 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              Select Template
            </button>
          </div>
        </div>
      </div>
    )}
    </Skeleton>
  );
}
