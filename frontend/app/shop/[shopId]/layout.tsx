"use client";

import { useEffect, useState, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { shopsApi, usersApi, Shop } from "../../utils/api";
import { mockShops } from "../../utils/api/mockData";
import DevMockModeIndicator from "../../components/DevMockModeIndicator";
import ThemeToggle from "../../components/ThemeToggle";
import { 
  LayoutDashboard, 
  Calculator, 
  History, 
  Package, 
  PlusCircle, 
  Users, 
  Settings, 
  ChevronDown, 
  Store,
  AlertTriangle,
  Menu,
  X
} from "lucide-react";

export default function ShopWorkspaceLayout({
  children,
  params: paramsPromise,
}: {
  children: React.ReactNode;
  params: Promise<{ shopId: string }>;
}) {
  const params = use(paramsPromise);
  const shopId = parseInt(params.shopId, 10);
  const router = useRouter();
  const pathname = usePathname();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [shopsList, setShopsList] = useState<{ shop: Shop; role: "owner" | "shop_worker" }[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [userRole, setUserRole] = useState<"owner" | "shop_worker">("shop_worker");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function initWorkspace() {
      try {
        const isBoneyard = typeof window !== "undefined" && 
          ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
        
        if (isBoneyard) {
          const mockList = [
            { shop: mockShops[0], role: "owner" as const }
          ];
          setShopsList(mockList);
          setCurrentShop(mockShops[0]);
          setUserRole("owner");
          setIsAuthorized(true);
          setLoading(false);
          return;
        }

        const token = await getToken();
        const list = await shopsApi.getUserShops(token);
        setShopsList(list);

        const me = await usersApi.getMe(token);
        const activeMembership = list.find((m) => m.shop.id === shopId);
        if (!activeMembership) {
          // User is not a member of this shop
          if (list.length > 0) {
            router.push(`/shop/${list[0].shop.id}/dashboard`);
          } else {
            if (me.phone) {
              router.push("/invites");
            } else {
              router.push("/onboarding");
            }
          }
          return;
        }

        setCurrentShop(activeMembership.shop);
        setUserRole(activeMembership.role);

        // Check if path is owner-only and user is a worker
        const isOwnerRoute = 
          pathname.endsWith("/dashboard") || 
          pathname.includes("/inventory") || 
          pathname.endsWith("/staff") || 
          pathname.endsWith("/settings");

        if (isOwnerRoute && activeMembership.role === "shop_worker") {
          setIsAuthorized(false);
          // Redirect worker to POS page
          setTimeout(() => {
            router.push(`/shop/${shopId}/pos`);
          }, 3000);
        } else {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error("Workspace layout error:", err);
      } finally {
        setLoading(false);
      }
    }

    initWorkspace();
  }, [shopId, getToken, pathname, router]);

  const navItems = [
    {
      name: "Dashboard",
      href: `/shop/${shopId}/dashboard`,
      icon: LayoutDashboard,
      ownerOnly: true,
    },
    {
      name: "POS Register",
      href: `/shop/${shopId}/pos`,
      icon: Calculator,
      ownerOnly: false,
    },
    {
      name: "Bill History",
      href: `/shop/${shopId}/bills`,
      icon: History,
      ownerOnly: false,
    },
    {
      name: "Shop Inventory",
      href: `/shop/${shopId}/inventory`,
      icon: Package,
      ownerOnly: true,
    },
    {
      name: "Add Products",
      href: `/shop/${shopId}/inventory/add`,
      icon: PlusCircle,
      ownerOnly: true,
    },
    {
      name: "Staff Management",
      href: `/shop/${shopId}/staff`,
      icon: Users,
      ownerOnly: true,
    },
    {
      name: "Shop Settings",
      href: `/shop/${shopId}/settings`,
      icon: Settings,
      ownerOnly: true,
    },
  ];



  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-md bg-canvas border border-error/15 rounded-2xl shadow-level-4 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-error-soft border border-error/10 flex items-center justify-center mx-auto mb-4 text-error-deep">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Access Restricted</h1>
          <p className="text-xs text-body mt-2 leading-relaxed">
            The workspace route you requested is restricted to shop owners only. Your account role in this shop is 
            <strong className="text-brand-primary font-semibold"> Worker</strong>.
          </p>
          <p className="text-[11px] text-mute mt-4 animate-pulse">
            Redirecting you to the Point of Sale register...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* 1. Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-hairline bg-canvas shrink-0 h-screen sticky top-0">
        {/* Sidebar Header: Active Shop Selector */}
        <div className="p-4 border-b border-hairline relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border border-hairline hover:border-hairline-strong bg-canvas hover:bg-canvas-soft transition-all duration-200 text-left outline-none cursor-pointer"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 bg-brand-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Store className="w-3.5 h-3.5 text-brand-primary" />
              </div>
              <span className="text-xs font-bold text-foreground truncate">
                {currentShop ? currentShop.name : <span className="inline-block w-24 h-4 bg-foreground/10 animate-pulse rounded" />}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-mute shrink-0" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-4 right-4 mt-1 bg-canvas border border-hairline rounded-xl shadow-level-4 py-1.5 z-[100] animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1 text-[9px] font-bold text-mute uppercase tracking-wider border-b border-hairline mb-1 font-mono">
                My Workspace Shops
              </div>
              {shopsList.map((m) => (
                <button
                  key={m.shop.id}
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push(`/shop/${m.shop.id}/pos`);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-canvas-soft-2 transition-colors duration-150 cursor-pointer ${
                    m.shop.id === shopId ? "font-bold text-brand-primary bg-brand-primary/5" : "text-body"
                  }`}
                >
                  <Store className="w-3 h-3 text-mute shrink-0" />
                  <span className="truncate">{m.shop.name}</span>
                  <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded bg-hairline text-mute uppercase font-mono tracking-wide scale-90">
                    {m.role === "owner" ? "Owner" : "Staff"}
                  </span>
                </button>
              ))}
              <div className="border-t border-hairline mt-1 pt-1.5">
                <Link
                  href="/onboarding"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full text-left px-3 py-1.5 text-xs text-brand-primary hover:bg-brand-primary/5 font-semibold flex items-center gap-2"
                >
                  <PlusCircle className="w-3 h-3" />
                  Add New Shop
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.ownerOnly && userRole !== "owner") return null;
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
                {userRole === "owner" ? "Owner View" : "Worker View"}
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
                <span className="font-bold tracking-tight text-foreground text-sm">Onbillo</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md border border-hairline text-mute hover:text-foreground hover:bg-canvas-soft cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Shop Selector Dropdown */}
            <div className="relative mb-4">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border border-hairline bg-canvas hover:bg-canvas-soft text-left outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-6 h-6 bg-brand-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Store className="w-3.5 h-3.5 text-brand-primary" />
                  </div>
                  <span className="text-xs font-bold text-foreground truncate">
                    {currentShop ? currentShop.name : "Select Shop"}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-mute shrink-0" />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-canvas border border-hairline rounded-xl shadow-level-4 py-1.5 z-[110] animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1 text-[9px] font-bold text-mute uppercase tracking-wider border-b border-hairline mb-1 font-mono">
                    My Workspace Shops
                  </div>
                  {shopsList.map((m) => (
                    <button
                      key={m.shop.id}
                      onClick={() => {
                        setDropdownOpen(false);
                        setMobileMenuOpen(false);
                        router.push(`/shop/${m.shop.id}/pos`);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-canvas-soft-2 transition-colors duration-150 cursor-pointer ${
                        m.shop.id === shopId ? "font-bold text-brand-primary bg-brand-primary/5" : "text-body"
                      }`}
                    >
                      <Store className="w-3 h-3 text-mute shrink-0" />
                      <span className="truncate">{m.shop.name}</span>
                      <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded bg-hairline text-mute uppercase font-mono tracking-wide scale-90">
                        {m.role === "owner" ? "Owner" : "Staff"}
                      </span>
                    </button>
                  ))}
                  <div className="border-t border-hairline mt-1 pt-1.5">
                    <Link
                      href="/onboarding"
                      onClick={() => {
                        setDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-brand-primary hover:bg-brand-primary/5 font-semibold flex items-center gap-2"
                    >
                      <PlusCircle className="w-3 h-3" />
                      Add New Shop
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
              {navItems.map((item) => {
                if (item.ownerOnly && userRole !== "owner") return null;
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
                    {userRole === "owner" ? "Owner View" : "Worker View"}
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
        {/* Header (Mobile nav indicator + shop detail) */}
        <header className="h-14 border-b border-hairline bg-canvas flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-hairline bg-canvas text-body hover:text-foreground md:hidden outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-foreground md:hidden truncate">
              {currentShop ? currentShop.name : <span className="inline-block w-16 h-3 bg-foreground/10 animate-pulse rounded" />}
            </span>
            <span className="hidden md:inline text-xs font-bold text-foreground font-mono">
              Onbillo POS / Shop #{shopId}
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
