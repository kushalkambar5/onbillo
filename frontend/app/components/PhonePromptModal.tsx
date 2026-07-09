"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { usersApi, User } from "../utils/api";
import { UpdateMeSchema, validateSchema } from "../utils/validation";

export default function PhonePromptModal() {
  const { isSignedIn, getToken } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<User | null>(null);

  const [inlineError, setInlineError] = useState("");
  const [touched, setTouched] = useState(false);

  const lastCheckedPathname = useRef<string | null>(null);

  const validatePhone = (val: string) => {
    if (!val.trim()) {
      return "Phone number is required";
    }
    const validation = validateSchema(UpdateMeSchema, { phone: val });
    if (!validation.success) {
      return validation.error.replace("Phone: ", "");
    }
    return "";
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (touched) {
      setInlineError(validatePhone(val));
    }
  };

  const handlePhoneBlur = () => {
    setTouched(true);
    setInlineError(validatePhone(phone));
  };

  const isFormValid = phone.trim() !== "" && !validatePhone(phone);

  const isAppPath =
    pathname.startsWith("/shop") ||
    pathname.startsWith("/invites") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile");

  useEffect(() => {
    if (isSignedIn && isAppPath) {
      async function checkPhone() {
        try {
          const token = await getToken();
          const me = await usersApi.getMe(token);
          setProfile(me);
          if (!me.phone) {
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
        } catch (err) {
          console.error("Error checking phone number:", err);
        }
      }
      if (!profile || (isOpen && lastCheckedPathname.current !== pathname)) {
        lastCheckedPathname.current = pathname;
        checkPhone();
      }
    }
  }, [isSignedIn, getToken, pathname, isOpen, profile, isAppPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTouched(true);
    const errText = validatePhone(phone);
    if (errText) {
      setInlineError(errText);
      setError(errText);
      return;
    }

    const validation = validateSchema(UpdateMeSchema, { phone });
    if (!validation.success) {
      setError(validation.error);
      return;
    }
    const cleanedPhone = validation.data.phone;

    setLoading(true);
    try {
      const token = await getToken();
      if (profile) {
        await usersApi.updateProfile(token, profile.name, cleanedPhone);
        setProfile({ ...profile, phone: cleanedPhone });
        setIsOpen(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update phone number. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !isAppPath) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 transition-all duration-300">
      <div className="w-full max-w-md bg-canvas border border-hairline rounded-2xl shadow-level-4 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4 text-brand-primary text-xl">
            📞
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Phone Number Required
          </h2>
          <p className="mt-2 text-xs text-body leading-relaxed max-w-sm">
            To continue, please provide your phone number. This is required for order notifications, billing authentication, and secure access.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-600 dark:text-red-400 flex items-start gap-2 animate-pulse">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-mute font-mono">
                {phone.length}/20 chars
              </span>
            </div>
            <input
              type="text"
              name="phone"
              required
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={handlePhoneBlur}
              disabled={loading}
              className={`w-full border bg-canvas hover:border-hairline-strong rounded-lg text-sm transition-all duration-200 h-10 px-3 text-foreground ${
                touched && inlineError ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline focus:border-brand-primary focus:ring-brand-primary/30"
              }`}
            />
            {touched && inlineError && (
              <p className="text-xs text-red-500 mt-1">{inlineError}</p>
            )}
          </div>

          {!isFormValid && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              ⚠️ Phone number must contain only digits (optionally starting with +) and be 7-20 characters long.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full h-10 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-sm shadow-brand-primary/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              "Verify and Save"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
