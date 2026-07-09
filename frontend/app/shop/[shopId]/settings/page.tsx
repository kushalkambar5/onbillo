"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { shopsApi, Shop } from "../../../utils/api";
import { CreateShopSchema, UpdateShopSchema, validateSchema } from "../../../utils/validation";
import { mockShops } from "../../../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
import DevMockModeIndicator from "../../../components/DevMockModeIndicator";
import LogoUploadAndCrop from "../../../components/LogoUploadAndCrop";

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
    phone: "",
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

  const validateField = (name: string, value: string) => {
    const optionalFields = ["gstNumber", "addressLine2", "phone", "email", "taxRate", "invoicePrefix", "footerText", "logoUrl"];
    if (optionalFields.includes(name) && !value.trim()) {
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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
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
          setFormData({
            name: shop.name,
            phone: shop.phone || "",
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
          });
          setLoading(false);
          return;
        }

        const token = await getToken();
        const shop = await shopsApi.getShop(token, shopId);
        setFormData({
          name: shop.name,
          phone: shop.phone || "",
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
        });
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
        return;
      }
      const token = await getToken();
      await shopsApi.updateShop(token, shopId, validation.data);
      setMessage({ text: "Shop configurations saved successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to save settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

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
                  {formData.phone.length}/20 chars
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

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Receipt Thermal Template
              </label>
              <select
                name="invoiceTemplet"
                value={formData.invoiceTemplet}
                onChange={handleChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
              >
                <option value="1">Standard Compact (80mm / 3 inch)</option>
                <option value="2">Mini Roll (58mm / 2 inch)</option>
                <option value="3">Full Detail (Itemized with discount rows)</option>
                <option value="4">Clean Border (High contrast)</option>
                <option value="5">Elegant Sans (Modern branding)</option>
              </select>
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
            disabled={saving || !isFormValid}
            className="h-10 px-6 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl transition-all duration-200 shadow-sm shadow-brand-primary/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
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
    </Skeleton>
  );
}
