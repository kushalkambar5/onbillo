"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { User, usersApi } from "../../utils/api";
import { mockUser } from "../../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
import { Settings, Shield, Info, Save } from "lucide-react";

export default function AdminSettings() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    name: "",
    phone: "+91",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
    if (name === "name") {
      if (!value.trim()) return "Full name is required";
      if (value.length > 255) return "Full name must be at most 255 characters";
      return "";
    }
    if (name === "phone") {
      if (!value.trim() || value === "+91") return "Phone number is required";
      const cleanDigits = value.slice(3).replace(/\D/g, "");
      if (cleanDigits.length !== 10) return "Phone number must be exactly 10 digits";
      return "";
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

  const isFormValid = !validateField("name", formData.name) && !validateField("phone", formData.phone);

  useEffect(() => {
    async function loadProfile() {
      try {
        const isBoneyard = typeof window !== "undefined" && 
          ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
        
        if (isBoneyard) {
          setUser(mockUser);
          let loadedPhone = mockUser.phone || "+91";
          if (loadedPhone && !loadedPhone.startsWith("+91")) {
            loadedPhone = "+91" + loadedPhone.replace(/\D/g, "");
          }
          setFormData({
            name: mockUser.name,
            phone: loadedPhone,
          });
          setLoading(false);
          return;
        }

        const token = await getToken();
        const profile = await usersApi.getMe(token);
        setUser(profile);
        let loadedPhone = profile.phone || "+91";
        if (loadedPhone && !loadedPhone.startsWith("+91")) {
          loadedPhone = "+91" + loadedPhone.replace(/\D/g, "");
        }
        setFormData({
          name: profile.name,
          phone: loadedPhone,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });
    setTouched({ name: true, phone: true });

    const nameErr = validateField("name", formData.name);
    const phoneErr = validateField("phone", formData.phone);
    if (nameErr || phoneErr) {
      setMessage({ text: nameErr || phoneErr, type: "error" });
      setSaving(false);
      return;
    }

    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));

      if (isBoneyard) {
        setMessage({ text: "Profile updated successfully! (Mock Mode)", type: "success" });
        setSaving(false);
        return;
      }

      const token = await getToken();
      const updated = await usersApi.updateProfile(token, formData.name, formData.phone);
      setUser(updated);
      setMessage({ text: "Profile updated successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update profile", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Skeleton name="admin-settings" loading={loading}>
      <div className="space-y-6 max-w-xl select-none">
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-6">
          <h1 className="text-xl font-bold text-white font-sans">Account Settings</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your administrator profile details.
          </p>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-lg text-xs font-medium border flex items-center gap-2.5 ${
              message.type === "success"
                ? "bg-zinc-900 border-brand-primary/15 text-brand-primary"
                : "bg-red-950/20 border-red-900/30 text-red-400"
            }`}
          >
            <span>{message.type === "success" ? "✓" : "⚠️"}</span>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 space-y-5 shadow-md">
          {/* Admin Tag */}
          <div className="flex items-center gap-3 p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl">
            <Shield className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-purple-400 block font-mono uppercase tracking-wider">
                Authorized Role
              </span>
              <span className="text-xs text-white font-medium">
                Platform Administrator
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-zinc-400">
                Full Name
              </label>
              <span className="text-[9px] text-zinc-500 font-mono">
                {formData.name.length}/255 chars
              </span>
            </div>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              onBlur={(e) => handleFieldBlur("name", e.target.value)}
              className={`w-full border bg-zinc-950 hover:border-zinc-700 focus:border-brand-primary rounded-lg text-xs transition-all duration-200 h-10 px-3 text-white outline-none ${
                touched.name && errors.name ? "border-red-500" : "border-zinc-800"
              }`}
            />
            {touched.name && errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-zinc-400">
                Phone Number
              </label>
              <span className="text-[9px] text-zinc-500 font-mono">
                {Math.max(0, formData.phone.length - 3)}/10 digits
              </span>
            </div>
            <input
              type="text"
              name="phone"
              required
              value={formData.phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              onBlur={(e) => handleFieldBlur("phone", e.target.value)}
              className={`w-full border bg-zinc-950 hover:border-zinc-700 focus:border-brand-primary rounded-lg text-xs transition-all duration-200 h-10 px-3 text-white outline-none font-mono ${
                touched.phone && errors.phone ? "border-red-500" : "border-zinc-800"
              }`}
              placeholder="+91 XXXXX XXXXX"
            />
            {touched.phone && errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Sync explain */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl flex items-start gap-2.5">
            <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-500 leading-normal">
              Authentication and credential syncing are managed securely via Clerk. Custom metadata like contact details update locally.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving || !isFormValid}
              className="px-5 h-10 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </Skeleton>
  );
}
