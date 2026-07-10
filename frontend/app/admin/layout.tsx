"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usersApi, User } from "../utils/api";
import { mockUser } from "../utils/api/mockData";
import DevMockModeIndicator from "../components/DevMockModeIndicator";
import ThemeToggle from "../components/ThemeToggle";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Users, 
  Store, 
  FileCheck,
  ArrowLeft,
  Menu,
  X,
  PlusCircle,
  Layers,
  Settings,
  FileX
} from "lucide-react";

export default function AdminWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const isBoneyard = typeof window !== "undefined" && 
          ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
        
        if (isBoneyard) {
          setCurrentUser(mockUser);
          setIsAuthorized(true);
          setLoading(false);
          return;
        }

        const token = await getToken();
        const profile = await usersApi.getMe(token);
        setCurrentUser(profile);
        
        if (profile.role === "app_admin") {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          // Redirect unauthorized to home after 3s
          setTimeout(() => {
            router.push("/");
          }, 3000);
        }
      } catch (err) {
        console.error("Admin layout error:", err);
      } finally {
        setLoading(false);
      }
    }
    checkAdminAuth();
  }, [getToken, router]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Shops",
      href: "/admin/shops",
      icon: Store,
    },
    {
      name: "Add Products",
      href: "/admin/products/add",
      icon: PlusCircle,
    },
    {
      name: "Approve Products",
      href: "/admin/products/pending",
      icon: FileCheck,
    },
    {
      name: "Rejected Products",
      href: "/admin/products/rejected",
      icon: FileX,
    },
    {
      name: "Products",
      href: "/admin/products",
      icon: Layers,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];



  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100">
        <div className="w-full max-w-md bg-zinc-900 border border-red-900/30 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-800/30 flex items-center justify-center mx-auto mb-4 text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold">Admin Privileges Required</h1>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            This workspace section is restricted to Platform Administrators. Your account is not authorized.
          </p>
          <p className="text-[10px] text-zinc-500 mt-4 animate-pulse">
            Redirecting you to the landing page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100 antialiased font-sans">
      {/* 1. Admin Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-900 shrink-0 h-screen sticky top-0">
        {/* Header: Admin Branding */}
        <div className="p-5 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-brand-primary rounded-lg flex items-center justify-center shrink-0 shadow shadow-brand-primary/40">
              🛡️
            </div>
            <div>
              <span className="text-xs font-bold tracking-tight text-white block">
                Onbillo Admin
              </span>
              <span className="text-[9px] font-mono font-bold text-brand-primary uppercase tracking-wide">
                Platform Console
              </span>
            </div>
          </div>
        </div>

        {/* Admin Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 outline-none ${
                  active
                    ? "bg-zinc-800 text-white border border-zinc-700/50"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-brand-primary" : "text-zinc-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Exit back link */}
        <div className="px-3 pb-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-zinc-500" />
            Exit Admin Panel
          </Link>
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-zinc-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <UserButton />
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-white truncate">
                {currentUser?.name}
              </p>
              <span className="text-[8px] font-mono text-zinc-500 block uppercase font-bold tracking-wider">
                System Admin
              </span>
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
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content panel */}
          <div className="relative flex flex-col w-full max-w-[280px] bg-zinc-900 border-r border-zinc-800 h-full p-4 animate-in slide-in-from-left duration-200 text-zinc-100">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-brand-primary rounded-lg flex items-center justify-center shrink-0 shadow shadow-brand-primary/40">
                  🛡️
                </div>
                <span className="font-bold tracking-tight text-white text-sm">Onbillo Admin</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 outline-none ${
                      active
                        ? "bg-zinc-800 text-white border border-zinc-700/50"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-brand-primary" : "text-zinc-500"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Exit back link */}
            <div className="pb-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 shrink-0 text-zinc-500" />
                Exit Admin Panel
              </Link>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3 mt-auto">
              <div className="flex items-center gap-2 overflow-hidden">
                <UserButton />
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold text-white truncate">
                    {currentUser?.name}
                  </p>
                  <span className="text-[8px] font-mono text-zinc-500 block uppercase font-bold tracking-wider">
                    System Admin
                  </span>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white md:hidden outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
              aria-label="Open administration menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-[10px] sm:text-xs font-bold text-white font-mono uppercase tracking-widest truncate max-w-[200px] sm:max-w-none">
              Platform Administration Console
            </span>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <UserButton />
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-950">
          {children}
        </main>
      </div>

      <DevMockModeIndicator />
    </div>
  );
}
