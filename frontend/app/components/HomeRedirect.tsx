"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { shopsApi, usersApi } from "../utils/api";
import { mockUser } from "../utils/api/mockData";

export default function HomeRedirect() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    async function redirectUser() {
      try {
        const isBoneyard = typeof window !== "undefined" && 
          ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
        
        if (isBoneyard) {
          if (mockUser.role === "app_admin") {
            router.push("/admin/dashboard");
            return;
          }
        }

        const token = await getToken();
        if (!token) {
          // Clerk session not ready yet — stay on landing page quietly.
          if (!cancelled) setLoading(false);
          return;
        }
        const me = await usersApi.getMe(token);
        if (me.role === "app_admin") {
          router.push("/admin/dashboard");
          return;
        }

        const list = await shopsApi.getUserShops(token);
        if (list && list.length > 0) {
          // Check if there is an owner role
          const ownerShop = list.find(s => s.role === "owner");
          if (ownerShop) {
            router.push(`/shop/${ownerShop.shop.id}/dashboard`);
          } else {
            router.push(`/shop/${list[0].shop.id}/billing`);
          }
        } else {
          // If user has no shops, check onboarding status
          if (me.phone) {
            router.push("/invites");
          } else {
            router.push("/onboarding");
          }
        }
      } catch (error: any) {
        // 401 = Clerk session is valid but the backend has no matching user
        // (webhook sync lag or misconfigured CLERK_WEBHOOK_SECRET). Stay on
        // the landing page quietly instead of spamming the console.
        const status = error?.response?.status ?? error?.status;
        if (status === 401) {
          if (!cancelled) setLoading(false);
          return;
        }
        console.error("Error during home redirect:", error);
        if (!cancelled) setLoading(false);
      }
    }
      redirectUser();
      return () => {
        cancelled = true;
      };
  }, [isLoaded, isSignedIn, getToken, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background transition-all duration-300">
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
