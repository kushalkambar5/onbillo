"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./components/ThemeToggle";
import SpecularButton from "./components/SpecularButton";
import GlobalDatabaseMockup from "./components/GlobalDatabaseMockup";
import HomeRedirect from "./components/HomeRedirect";
import InteractiveSteps from "./components/InteractiveSteps";
import FaqAccordion from "./components/FaqAccordion";
import AccordionGallery from "./components/AccordionGallery";
import MagicBento from "./components/MagicBento";

const SHOP_GALLERY_ITEMS = [
  { image: "/supportings/Kirana_&_Grocery.png", label: "Kirana & Grocery", alt: "Kirana and grocery store" },
  { image: "/supportings/Supermarkets.png", label: "Supermarkets", alt: "Supermarket" },
  { image: "/supportings/Restaurants_&_Cafes.png", label: "Restaurants & Cafes", alt: "Restaurant and cafe" },
  { image: "/supportings/Wholesale_Dealers.png", label: "Wholesale Dealers", alt: "Wholesale dealer" },
  { image: "/supportings/Boutiques_&_Apparel.png", label: "Boutiques & Apparel", alt: "Boutique and apparel store" }
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200">
      <HomeRedirect />
      
      {/* 1. Header/Navigation */}
      <header className="sticky top-0 z-50 h-16 w-full border-b border-hairline bg-canvas transition-colors duration-200">
        <div className="max-w-[1400px] h-full mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 outline-none group focus-visible:ring-2 focus-visible:ring-brand-primary/50 rounded-lg">
            <img src="/favicon.svg" alt="Onbillo Logo" className="w-8 h-8 rounded-lg shadow-sm shadow-brand-primary/20" />
            <span className="text-xl font-bold tracking-tight font-sans text-foreground">
              Onbillo
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            <a
              href="#features"
              className="text-xs font-medium text-body hover:text-foreground px-3 py-1.5 rounded-full hover:bg-canvas-soft-2 transition-all duration-200"
            >
              Features
            </a>
            <a
              href="#database"
              className="text-xs font-medium text-body hover:text-foreground px-3 py-1.5 rounded-full hover:bg-canvas-soft-2 transition-all duration-200"
            >
              Global DB
            </a>
            <a
              href="#how-it-works"
              className="text-xs font-medium text-body hover:text-foreground px-3 py-1.5 rounded-full hover:bg-canvas-soft-2 transition-all duration-200"
            >
              How it Works
            </a>
            <a
              href="#faqs"
              className="text-xs font-medium text-body hover:text-foreground px-3 py-1.5 rounded-full hover:bg-canvas-soft-2 transition-all duration-200"
            >
              FAQs
            </a>
          </nav>

          {/* Action CTAs & Toggle (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="h-8 px-4 rounded-md bg-canvas hover:bg-canvas-soft border border-hairline text-xs font-medium text-foreground transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
            >
              Login
            </Link>
            <SpecularButton
              size="sm"
              radius={8}
              tint="var(--color-brand-primary)"
              tintOpacity={1}
              blur={0}
              textColor="#ffffff"
              lineColor="#ffffff"
              baseColor="#ffffff"
              intensity={1}
              shineSize={10}
              shineFade={40}
              thickness={1}
              speed={0.35}
              followMouse
              proximity={250}
              autoAnimate={false}
              onClick={() => router.push("/sign-up")}
            >
              Get Started
            </SpecularButton>
            <ThemeToggle />
          </div>

          {/* Mobile Menu Action Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-hairline bg-canvas text-body hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-background border-b border-hairline animate-in fade-in slide-in-from-top-5 duration-200 overflow-y-auto">
          <nav className="flex flex-col p-6 space-y-4">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-foreground py-3 border-b border-hairline"
            >
              Features
            </a>
            <a
              href="#database"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-foreground py-3 border-b border-hairline"
            >
              Global DB
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-foreground py-3 border-b border-hairline"
            >
              How it Works
            </a>
            <a
              href="#faqs"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-foreground py-3 border-b border-hairline"
            >
              FAQs
            </a>
            <div className="flex flex-col gap-3 pt-4">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="h-10 w-full rounded-xl bg-canvas hover:bg-canvas-soft border border-hairline text-xs font-semibold text-foreground flex items-center justify-center transition-colors"
              >
                Login
              </Link>
              <SpecularButton
                size="md"
                radius={12}
                tint="var(--color-brand-primary)"
                tintOpacity={1}
                blur={0}
                textColor="#ffffff"
                lineColor="#ffffff"
                baseColor="#ffffff"
                intensity={1}
                shineSize={10}
                shineFade={40}
                thickness={1}
                speed={0.35}
                followMouse
                proximity={250}
                autoAnimate={false}
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/sign-up");
                }}
              >
                Get Started
              </SpecularButton>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* 2. Hero Section */}
        <section className="relative overflow-hidden mesh-gradient-bg border-b border-hairline py-20 lg:py-32">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
            
            

            {/* Display-XL Heading */}
            <h1 className="max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tighter text-foreground leading-[1.05] font-sans mb-6">
              The modern billing & POS built for Indian retail.
            </h1>

            {/* Lead Paragraph */}
            <p className="max-w-2xl text-body text-base md:text-lg font-normal leading-relaxed mb-8">
              Onbillo is a multi-platform billing & POS system for Indian retail shops — from kirana stores to restaurants and wholesale dealers. It combines barcode scanning, thermal printing, GST compliance, role-based access, cloud sync with offline-first resilience, and a global product database.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <SpecularButton
                size="lg"
                radius={100}
                tint="var(--color-brand-primary)"
                tintOpacity={1}
                blur={0}
                textColor="#ffffff"
                lineColor="#ffffff"
                baseColor="#ffffff"
                intensity={1}
                shineSize={10}
                shineFade={40}
                thickness={1}
                speed={0.35}
                followMouse
                proximity={250}
                autoAnimate={false}
                onClick={() => router.push("/sign-up")}
              >
                Get Started
              </SpecularButton>
              <Link
                href="/sign-in"
                className="h-12 px-8 rounded-full bg-canvas hover:bg-canvas-soft border border-hairline text-foreground font-medium text-sm transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
              >
                Login
              </Link>
            </div>

          </div>
        </section>

        {/* 3. Shop Category Strip (Accordion Gallery) */}
        <section className="bg-canvas border-b border-hairline py-12 md:py-16 transition-colors duration-200">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            <span className="text-center text-[10px] font-mono text-mute uppercase tracking-widest block mb-8">
              Supporting shops of all shapes and sizes
            </span>
            <AccordionGallery
              items={SHOP_GALLERY_ITEMS}
              defaultIndex={2}
              expandRatio={0.3}
              trigger="hover"
              height={460}
              gap={10}
              radius={16}
              aspectRatio="6/7"
            />
          </div>
        </section>

        {/* 4. Features Grid */}
        <section id="features" className="py-20 lg:py-32 bg-canvas-soft transition-colors duration-200">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-mono text-brand-primary uppercase tracking-widest block">Core Capabilities</span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Everything you need to run your store.
              </h2>
              <p className="text-body text-sm md:text-base leading-relaxed">
                Onbillo is loaded with retail-focused features that simplify your day-to-day operations, reduce mistakes, and help your retail store grow.
              </p>
            </div>

            {/* MagicBento Grid */}
            <MagicBento
              textAutoHide={true}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={true}
              clickEffect={true}
              spotlightRadius={300}
              particleCount={12}
              glowColor="0, 82, 255"
            />
          </div>
        </section>

        {/* 5. Strongest Feature: Global Barcode Database (Polartiy-Flipped Section) */}
        <section id="database" className="py-20 lg:py-32 bg-canvas-soft border-t border-b border-hairline relative">
          {/* Subtle background highlight for the spotlight */}
          <div className="absolute inset-0 bg-brand-primary/[0.02] dark:bg-brand-primary/[0.04] pointer-events-none" />
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 relative z-10">
            <GlobalDatabaseMockup />
          </div>
        </section>

        {/* 6. How it Works (Interactive Steps) */}
        <section id="how-it-works" className="py-20 lg:py-32 bg-canvas transition-colors duration-200">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            <InteractiveSteps />
          </div>
        </section>

        {/* 7. FAQs */}
        <section id="faqs" className="py-20 lg:py-32 bg-canvas-soft border-t border-hairline transition-colors duration-200">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground font-sans">
                Frequently Asked Questions.
              </h2>
              <p className="text-body text-sm">
                Everything you need to know about setting up and running your shop with Onbillo.
              </p>
            </div>

            <FaqAccordion />

          </div>
        </section>

      </main>

      {/* 8. Footer */}
      <footer className="bg-canvas border-t border-hairline py-16 transition-colors duration-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          
          <div className="space-y-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="Onbillo Logo" className="w-6 h-6 rounded" />
              <span className="font-bold tracking-tight text-foreground text-sm">Onbillo</span>
            </div>
            <p className="text-xs text-mute leading-relaxed max-w-[200px]">
              The premium, community-powered billing & POS system for Indian retail shops.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-mono text-foreground font-semibold uppercase tracking-wider">Product</h4>
            <ul className="space-y-1.5 text-xs text-body font-medium">
              <li>
                <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>
              </li>
              <li>
                <a href="#database" className="hover:text-brand-primary transition-colors">Global Database</a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-primary transition-colors">Pricing</a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-mono text-foreground font-semibold uppercase tracking-wider">Resources</h4>
            <ul className="space-y-1.5 text-xs text-body font-medium">
              <li>
                <a href="#how-it-works" className="hover:text-brand-primary transition-colors">How it Works</a>
              </li>
              <li>
                <a href="#faqs" className="hover:text-brand-primary transition-colors">Help & FAQ</a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-primary transition-colors">Security</a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-mono text-foreground font-semibold uppercase tracking-wider">Legal</h4>
            <ul className="space-y-1.5 text-xs text-body font-medium">
              <li>
                <a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-primary transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-primary transition-colors">GST Compliance Info</a>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 mt-12 pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[10px] font-mono text-mute">
            &copy; 2026 Onbillo. All rights reserved.
          </span>
          <span className="text-[10px] font-mono text-mute">
            Built for Kiranas, Wholesalers & Retailers across India.
          </span>
        </div>
      </footer>

    </div>
  );
}
