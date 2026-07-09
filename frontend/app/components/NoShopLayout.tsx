"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { shopsApi } from "../utils/api";
import { mockShops } from "../utils/api/mockData";
import DevMockModeIndicator from "./DevMockModeIndicator";
import ThemeToggle from "./ThemeToggle";
import { 
  Users, 
  Settings, 
  Menu, 
  X 
} from "lucide-react";

export default function NoShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [shopsList, setShopsList] = useState<{ shop: any; role: "owner" | "shop_worker" }[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkShops() {
      try {
        const isBoneyard = typeof window !== "undefined" && 
          ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
        
        if (isBoneyard) {
          // Allow explicitly mocking "no shop" status via query params or route
          const hasNoShop = window.location.search.includes("no_shop=true") || 
                            window.location.pathname.startsWith("/invites");
          if (hasNoShop) {
            setShopsList([]);
          } else {
            setShopsList([
              { shop: mockShops[0], role: "owner" }
            ]);
          }
          setLoading(false);
          return;
        }

        const token = await getToken();
        if (token) {
          const list = await shopsApi.getUserShops(token);
          setShopsList(list);
        }
      } catch (err) {
        console.error("Error checking user shops:", err);
      } finally {
        setLoading(false);
      }
    }

    checkShops();
  }, [getToken]);

  const shopsCount = shopsList.length;

  useEffect(() => {
    if (!loading && shopsCount > 0) {
      if (pathname === "/invites") {
        router.push(`/shop/${shopsList[0].shop.id}/staff`);
      }
    }
  }, [loading, shopsCount, pathname, router, shopsList]);

  if (loading) {
    return (
      <div className="min-h-screen flex bg-background items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If user has shops, we do not wrap /profile in this layout.
  // /invites redirects to the shop workspace in the useEffect above.
  if (shopsList.length > 0) {
    return <>{children}</>;
  }

  const navItems = [
    {
      name: "Staff Management",
      href: "/invites",
      icon: Users,
    },
    {
      name: "Settings",
      href: "/profile",
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* 1. Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-hairline bg-canvas shrink-0 h-screen sticky top-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-hairline relative">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <img src="/favicon.svg" alt="Onbillo" className="w-6 h-6 rounded-lg object-cover shrink-0" />
            <span className="text-xs font-bold text-foreground truncate">
              Onbillo
            </span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 outline-none ${
                  active
                    ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/15"
                    : "text-body hover:text-foreground hover:bg-canvas-soft"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-mute"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-hairline flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <UserButton />
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-foreground truncate">
                No Active Shop
              </p>
              <Link href="/profile" className="text-[9px] text-brand-primary hover:underline block font-semibold truncate">
                Account Settings
              </Link>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile Drawer Menu (Mobile only) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay background */}
          <div 
            className="fixed inset-0 bg-black/40 transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content panel */}
          <div className="relative flex flex-col w-full max-w-[280px] bg-canvas border-r border-hairline h-full p-4 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-hairline mb-4">
              <div className="flex items-center gap-2">
                <img src="/favicon.svg" alt="Onbillo Logo" className="w-6 h-6 rounded" />
                <span className="font-bold tracking-tight text-foreground text-sm">
                  Onbillo
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md border border-hairline text-mute hover:text-foreground hover:bg-canvas-soft cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 outline-none ${
                      active
                        ? "bg-brand-primary text-white shadow-sm"
                        : "text-body hover:text-foreground hover:bg-canvas-soft"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-mute"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-hairline flex items-center justify-between gap-3 mt-auto">
              <div className="flex items-center gap-2 overflow-hidden">
                <UserButton />
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold text-foreground truncate">
                    No Active Shop
                  </p>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="text-[9px] text-brand-primary hover:underline block font-semibold truncate">
                    Account Settings
                  </Link>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header (Mobile nav indicator) */}
        <header className="md:hidden h-14 border-b border-hairline bg-canvas flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-hairline bg-canvas text-body hover:text-foreground md:hidden outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-foreground md:hidden truncate">
              Onbillo
            </span>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <UserButton />
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-canvas-soft">
          {children}
        </main>
      </div>

      <DevMockModeIndicator />
    </div>
  );
}
