"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { shopsApi } from "../utils/api";

export default function HomeRedirect() {
  const { isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      setLoading(true);
      async function redirectUser() {
        try {
          const token = await getToken();
          const list = await shopsApi.getUserShops(token);
          if (list && list.length > 0) {
            // Check if there is an owner role
            const ownerShop = list.find(s => s.role === "owner");
            if (ownerShop) {
              router.push(`/shop/${ownerShop.shop.id}/dashboard`);
            } else {
              router.push(`/shop/${list[0].shop.id}/pos`);
            }
          } else {
            router.push("/onboarding");
          }
        } catch (error) {
          console.error("Error during home redirect:", error);
          setLoading(false);
        }
      }
      redirectUser();
    }
  }, [isSignedIn, getToken, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-300">
        <div className="flex flex-col items-center gap-4 p-8 bg-canvas border border-hairline rounded-2xl shadow-level-4 animate-in fade-in scale-in duration-200">
          <svg className="animate-spin h-10 w-10 text-brand-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-foreground">Welcome back!</h3>
            <p className="text-xs text-body mt-1">Redirecting you to your shop workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
