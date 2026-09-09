"use client";

import { useState, useRef, useEffect, useCallback, type ComponentType } from "react";
import { Store, ShoppingBag, ReceiptIndianRupee, BarChart3, Plus, Printer, Check, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import OptionWheel from "./OptionWheel";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  {
    id: 1,
    title: "Create Your Shop",
    description: "Register your business, add your shop details, and customize your billing preferences. The setup takes only a few minutes.",
    icon: Store
  },
  {
    id: 2,
    title: "Add Products",
    description: "Import your existing product list or start scanning barcodes. If a product already exists in Onbillo's global database, its details are filled automatically.",
    icon: ShoppingBag
  },
  {
    id: 3,
    title: "Start Billing",
    description: "Scan products, generate invoices, print receipts, and accept payments. Every completed bill automatically updates your inventory.",
    icon: ReceiptIndianRupee
  },
  {
    id: 4,
    title: "Grow Your Business",
    description: "Use reports and analytics to understand sales trends, identify top-performing products, and make better business decisions.",
    icon: BarChart3
  }
];

export default function InteractiveSteps() {
  const [activeStep, setActiveStep] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tickingRef = useRef(false);

  const isDesktopPinned = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  }, []);

  // Page scroll drives the wheel on desktop: pin the section, map the
  // 400vh scroll range onto the 4 steps. Once the range is exhausted,
  // normal vertical scroll resumes automatically (sticky releases).
  useEffect(() => {
    const updateFromScroll = () => {
      tickingRef.current = false;
      const el = containerRef.current;
      if (!el || !isDesktopPinned()) return;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const raw = -rect.top / scrollable;
      const progress = Math.min(Math.max(raw, 0), 1);
      const index = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
      setScrollProgress(progress);
      setActiveStep((prev) => (prev === index + 1 ? prev : index + 1));
    };

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(updateFromScroll);
    };

    updateFromScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isDesktopPinned]);

  // Explicit navigation (arrows / dots) moves the page scroll so the
  // pinned position and the wheel stay in sync. On mobile just set state.
  const scrollToStep = useCallback(
    (stepIndex: number) => {
      const clamped = Math.min(Math.max(stepIndex, 0), STEPS.length - 1);
      const el = containerRef.current;
      if (!el || !isDesktopPinned()) {
        setActiveStep(clamped + 1);
        return;
      }
      const top = el.getBoundingClientRect().top + window.scrollY;
      const scrollable = el.offsetHeight - window.innerHeight;
      const y = top + (clamped / STEPS.length) * scrollable + 2;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveStep(clamped + 1);
    },
    [isDesktopPinned]
  );

  const goToStep = (step: number) => {
    scrollToStep(Math.min(Math.max(step, 1), STEPS.length) - 1);
  };

  // Direct wheel interaction (click / drag) updates the UI immediately.
  // Page scroll remains the source of truth and re-syncs on next scroll.
  const handleWheelChange = useCallback((index: number) => {
    setActiveStep((prev) => (prev === index + 1 ? prev : index + 1));
  }, []);

  const activeIndex = activeStep - 1;
  const active = STEPS[activeIndex];
  const ActiveIcon = active.icon;

  return (
    <div ref={containerRef} className="relative lg:h-[400vh]">
      <div className="lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] flex items-center overflow-hidden py-8 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center w-full">
          {/* Steps List */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <h3 className="text-3xl font-semibold tracking-tight font-sans text-foreground">
                Simple setup
                <br />
                Powerful results
              </h3>

              {/* Pinned scroll progress */}
              <div className="hidden lg:flex items-center gap-1.5" aria-hidden="true">
                {STEPS.map((step, i) => {
                  const filled =
                    scrollProgress * STEPS.length > i + 1
                      ? 1
                      : Math.min(Math.max(scrollProgress * STEPS.length - i, 0), 1);
                  return (
                    <div key={step.id} className="h-1 flex-1 rounded-full bg-hairline overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-primary transition-[width] duration-150"
                        style={{ width: `${filled * 100}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OptionWheel step selector — open, no box */}
            <div className="relative h-[280px] md:h-[300px] overflow-hidden">
              <OptionWheel
                items={STEPS.map((step) => step.title)}
                defaultSelected={0}
                selected={activeIndex}
                onChange={handleWheelChange}
                textColor="var(--color-mute)"
                activeColor="var(--color-brand-primary)"
                side="left"
                fontSize={1.55}
                spacing={1.5}
                curve={1}
                tilt={9}
                blur={1.2}
                fade={0.45}
                minOpacity={0.12}
                smoothing={180}
                inset={20}
                loop={false}
                draggable
                enableWheel={false}
              />
              {/* Edge fade for depth (uses section bg, no box) */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[var(--color-canvas)] to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--color-canvas)] to-transparent" />
            </div>
          </div>

          {/* Right column: step detail on top, mockup below */}
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            {/* Active step detail */}
            <div className="w-full max-w-xl rounded-xl border border-hairline bg-canvas p-4 shadow-level-3" aria-live="polite">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-primary text-white flex items-center justify-center">
                  <ActiveIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono text-mute uppercase tracking-wider block">
                    Step {active.id} of {STEPS.length}
                  </span>
                  <h4 className="text-base font-semibold text-foreground">{active.title}</h4>
                  <p className="text-xs text-mute mt-1 leading-relaxed">{active.description}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => goToStep(activeStep - 1)}
                    disabled={activeStep === 1}
                    aria-label="Previous step"
                    className="w-8 h-8 rounded-lg border border-hairline bg-canvas-soft flex items-center justify-center text-body hover:text-foreground hover:bg-canvas-soft-2 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(activeStep + 1)}
                    disabled={activeStep === STEPS.length}
                    aria-label="Next step"
                    className="w-8 h-8 rounded-lg border border-hairline bg-canvas-soft flex items-center justify-center text-body hover:text-foreground hover:bg-canvas-soft-2 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive mockup below the step detail */}
            <div className="w-full max-w-xl h-[420px] lg:h-[380px] xl:h-[420px] rounded-2xl bg-canvas border border-hairline shadow-level-4 overflow-hidden flex flex-col transition-all duration-300">
              
              {/* Top Mock Header */}
              <div className="h-12 border-b border-hairline px-6 flex items-center justify-between bg-canvas-soft">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <span className="text-[11px] font-mono text-mute bg-canvas-soft-2 px-3 py-1 rounded border border-hairline">
                  {activeStep === 1 && "onbillo.com/setup"}
                  {activeStep === 2 && "onbillo.com/inventory"}
                  {activeStep === 3 && "onbillo.com/billing"}
                  {activeStep === 4 && "onbillo.com/dashboard"}
                </span>
                <div className="w-8" /> {/* Spacer */}
              </div>

              {/* Body Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {activeStep === 1 && (
                  <div className="space-y-4 max-w-sm mx-auto animate-fade-in">
                    <div className="text-center space-y-1">
                      <h5 className="text-sm font-semibold text-foreground">Welcome to Onbillo</h5>
                      <p className="text-xs text-mute">Let&apos;s create your business profile</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-mono text-body block mb-1">Shop/Business Name</label>
                        <input
                          type="text"
                          value="Karan Kirana Store"
                          readOnly
                          className="w-full h-9 px-3 rounded-md bg-canvas-soft border border-hairline text-xs font-medium text-foreground outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono text-body block mb-1">GSTIN (Optional)</label>
                          <input
                            type="text"
                            value="27AAAAA1111A1Z1"
                            readOnly
                            className="w-full h-9 px-3 rounded-md bg-canvas-soft border border-hairline text-xs font-mono text-foreground outline-none focus:border-brand-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-body block mb-1">Shop Category</label>
                          <select
                            disabled
                            className="w-full h-9 px-2 rounded-md bg-canvas-soft border border-hairline text-xs text-foreground outline-none appearance-none"
                          >
                            <option>Kirana & Grocery</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <button className="w-full h-9 rounded-md bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-semibold shadow-sm transition-colors cursor-default">
                      Complete Registration
                    </button>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-hairline">
                      <h5 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Inventory Setup</h5>
                      <button className="flex items-center gap-1 text-[11px] text-brand-primary font-medium">
                        <Plus className="w-3.5 h-3.5" /> Add Custom Product
                      </button>
                    </div>

                    <div className="space-y-2">
                      {/* Item 1 */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-canvas-soft border border-hairline">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs font-mono">
                            Barcode
                          </div>
                          <div>
                            <h6 className="text-xs font-semibold text-foreground">Aashirvaad Shudh Chakki Atta 5kg</h6>
                            <span className="text-[10px] font-mono text-mute">GTIN: 8901725181222</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Auto-filled
                          </span>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-canvas-soft border border-hairline">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs font-mono">
                            Barcode
                          </div>
                          <div>
                            <h6 className="text-xs font-semibold text-foreground">Fortune Soya Health Oil 1L</h6>
                            <span className="text-[10px] font-mono text-mute">GTIN: 8906007281084</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Auto-filled
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-3 rounded-lg border border-dashed border-hairline bg-canvas-soft-2 text-[11px] text-mute">
                      Point camera at any barcode to pull details instantly.
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in h-full">
                    {/* Cart list */}
                    <div className="space-y-3 flex flex-col justify-between h-[300px]">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-mute block uppercase tracking-wider">CURRENT BILL</span>
                        <div className="space-y-1.5 overflow-y-auto max-h-[180px]">
                          <div className="flex justify-between text-xs p-1.5 border-b border-hairline">
                            <span>Tata Salt Lite 1kg</span>
                            <span className="font-medium text-foreground">1 x ₹28</span>
                          </div>
                          <div className="flex justify-between text-xs p-1.5 border-b border-hairline">
                            <span>Maggi Masala Noodles</span>
                            <span className="font-medium text-foreground">2 x ₹28</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-hairline space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>Total Invoice</span>
                          <span className="text-brand-primary">₹56.00</span>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 h-8 rounded bg-brand-primary hover:bg-brand-primary/95 text-white text-[11px] font-semibold flex items-center justify-center gap-1">
                            <Printer className="w-3.5 h-3.5" /> Print
                          </button>
                          <button className="flex-1 h-8 rounded border border-hairline hover:bg-canvas-soft text-[11px] text-body font-semibold">
                            Pay Cash
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Print mockup */}
                    <div className="hidden md:flex flex-col items-center justify-center p-4 bg-canvas-soft-2 rounded-xl border border-hairline">
                      <div className="w-32 bg-white border border-zinc-200 shadow-sm p-3 text-[8px] font-mono text-zinc-800 space-y-2">
                        <div className="text-center font-bold text-[9px] border-b border-dashed border-zinc-300 pb-1">
                          KARAN KIRANA
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Tata Salt</span>
                            <span>₹28.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Maggi Noodles x2</span>
                            <span>₹28.00</span>
                          </div>
                        </div>
                        <div className="border-t border-dashed border-zinc-300 pt-1 space-y-0.5">
                          <div className="flex justify-between font-bold">
                            <span>NET TOTAL</span>
                            <span>₹56.00</span>
                          </div>
                          <div className="flex justify-between text-[7px] text-zinc-500">
                            <span>GST Included</span>
                            <span>₹4.27</span>
                          </div>
                        </div>
                        <div className="text-center text-[7px] text-zinc-400 pt-1">
                          Thank You! Visit Again.
                        </div>
                      </div>
                      <span className="text-[10px] text-mute mt-2 font-mono flex items-center gap-1">
                        <Printer className="w-3 h-3 text-brand-primary" /> Thermal Print Ready
                      </span>
                    </div>
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-hairline">
                      <div>
                        <h5 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Sales Dashboard</h5>
                        <span className="text-lg font-bold text-foreground">₹8,420.00 <span className="text-xs text-emerald-600 font-normal font-sans">+14.2%</span></span>
                      </div>
                      <span className="text-[10px] font-mono text-mute flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Weekly Overview
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-canvas-soft border border-hairline rounded-lg">
                        <span className="text-[10px] text-zinc-500 block uppercase font-mono mb-1">Top Product</span>
                        <h6 className="text-xs font-semibold text-foreground">Tata Salt Lite</h6>
                        <span className="text-[10px] text-mute">142 units sold</span>
                      </div>

                      <div className="p-3 bg-canvas-soft border border-hairline rounded-lg">
                        <span className="text-[10px] text-zinc-500 block uppercase font-mono mb-1">Total Invoices</span>
                        <h6 className="text-xs font-semibold text-foreground">84 Bills Generated</h6>
                        <span className="text-[10px] text-mute">0 billing errors</span>
                      </div>
                    </div>

                    <div className="p-3 bg-canvas-soft border border-hairline rounded-lg space-y-2">
                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">Employee Sales</span>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-body font-medium">Rajesh (Cashier)</span>
                        <span className="font-semibold text-foreground">₹5,320.00</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-body font-medium">Karan (Owner)</span>
                        <span className="font-semibold text-foreground">₹3,100.00</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
