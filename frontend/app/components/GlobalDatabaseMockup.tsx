"use client";

import { useState } from "react";
import { ScanBarcode, CheckCircle2, Info, ArrowRight, Database, Eye } from "lucide-react";

interface Product {
  barcode: string;
  name: string;
  price: string;
  gst: string;
  hsn: string;
  category: string;
  brand: string;
}

const DEMO_PRODUCTS: Product[] = [
  {
    barcode: "8901058002315",
    name: "Tata Salt Lite 1kg",
    price: "₹28.00",
    gst: "0% (Exempt)",
    hsn: "25010021",
    category: "Grocery / Pantry",
    brand: "Tata Consumer Products"
  },
  {
    barcode: "8901058895627",
    name: "Maggi 2-Min Masala Noodles 70g",
    price: "₹14.00",
    gst: "18%",
    hsn: "19023010",
    category: "Instant Foods",
    brand: "Nestlé India"
  },
  {
    barcode: "8901396323119",
    name: "Dettol Liquid Handwash Refill 175ml",
    price: "₹99.00",
    gst: "18%",
    hsn: "34013011",
    category: "Personal Care",
    brand: "Reckitt Benckiser"
  }
];

export default function GlobalDatabaseMockup() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  const handleScan = (product: Product) => {
    setIsScanning(true);
    setScanComplete(false);
    setSelectedProduct(product);

    // Simulate scanning beam animation duration
    setTimeout(() => {
      playBeep();
      setIsScanning(false);
      setScanComplete(true);
    }, 900);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* Left Content */}
      <div className="lg:col-span-6 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft border border-brand-light/30 text-brand-primary text-xs font-mono">
          <Database className="w-3.5 h-3.5" />
          <span>OUR STRONGEST FEATURE</span>
        </div>
        
        <h3 className="text-3xl font-semibold tracking-tight font-sans text-foreground leading-tight">
          Scan once. Everyone benefits.
        </h3>
        
        <p className="text-body text-base max-w-lg leading-relaxed">
          Onbillo maintains a growing, verified barcode database. If another shop in India has already added a product, you&apos;ll get its details instantly without entering them manually. Setup your entire shop inventory in hours, not weeks.
        </p>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">Less manual work</h4>
              <p className="text-xs text-mute mt-0.5">Stop typing product names, tax weights, and categories for every new box.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">Faster product setup</h4>
              <p className="text-xs text-mute mt-0.5">Just point your scanner and scan. The product detail is already in the cloud.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">Community-powered database</h4>
              <p className="text-xs text-mute mt-0.5">A collaborative, verified catalog designed specifically for Indian retail shops.</p>
            </div>
          </div>
        </div>

        {/* Demo trigger buttons */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-mono text-mute uppercase tracking-wider block">Click a product to test scanning:</span>
          <div className="flex flex-wrap gap-2">
            {DEMO_PRODUCTS.map((prod) => (
              <button
                key={prod.barcode}
                onClick={() => handleScan(prod)}
                disabled={isScanning}
                className={`px-4 py-2 text-xs font-medium rounded-full border transition-all duration-200 cursor-pointer ${
                  selectedProduct?.barcode === prod.barcode && scanComplete
                    ? "bg-brand-primary border-brand-primary text-white shadow-sm"
                    : "bg-canvas hover:bg-canvas-soft-2 border-hairline text-foreground"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {prod.name.split(" ")[0]} {prod.name.split(" ")[1]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Mockup Screen */}
      <div className="lg:col-span-6 flex justify-center">
        <div className="relative w-full max-w-sm h-[480px] rounded-3xl bg-zinc-950 border-[6px] border-zinc-800 shadow-level-4 flex flex-col overflow-hidden select-none">
          {/* Status bar */}
          <div className="h-6 bg-zinc-950 px-5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>Onbillo POS v1.2</span>
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" title="Connected to Global DB" />
          </div>

          {/* Camera Scanner View */}
          <div className="relative h-44 bg-zinc-900 overflow-hidden flex items-center justify-center border-b border-zinc-800">
            {/* Camera Viewfinder Corners */}
            <div className="absolute inset-x-12 inset-y-6 border border-dashed border-zinc-700/50 rounded flex items-center justify-center">
              <ScanBarcode className={`w-16 h-16 transition-colors duration-300 ${isScanning ? "text-brand-primary scale-110" : "text-zinc-600"}`} />
              
              {/* Laser line */}
              {isScanning && (
                <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce" />
              )}
            </div>

            {/* Hint overlay */}
            <div className="absolute bottom-2 text-[9px] text-zinc-500 font-mono">
              {isScanning ? "Scanning barcode..." : "Awaiting scan trigger..."}
            </div>

            {/* Scan success green flash */}
            {scanComplete && !isScanning && (
              <div className="absolute inset-0 bg-emerald-500/10 animate-fade-out" />
            )}
          </div>

          {/* POS Details Panel */}
          <div className="flex-1 bg-zinc-950 p-4 flex flex-col">
            <h4 className="text-xs font-mono text-zinc-400 mb-3 flex items-center justify-between">
              <span>SCANNER OUTPUT</span>
              {scanComplete && (
                <span className="text-[10px] text-brand-primary bg-brand-soft border border-brand-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Global Match
                </span>
              )}
            </h4>

            {selectedProduct ? (
              <div className={`space-y-3 flex-1 flex flex-col justify-between transition-all duration-300 ${isScanning ? "opacity-30 blur-xs" : "opacity-100"}`}>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Barcode / GTIN</span>
                    <span className="text-sm font-mono text-zinc-200">{selectedProduct.barcode}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Product Title</span>
                    <span className="text-sm font-medium text-white">{selectedProduct.name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">Default Retail</span>
                      <span className="text-sm text-white font-medium">{selectedProduct.price}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">HSN Code</span>
                      <span className="text-sm text-white font-mono">{selectedProduct.hsn}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">GST Rate</span>
                      <span className="text-sm text-zinc-200">{selectedProduct.gst}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">Category</span>
                      <span className="text-sm text-zinc-200 truncate block">{selectedProduct.category}</span>
                    </div>
                  </div>
                </div>

                {scanComplete && (
                  <div className="bg-zinc-900/60 rounded-lg p-2.5 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed flex gap-2">
                    <Info className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span>
                      Details loaded from <strong>Onbillo Global DB</strong>. Pressing bill adds this instantly without typing.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-800 rounded-lg">
                <Database className="w-8 h-8 text-zinc-800 mb-2" />
                <p className="text-xs text-zinc-600 max-w-[200px]">
                  Click one of the product buttons on the left to simulate a live barcode scan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
