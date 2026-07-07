import Link from "next/link";
import { ScanBarcode, BarChart3, Calculator, TrendingUp, Printer, WifiOff, Zap, ShieldCheck, HelpCircle, Store, ShoppingBag } from "lucide-react";
import ThemeToggle from "./components/ThemeToggle";
import GlobalDatabaseMockup from "./components/GlobalDatabaseMockup";
import InteractiveSteps from "./components/InteractiveSteps";
import FaqAccordion from "./components/FaqAccordion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200">
      
      {/* 1. Header/Navigation */}
      <header className="sticky top-0 z-50 h-16 w-full border-b border-hairline bg-canvas/80 backdrop-blur-md transition-colors duration-200">
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

          {/* Action CTAs & Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="h-8 px-4 rounded-md bg-canvas hover:bg-canvas-soft border border-hairline text-xs font-medium text-foreground transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="h-8 px-4 rounded-md bg-brand-primary hover:bg-brand-primary/90 text-xs font-medium text-white shadow-sm transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
            >
              Get Started
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

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
              <Link
                href="/register"
                className="h-12 px-8 rounded-full bg-brand-primary hover:bg-brand-primary/95 text-white font-medium text-sm transition-all duration-200 flex items-center justify-center cursor-pointer shadow-md shadow-brand-primary/10 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="h-12 px-8 rounded-full bg-canvas hover:bg-canvas-soft border border-hairline text-foreground font-medium text-sm transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
              >
                Login
              </Link>
            </div>

          </div>
        </section>

        {/* 3. Shop Category Strip (Logo Strip) */}
        <section className="bg-canvas border-b border-hairline py-8 transition-colors duration-200">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            <span className="text-center text-[10px] font-mono text-mute uppercase tracking-widest block mb-6">
              Supporting shops of all shapes and sizes
            </span>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 opacity-80">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-canvas-soft border border-hairline text-xs font-semibold text-body">
                <Store className="w-4 h-4 text-brand-primary" />
                <span>Kirana & Grocery</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-canvas-soft border border-hairline text-xs font-semibold text-body">
                <ShieldCheck className="w-4 h-4 text-brand-primary" />
                <span>Wholesale Dealers</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-canvas-soft border border-hairline text-xs font-semibold text-body">
                <Zap className="w-4 h-4 text-brand-primary" />
                <span>Restaurants & Cafes</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-canvas-soft border border-hairline text-xs font-semibold text-body">
                <Store className="w-4 h-4 text-brand-primary" />
                <span>Supermarkets</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-canvas-soft border border-hairline text-xs font-semibold text-body">
                <ShoppingBag className="w-4 h-4 text-brand-primary" />
                <span>Boutiques & Apparel</span>
              </div>
            </div>
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

            {/* 3x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature 1: Barcode Scanner */}
              <div className="bg-canvas rounded-xl p-6 border border-hairline hover:border-brand-primary/30 transition-all duration-300 shadow-level-3 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform duration-300">
                    <ScanBarcode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Barcode Scanner</h3>
                    <p className="text-xs text-body mt-2 leading-relaxed">
                      Scan any barcode using your phone camera or a barcode scanner. Product details are filled automatically, helping you create bills in seconds and reducing manual entry errors.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-hairline">
                  <span className="text-[10px] font-mono text-mute uppercase tracking-wider block mb-2">Benefits:</span>
                  <ul className="text-xs text-foreground font-medium space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Faster checkout
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Fewer typing mistakes
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Better customer experience
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature 2: Reports */}
              <div className="bg-canvas rounded-xl p-6 border border-hairline hover:border-brand-primary/30 transition-all duration-300 shadow-level-3 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Reports</h3>
                    <p className="text-xs text-body mt-2 leading-relaxed">
                      View daily, weekly, and monthly sales reports. Track your revenue, top-selling products, and employee performance from one dashboard.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-hairline">
                  <span className="text-[10px] font-mono text-mute uppercase tracking-wider block mb-2">Benefits:</span>
                  <ul className="text-xs text-foreground font-medium space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Sales tracking
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Profit analysis
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Better business decisions
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature 3: GST */}
              <div className="bg-canvas rounded-xl p-6 border border-hairline hover:border-brand-primary/30 transition-all duration-300 shadow-level-3 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform duration-300">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">GST Compliance</h3>
                    <p className="text-xs text-body mt-2 leading-relaxed">
                      Generate professional GST-compliant invoices with tax calculations handled automatically, reducing billing mistakes and simplifying filing.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-hairline">
                  <span className="text-[10px] font-mono text-mute uppercase tracking-wider block mb-2">Benefits:</span>
                  <ul className="text-xs text-foreground font-medium space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Professional invoices
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Automatic tax calculation
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Easier accounting
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature 4: Analytics */}
              <div className="bg-canvas rounded-xl p-6 border border-hairline hover:border-brand-primary/30 transition-all duration-300 shadow-level-3 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Analytics</h3>
                    <p className="text-xs text-body mt-2 leading-relaxed">
                      Discover your best-selling products, busiest hours, and overall business trends through easy-to-read charts and statistics.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-hairline">
                  <span className="text-[10px] font-mono text-mute uppercase tracking-wider block mb-2">Benefits:</span>
                  <ul className="text-xs text-foreground font-medium space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Track business growth
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Identify popular products
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Improve purchasing decisions
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature 5: Printer Support */}
              <div className="bg-canvas rounded-xl p-6 border border-hairline hover:border-brand-primary/30 transition-all duration-300 shadow-level-3 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform duration-300">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Printer Support</h3>
                    <p className="text-xs text-body mt-2 leading-relaxed">
                      Connect thermal printers and print professional receipts immediately after billing with just one click. Supports most Bluetooth and USB POS printers.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-hairline">
                  <span className="text-[10px] font-mono text-mute uppercase tracking-wider block mb-2">Benefits:</span>
                  <ul className="text-xs text-foreground font-medium space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Fast receipt printing
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Supports common POS printers
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Better customer service
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature 6: Offline Support */}
              <div className="bg-canvas rounded-xl p-6 border border-hairline hover:border-brand-primary/30 transition-all duration-300 shadow-level-3 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform duration-300">
                    <WifiOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Offline Support</h3>
                    <p className="text-xs text-body mt-2 leading-relaxed">
                      Even if your internet connection goes down, continue creating bills and managing your shop. Everything syncs automatically once you&apos;re back online.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-hairline">
                  <span className="text-[10px] font-mono text-mute uppercase tracking-wider block mb-2">Benefits:</span>
                  <ul className="text-xs text-foreground font-medium space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> No downtime
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Reliable billing
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Automatic synchronization
                    </li>
                  </ul>
                </div>
              </div>

            </div>
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
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-brand-primary uppercase tracking-widest block">Got Questions?</span>
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
