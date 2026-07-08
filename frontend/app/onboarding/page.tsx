"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { shopsApi, usersApi } from "../utils/api";
import DevMockModeIndicator from "../components/DevMockModeIndicator";
import { Store, User, ArrowLeft } from "lucide-react";

type Step = "role" | "details";
type Role = "owner" | "worker";

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  
  const [phone, setPhone] = useState("");
  const [phoneInitiallyPresent, setPhoneInitiallyPresent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gstNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    phone: "", // Business phone
    email: "", // Business email
    taxType: "gst_inclusive",
    taxRate: "18.00"
  });

  useEffect(() => {
    async function checkUserOnboarding() {
      try {
        const token = await getToken();
        const me = await usersApi.getMe(token);
        if (me.phone) {
          // If the user already has a phone number, they must be here to create a shop.
          // Skip role selection and show shop creation form directly.
          setRole("owner");
          setStep("details");
          setPhone(me.phone);
          setPhoneInitiallyPresent(true);
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
      } finally {
        setCheckingUser(false);
      }
    }
    checkUserOnboarding();
  }, [getToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate personal phone number
    const cleanedPhone = phone.trim();
    if (!cleanedPhone) {
      setError("Personal phone number is required.");
      return;
    }
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(cleanedPhone.replace(/[\s()-]/g, ""))) {
      setError("Please enter a valid personal phone number (e.g. +91 9876543210).");
      return;
    }

    if (role === "owner") {
      if (!formData.name || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
        setError("Please fill in all required shop fields (Shop Name, Address, City, State, and Pincode).");
        return;
      }
    }

    setLoading(true);

    try {
      const token = await getToken();
      
      // 1. Save personal phone number in users table
      await usersApi.updateProfile(token, "", cleanedPhone);

      if (role === "owner") {
        // 2. Create shop details in shops table
        const shop = await shopsApi.createShop(token, formData);
        router.push(`/shop/${shop.id}/dashboard`);
      } else {
        // Redirect worker to invites page
        router.push("/invites");
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding. Please try again.");
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
        
        <svg className="animate-spin h-10 w-10 text-brand-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="mt-4 text-xs font-semibold text-mute">Checking onboarding status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      
      <div className="w-full max-w-2xl bg-canvas border border-hairline rounded-2xl shadow-level-4 p-8 z-10 relative transition-all duration-300">
        
        {/* Back Button */}
        {step === "details" && !phoneInitiallyPresent && (
          <button
            type="button"
            onClick={() => {
              setStep("role");
              setError("");
            }}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-mute hover:text-foreground transition-colors duration-200 focus:outline-none cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to Role Selection
          </button>
        )}

        {step === "role" ? (
          <div>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
                Welcome to Onbillo
              </h1>
              <p className="mt-2 text-sm text-body">
                Let's get your billing and store workspace set up. First, select your role:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Shop Owner Card */}
              <button
                type="button"
                onClick={() => handleRoleSelect("owner")}
                className="group relative flex flex-col items-center p-8 bg-canvas border border-hairline rounded-2xl shadow-level-3 transition-all duration-300 hover:scale-[1.02] hover:border-brand-primary/40 hover:shadow-level-4 text-center cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
                <div className="h-16 w-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6 text-brand-primary transition-transform duration-300 group-hover:scale-110">
                  <Store className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans group-hover:text-brand-primary transition-colors duration-200">
                  Shop Owner
                </h3>
                <p className="mt-2 text-xs text-body leading-relaxed">
                  Create a new shop workspace, manage inventory, add staff, and start billing your customers.
                </p>
                <div className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary group-hover:translate-x-1 transition-transform duration-200">
                  Get Started &rarr;
                </div>
              </button>

              {/* Shop Worker Card */}
              <button
                type="button"
                onClick={() => handleRoleSelect("worker")}
                className="group relative flex flex-col items-center p-8 bg-canvas border border-hairline rounded-2xl shadow-level-3 transition-all duration-300 hover:scale-[1.02] hover:border-brand-primary/40 hover:shadow-level-4 text-center cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
                <div className="h-16 w-16 rounded-full bg-brand-secondary/10 flex items-center justify-center mb-6 text-brand-secondary transition-transform duration-300 group-hover:scale-110">
                  <User className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans group-hover:text-brand-secondary transition-colors duration-200">
                  Shop Worker / Staff
                </h3>
                <p className="mt-2 text-xs text-body leading-relaxed">
                  Join an existing shop workspace. You'll need to ask your shop owner to invite you to their workspace.
                </p>
                <div className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-brand-secondary group-hover:translate-x-1 transition-transform duration-200">
                  Join Workspace &rarr;
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans animate-in fade-in slide-in-from-top-4 duration-200">
                {role === "owner" ? "Set up your shop workspace" : "Complete your profile"}
              </h1>
              <p className="mt-2 text-sm text-body animate-in fade-in slide-in-from-top-4 duration-200">
                {role === "owner" 
                  ? "Create your billing workspace to get started with thermal printing, GST filing, and barcode scanning."
                  : "Please provide your contact information to finish joining Onbillo."}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-error-soft border border-error/15 text-xs font-medium text-error-deep flex items-start gap-2.5 animate-in fade-in duration-200">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Contact Details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-4 font-mono">
                  Personal Profile
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Phone Number <span className="text-error-deep">*</span>
                    </label>
                    <input
                      type="tel"
                      name="personalPhone"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={phoneInitiallyPresent}
                      className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    {phoneInitiallyPresent && (
                      <p className="text-[10px] text-mute mt-1">
                        Phone number is managed in your user settings.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {role === "owner" && (
                <>
                  <hr className="border-hairline" />

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
                </>
              )}

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
                    {role === "owner" ? "Initializing Workspace..." : "Saving Profile..."}
                  </>
                ) : (
                  role === "owner" ? "Initialize Workspace & Shop" : "Complete Onboarding"
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      <DevMockModeIndicator />
    </div>
  );
}
