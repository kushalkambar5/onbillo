"use client";

import { useEffect, useState } from "react";
import { useAuth, SignOutButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { usersApi } from "../utils/api";
import { Lock, Phone, MessageSquare, LogOut, ShieldAlert } from "lucide-react";

export default function PremiumBlockModal() {
  const { isSignedIn, getToken } = useAuth();
  const pathname = usePathname();
  const [blockReason, setBlockReason] = useState<"premium" | "banned" | null>(null);
  const [loading, setLoading] = useState(true);

  // Match the app paths where a user must have active status
  const isAppPath =
    pathname.startsWith("/shop") ||
    pathname.startsWith("/invites") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/onboarding");

  useEffect(() => {
    if (!isSignedIn || !isAppPath) {
      setLoading(false);
      setBlockReason(null);
      return;
    }

    async function checkStatus() {
      try {
        const isBoneyard = typeof window !== "undefined" && 
          ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
        
        if (isBoneyard) {
          setBlockReason(null);
          setLoading(false);
          return;
        }

        const token = await getToken();
        const me = await usersApi.getMe(token);
        if (me) {
          if (me.isBanned === true) {
            setBlockReason("banned");
          } else if (me.isPremium === false && me.role !== "app_admin") {
            setBlockReason("premium");
          } else {
            setBlockReason(null);
          }
        } else {
          setBlockReason(null);
        }
      } catch (err) {
        console.error("Error checking user status:", err);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, [isSignedIn, getToken, pathname, isAppPath]);

  if (loading) return null;
  if (!blockReason) return null;

  const isBannedMode = blockReason === "banned";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4 sm:p-6 transition-all duration-500">
      <div className="w-full max-w-lg bg-canvas/80 border border-hairline/50 rounded-3xl shadow-level-4 p-8 sm:p-10 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 backdrop-blur-md">
        {/* Glow Accent Effects */}
        {isBannedMode ? (
          <>
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl" />
          </>
        )}

        <div className="relative z-10">
          {/* Animated Icon Visual */}
          {isBannedMode ? (
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6 text-red-500 animate-bounce duration-1000">
              <ShieldAlert className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mx-auto mb-6 text-brand-primary animate-bounce duration-1000">
              <Lock className="w-8 h-8" />
            </div>
          )}

          {/* Title */}
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans bg-clip-text text-transparent bg-gradient-to-r ${
            isBannedMode 
              ? "from-foreground via-foreground/90 to-red-500" 
              : "from-foreground via-foreground/90 to-brand-primary"
          }`}>
            {isBannedMode ? "Account Deactivated" : "Premium Required"}
          </h1>
          
          {/* Detailed Message */}
          <p className="mt-4 text-sm text-body leading-relaxed max-w-md mx-auto">
            {isBannedMode ? (
              <>
                Your account has been banned. To appeal or resolve this issue, please contact support at <span className="font-bold text-foreground">+919035035884</span>.
              </>
            ) : (
              <>
                You don&apos;t have the premium account, to access the features of the website plz contact <span className="font-bold text-foreground">+919035035884</span>
              </>
            )}
          </p>

          {/* Action buttons */}
          <div className="mt-8 space-y-3">
            {/* WhatsApp Support */}
            <a
              href={`https://wa.me/919035035884?text=Hello,%20my%20account%20on%20Onbillo%20is%20${isBannedMode ? "deactivated" : "inactive"}.%20Please%20help.`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-sm transition-all duration-300 transform hover:-translate-y-0.5`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 shrink-0" />
                <span>Contact via WhatsApp</span>
              </div>
              <span className="text-xs font-mono opacity-85">+91 90350 35884</span>
            </a>

            {/* Phone Support */}
            <a
              href="tel:+919035035884"
              className={`flex items-center justify-between p-4 rounded-2xl bg-brand-primary/10 hover:bg-brand-primary/15 border border-brand-primary/20 text-brand-primary font-semibold text-sm transition-all duration-300 transform hover:-translate-y-0.5`}
            >
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 shrink-0" />
                <span>Call Support Directly</span>
              </div>
              <span className="text-xs font-mono opacity-85">+91 90350 35884</span>
            </a>
          </div>

          {/* Footer controls: Logout option */}
          <div className="mt-8 pt-6 border-t border-hairline/60 flex justify-center">
            <SignOutButton>
              <button className="flex items-center gap-2 text-xs font-bold text-mute hover:text-foreground transition-colors duration-200 outline-none cursor-pointer">
                <LogOut className="w-4 h-4" />
                <span>Sign in with another account</span>
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  );
}
