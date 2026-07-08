"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { shopsApi } from "../utils/api";
import DevMockModeIndicator from "../components/DevMockModeIndicator";

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    gstNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    taxType: "gst_inclusive",
    taxRate: "18.00"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
      setError("Please fill in all required fields (Shop Name, Address, City, State, and Pincode).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getToken();
      const shop = await shopsApi.createShop(token, formData);
      router.push(`/shop/${shop.id}/dashboard`);
    } catch (err: any) {
      setError(err.message || "Failed to create shop. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-2xl bg-canvas border border-hairline rounded-2xl shadow-level-4 p-8 z-10 relative">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
            Set up your shop workspace
          </h1>
          <p className="mt-2 text-sm text-body">
            Create your billing workspace to get started with thermal printing, GST filing, and barcode scanning.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-soft border border-error/15 text-xs font-medium text-error-deep flex items-start gap-2.5">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Business Profile */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-4 font-mono">
              Business Profile
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
                  placeholder="e.g. Kambar Groceries"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  GSTIN (GST Number)
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  placeholder="e.g. 29AAAAA0000A1Z1"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Business Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="e.g. +91 8023456789"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Business Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. billing@mybusiness.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground"
                />
              </div>
            </div>
          </div>

          <hr className="border-hairline" />

          {/* Section 2: Address */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-4 font-mono">
              Business Address
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
                  placeholder="Street name, Shop #, Building"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  placeholder="Locality, Sector, Landmark"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground"
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
                    placeholder="e.g. Bengaluru"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground"
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
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground"
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
                    placeholder="e.g. 560034"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-hairline" />

          {/* Section 3: Tax Configuration */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-4 font-mono">
              Tax Preference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Tax Calculation Mode
                </label>
                <select
                  name="taxType"
                  value={formData.taxType}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground"
                >
                  <option value="gst_inclusive">GST Inclusive (Item prices include tax)</option>
                  <option value="gst_exclusive">GST Exclusive (Tax added at checkout)</option>
                  <option value="no_tax">No Tax (Zero-rated / Exempt)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleChange}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 h-11 bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-sm shadow-brand-primary/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Initializing Workspace...
              </>
            ) : (
              "Initialize Workspace & Shop"
            )}
          </button>
        </form>
      </div>

      <DevMockModeIndicator />
    </div>
  );
}
