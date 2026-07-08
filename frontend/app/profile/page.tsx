"use client";

import { useEffect, useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { User, usersApi } from "../utils/api";
import { UpdateMeSchema, PhoneSchema, validateSchema } from "../utils/validation";
import { mockUser } from "../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
import DevMockModeIndicator from "../components/DevMockModeIndicator";
import Link from "next/link";

export default function ProfilePage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [user, setUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string) => {
    if (name === "name") {
      if (!value.trim()) return "Full name is required";
      if (value.length > 255) return "Full name must be at most 255 characters";
      return "";
    }
    if (name === "phone") {
      if (!value.trim()) return "Phone number is required";
      const res = PhoneSchema.safeParse(value);
      if (!res.success) return res.error.issues[0].message;
      return "";
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
    const nameErr = validateField("name", formData.name);
    if (nameErr) list.push("Full Name: " + nameErr);
    const phoneErr = validateField("phone", formData.phone);
    if (phoneErr) list.push("Phone Number: " + phoneErr);
    return list;
  };

  const missingOrInvalid = getMissingOrInvalidFields();
  const isFormValid = missingOrInvalid.length === 0;

  useEffect(() => {
    async function loadProfile() {
      try {
        const isBoneyard = typeof window !== "undefined" && 
          ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
        
        if (isBoneyard) {
          const profile = mockUser;
          setUser(profile);
          setFormData({
            name: profile.name,
            phone: profile.phone || "",
          });
          setLoading(false);
          return;
        }

        const token = await getToken();
        const profile = await usersApi.getMe(token);
        setUser(profile);
        setFormData({
          name: profile.name,
          phone: profile.phone || "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [getToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange(e.target.name, e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });
    setTouched({ name: true, phone: true });

    const fieldErrors = getMissingOrInvalidFields();
    if (fieldErrors.length > 0) {
      setMessage({ text: fieldErrors[0], type: "error" });
      setSaving(false);
      return;
    }

    const validation = validateSchema(UpdateMeSchema, { phone: formData.phone });
    if (!validation.success) {
      setMessage({ text: validation.error, type: "error" });
      setSaving(false);
      return;
    }

    try {
      const token = await getToken();
      const updated = await usersApi.updateProfile(token, formData.name, validation.data.phone);
      setUser(updated);
      setMessage({ text: "Profile updated successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update profile", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Skeleton name="profile" loading={loading}>
      <div className="min-h-screen w-full bg-background relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Navigation Header */}
      <div className="max-w-3xl mx-auto mb-8 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-2 group outline-none">
          <img src="/favicon.svg" alt="Onbillo Logo" className="w-6 h-6 rounded-lg" />
          <span className="font-bold tracking-tight text-foreground font-sans text-sm">
            Onbillo
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/invites" className="text-xs font-semibold text-body hover:text-foreground">
            Staff Invites
          </Link>
          <UserButton />
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-canvas border border-hairline rounded-2xl shadow-level-3 p-8 relative overflow-hidden">

        <div className="mb-8 border-b border-hairline pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border border-hairline bg-canvas-soft flex items-center justify-center text-xl font-bold text-brand-primary shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : ""}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground font-sans truncate max-w-[220px] sm:max-w-none">{user?.name}</h1>
                <p className="text-xs text-mute font-mono mt-0.5 truncate max-w-[220px] sm:max-w-none">{user?.email}</p>
              </div>
            </div>
            <div className="sm:ml-auto w-full sm:w-auto flex flex-row sm:flex-col items-center sm:items-end justify-start sm:justify-end gap-1.5 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-hairline/40 sm:border-t-0">
              {user?.isPremium ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-primary/10 border border-brand-primary/20 text-brand-primary uppercase tracking-wider">
                  ✦ Premium Member
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-canvas-soft border border-hairline text-mute uppercase tracking-wider">
                  Regular Plan
                </span>
              )}
              {user?.role === "app_admin" && (
                <Link
                  href="/admin/dashboard"
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-foreground text-canvas hover:bg-mute border border-foreground/20 uppercase tracking-wider transition-all duration-200"
                >
                  🛡️ Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg text-xs font-medium border flex items-center gap-2.5 ${
              message.type === "success"
                ? "bg-canvas-soft border-brand-primary/15 text-brand-primary"
                : "bg-error-soft border-error/15 text-error-deep"
            }`}
          >
            <span>{message.type === "success" ? "✓" : "⚠️"}</span>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Full Name <span className="text-error-deep">*</span>
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
                className={`w-full border bg-canvas hover:border-hairline-strong rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground ${
                  touched.name && errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline focus:border-brand-primary focus:ring-brand-primary/30"
                }`}
              />
              {touched.name && errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Phone Number <span className="text-error-deep">*</span>
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {formData.phone.length}/20 chars
                </span>
              </div>
              <input
                type="text"
                name="phone"
                required
                placeholder="e.g. +91 9876543210"
                value={formData.phone}
                onChange={handleChange}
                onBlur={(e) => handleFieldBlur("phone", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground ${
                  touched.phone && errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline focus:border-brand-primary focus:ring-brand-primary/30"
                }`}
              />
              {touched.phone && errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Submit button blocker explainer */}
          {!isFormValid && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs font-medium text-yellow-700 dark:text-yellow-400 space-y-1">
              <p className="font-bold">⚠️ Please resolve the following to save changes:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {missingOrInvalid.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-hairline flex items-center justify-between">
            <div className="text-xs text-mute">
              Managed securely via Clerk. Custom metadata updates locally.
            </div>
            <button
              type="submit"
              disabled={saving || !isFormValid}
              className="h-10 px-6 bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-sm shadow-brand-primary/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>

      <DevMockModeIndicator />
    </div>
    </Skeleton>
  );
}
