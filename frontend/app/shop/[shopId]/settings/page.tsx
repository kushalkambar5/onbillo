"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { shopsApi, Shop } from "../../../utils/api";
import DevMockModeIndicator from "../../../components/DevMockModeIndicator";

export default function ShopSettings({
  params: paramsPromise,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const params = use(paramsPromise);
  const shopId = parseInt(params.shopId, 10);
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
    footerText: ""
  });

  useEffect(() => {
    async function loadShopDetails() {
      try {
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
          footerText: shop.footerText || ""
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadShopDetails();
  }, [shopId, getToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
      setMessage({ text: "Shop Name, Address, City, State, and Pincode are required.", type: "error" });
      return;
    }

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const token = await getToken();
      await shopsApi.updateShop(token, shopId, formData);
      setMessage({ text: "Shop configurations saved successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to save settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Shop Name <span className="text-error-deep">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                GSTIN / Tax Number
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Business Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Business Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
              />
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
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Address Line 1 <span className="text-error-deep">*</span>
              </label>
              <input
                type="text"
                name="addressLine1"
                required
                value={formData.addressLine1}
                onChange={handleChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Address Line 2
              </label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  City <span className="text-error-deep">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  State <span className="text-error-deep">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Pincode <span className="text-error-deep">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  required
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-mono"
                />
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
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-mono"
              />
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
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Bill Invoice Prefix
              </label>
              <input
                type="text"
                name="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={handleChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-mono"
              />
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
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Invoice Footer Terms / Message
              </label>
              <textarea
                name="footerText"
                rows={3}
                placeholder="e.g. Terms: Goods once sold cannot be taken back. Thank you!"
                value={formData.footerText}
                onChange={handleChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs p-3 text-foreground leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-hairline flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl transition-all duration-200 shadow-sm shadow-brand-primary/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {saving ? "Saving configurations..." : "Save Workspace Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
