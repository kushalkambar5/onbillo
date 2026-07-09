"use client";

import { useEffect, useState, useRef, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { billsApi, productsApi, Bill, ShopProduct, shopsApi, Shop } from "../../../utils/api";
import { mockShops, mockShopProducts } from "../../../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  Check, 
  AlertCircle,
  FileSpreadsheet,
  ScanBarcode,
  Settings,
  Flashlight,
  Video,
  ShoppingBag
} from "lucide-react";
import BarcodeScanner from "../../../components/BarcodeScanner";
import ThermalReceipt from "../../../components/ThermalReceipt";
import { useZxing } from "react-zxing";

interface CartItem {
  shopProduct: ShopProduct;
  quantity: number;
}

export default function ShopPosRegister({
  params: paramsPromise,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const params = use(paramsPromise);
  const shopId = params.shopId;
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "cart">("catalog");
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  
  // Checkout/Receipt State
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [error, setError] = useState("");

  // Barcode Scanner State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");

  // Mobile UI & Scanner States
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [checkoutReviewOpen, setCheckoutReviewOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchEnabledChoice, setTorchEnabledChoice] = useState(false);
  const [mobileCameraError, setMobileCameraError] = useState("");
  const [mobileScannerPaused, setMobileScannerPaused] = useState(false);
  const mobileLastScannedBarcode = useRef<string>("");
  const mobileLastScannedTime = useRef<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setIsMobileOrTablet(window.innerWidth < 1024);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      
      const saved = localStorage.getItem("scanner_torch_enabled");
      setTorchEnabledChoice(saved === "true");

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (err) {
      console.error(err);
    }
  };

  const { ref: mobileVideoRef, torch: mobileTorch } = useZxing({
    paused: !isMobileOrTablet || activeTab !== "cart" || checkoutReviewOpen || mobileScannerPaused,
    wasmUrl: "/zxing_reader.wasm",
    trySkew: true,
    formats: [
      "ean_13",
      "ean_8",
      "upc_a",
      "upc_e",
      "code_128",
      "code_39",
      "code_93",
      "codabar",
      "itf",
      "qr_code",
      "data_matrix",
    ],
    timeBetweenDecodingAttempts: 200,
    constraints: {
      video: {
        facingMode: facingMode,
      },
      audio: false,
    },
    onDecodeResult(result) {
      const decodedText = result.rawValue;
      if (!decodedText) return;

      const now = Date.now();
      if (
        decodedText === mobileLastScannedBarcode.current &&
        now - mobileLastScannedTime.current < 1500
      ) {
        return;
      }
      mobileLastScannedBarcode.current = decodedText;
      mobileLastScannedTime.current = now;

      playBeep();
      handleBarcodeScan(decodedText);
    },
    onError(error) {
      console.error("Mobile barcode scanner error:", error);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setMobileCameraError("Camera permission denied. Please allow camera access.");
      } else if (error instanceof DOMException && error.name === "NotFoundError") {
        setMobileCameraError("No camera found on this device.");
      } else if (error instanceof DOMException && error.name === "NotReadableError") {
        setMobileCameraError("Camera is in use by another application.");
      } else {
        setMobileCameraError("Could not start camera. Ensure permission is granted.");
      }
    },
  });

  // Auto-enable torch if choice is set to true and it becomes available
  useEffect(() => {
    if (
      isMobileOrTablet &&
      activeTab === "cart" &&
      !checkoutReviewOpen &&
      mobileTorch.isAvailable &&
      torchEnabledChoice &&
      !mobileTorch.isOn
    ) {
      mobileTorch.on().catch((err) => {
        console.error("Failed to auto-enable mobile torch:", err);
      });
    }
  }, [
    isMobileOrTablet,
    activeTab,
    checkoutReviewOpen,
    mobileTorch.isAvailable,
    torchEnabledChoice,
    mobileTorch.isOn,
    mobileTorch,
  ]);

  useEffect(() => {
    async function loadPosData() {
      try {
        const isBoneyard = typeof window !== "undefined" && 
          ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
        
        if (isBoneyard) {
          setShop(mockShops[0]);
          setProducts((mockShopProducts[shopId] || mockShopProducts["1"] || []).filter(p => p.isActive));
        } else {
          const token = await getToken();
          const [shopDetail, productsList] = await Promise.all([
            shopsApi.getShop(token, shopId),
            productsApi.getShopProducts(token, shopId)
          ]);
          setShop(shopDetail);
          setProducts(productsList.filter(p => p.isActive));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPosData();

    // Hotkey: press '/' to focus search input
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shopId, getToken]);

  const addToCart = (product: ShopProduct) => {
    const existing = cart.find((item) => item.shopProduct.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.shopProduct.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { shopProduct: product, quantity: 1 }]);
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return;

    const foundProduct = products.find(
      (sp) => sp.product.barcode === cleanBarcode
    );

    if (foundProduct) {
      addToCart(foundProduct);
      setScannerError("");
    } else {
      setScannerError(`Product with barcode "${cleanBarcode}" not found in inventory.`);
      setTimeout(() => {
        setScannerError((prev) =>
          prev === `Product with barcode "${cleanBarcode}" not found in inventory.` ? "" : prev
        );
      }, 4000);
    }
  };

  const updateQuantity = (shopProductId: string, delta: number) => {
    const existing = cart.find((item) => item.shopProduct.id === shopProductId);
    if (!existing) return;
    
    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((item) => item.shopProduct.id !== shopProductId));
    } else {
      setCart(
        cart.map((item) =>
          item.shopProduct.id === shopProductId
            ? { ...item, quantity: newQty }
            : item
        )
      );
    }
  };

  const removeFromCart = (shopProductId: string) => {
    setCart(cart.filter((item) => item.shopProduct.id !== shopProductId));
  };

  // Calculation formulas
  const subtotalPaise = cart.reduce(
    (sum, item) => sum + item.shopProduct.unitPrice * item.quantity,
    0
  );
  
  const taxRate = shop ? parseFloat(shop.taxRate) : 18.0;
  let taxPaise = 0;
  let grandTotalPaise = subtotalPaise;

  if (shop && subtotalPaise > 0) {
    if (shop.taxType === "gst_inclusive") {
      // Prices already include tax. Extract it.
      // taxAmount = total - (total / (1 + rate/100))
      taxPaise = Math.round(subtotalPaise - subtotalPaise / (1 + taxRate / 100));
    } else if (shop.taxType === "gst_exclusive") {
      // Add tax on top of prices.
      taxPaise = Math.round(subtotalPaise * (taxRate / 100));
      grandTotalPaise = subtotalPaise + taxPaise;
    }
  }


  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    setError("");

    try {
      const token = await getToken();
      const payload = {
        items: cart.map((item) => ({
          shopProductId: item.shopProduct.id,
          unitPrice: item.shopProduct.unitPrice,
          quantity: item.quantity
        })),
        notes: notes || undefined
      };

      const bill = await billsApi.createBill(token, shopId, payload);
      setGeneratedBill(bill);
      setReceiptModalOpen(true);
      
      // Clear Cart
      setCart([]);
      setNotes("");
    } catch (err: any) {
      setError(err.message || "Failed to generate bill.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.product.name.toLowerCase().includes(query) ||
      (p.product.barcode && p.product.barcode.includes(query)) ||
      (p.product.brand && p.product.brand.toLowerCase().includes(query))
    );
  });

  const printReceipt = () => {
    window.print();
  };

  return (
    <Skeleton name="shop-pos" loading={loading}>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-canvas border border-hairline rounded-xl p-1 mb-4 shrink-0">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
            activeTab === "catalog"
              ? "bg-brand-primary text-white shadow-sm"
              : "text-body hover:text-foreground"
          }`}
        >
          Catalog
        </button>
        <button
          onClick={() => setActiveTab("cart")}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all duration-150 relative cursor-pointer ${
            activeTab === "cart"
              ? "bg-brand-primary text-white shadow-sm"
              : "text-body hover:text-foreground"
          }`}
        >
          Scan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-140px)] h-[calc(100vh-210px)] select-none">
        {isMobileOrTablet ? (
          // Mobile & Tablet Layout (Unified view with persistent bottom sheet)
          <div className="col-span-1 flex flex-col flex-1 min-h-0 h-full">
            <style>{`
              @keyframes scan-laser {
                0% { top: 4%; }
                50% { top: 96%; }
                100% { top: 4%; }
              }
              .scanner-laser {
                position: absolute;
                left: 4%;
                right: 4%;
                height: 2px;
                background-color: #0052ff;
                box-shadow: 0 0 10px #0052ff, 0 0 4px #0052ff;
                animation: scan-laser 2.2s infinite linear;
                z-index: 10;
              }
              @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slide-up {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
              .animate-fade-in {
                animation: fade-in 0.2s ease-out forwards;
              }
              .animate-slide-up {
                animation: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            `}</style>

            {/* Top Section: Catalog Grid OR Camera Scanner Feed */}
            {activeTab === "catalog" ? (
              /* Catalog Mode */
              <div className="flex flex-col h-[32vh] min-h-[32vh] bg-canvas border border-hairline rounded-2xl p-4 overflow-hidden mb-3.5 shrink-0">
                {/* Search header */}
                <div className="flex gap-2.5 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search by product name, brand..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-xl text-xs transition-all duration-200 h-9 text-foreground animate-fade-in"
                    />
                  </div>
                </div>

                {/* Catalog grid */}
                <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                  {filteredProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <AlertCircle className="w-6 h-6 text-mute mb-1" />
                      <h4 className="text-[10px] font-bold text-foreground">No active products found</h4>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {filteredProducts.map((sp) => (
                        <button
                          key={sp.id}
                          onClick={() => addToCart(sp)}
                          className="p-2.5 text-left border border-hairline bg-canvas hover:bg-canvas-soft rounded-xl transition-all duration-150 hover:border-hairline-strong group outline-none active:scale-[0.98] cursor-pointer"
                        >
                          <div className="text-[8px] font-bold text-mute uppercase font-mono tracking-wider mb-0.5 truncate">
                            {sp.product.brand || "Generic"}
                          </div>
                          <h4 className="text-[10px] font-bold text-foreground line-clamp-2 h-7 leading-tight mb-1">
                            {sp.product.name}
                          </h4>
                          <div className="flex items-baseline justify-between mt-auto">
                            <span className="text-[10px] font-extrabold text-brand-primary">
                              ₹{(sp.unitPrice / 100).toFixed(2)}
                            </span>
                            {sp.product.mrp > sp.unitPrice && (
                              <span className="text-[8px] text-mute line-through">
                                ₹{(sp.product.mrp / 100).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Scan Mode: Camera view */
              <div className="relative bg-black w-full h-[22vh] min-h-[22vh] rounded-2xl overflow-hidden shadow-md shrink-0 mb-3.5 border border-hairline animate-fade-in">
                {mobileCameraError ? (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6 bg-zinc-950 text-white">
                    <span className="text-xl mb-1">⚠️</span>
                    <p className="text-[10px] font-semibold max-w-[200px] leading-relaxed text-red-400">{mobileCameraError}</p>
                    <button
                      onClick={() => {
                        setMobileCameraError("");
                        setMobileScannerPaused(false);
                      }}
                      className="mt-2.5 px-2.5 py-1 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-[9px] rounded-lg transition-colors cursor-pointer"
                    >
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  <video
                    ref={mobileVideoRef}
                    muted
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Scanning Overlay brackets */}
                {!mobileCameraError && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-[70%] h-[70%] border border-brand-primary/20 rounded-xl">
                      <div className="scanner-laser" />
                      <div className="absolute -top-[1px] -left-[1px] w-5 h-5 border-t-2 border-l-2 border-brand-primary rounded-tl-sm" />
                      <div className="absolute -top-[1px] -right-[1px] w-5 h-5 border-t-2 border-r-2 border-brand-primary rounded-tr-sm" />
                      <div className="absolute -bottom-[1px] -left-[1px] w-5 h-5 border-b-2 border-l-2 border-brand-primary rounded-bl-sm" />
                      <div className="absolute -bottom-[1px] -right-[1px] w-5 h-5 border-b-2 border-r-2 border-brand-primary rounded-br-sm" />
                    </div>
                  </div>
                )}

                {/* Error notifications (e.g. product not found) */}
                {scannerError && (
                  <div className="absolute bottom-3 left-3 right-3 z-30 bg-red-600/95 text-white text-[9px] font-bold py-1.5 px-2.5 rounded-lg text-center shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    ⚠️ {scannerError}
                  </div>
                )}

                {/* Floating Camera Actions on the right side */}
                {!mobileCameraError && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-20">
                    {/* Torch Toggle */}
                    {mobileTorch.isAvailable && (
                      <button 
                        onClick={async () => {
                          try {
                            if (mobileTorch.isOn) {
                              await mobileTorch.off();
                              setTorchEnabledChoice(false);
                              localStorage.setItem("scanner_torch_enabled", "false");
                            } else {
                              await mobileTorch.on();
                              setTorchEnabledChoice(true);
                              localStorage.setItem("scanner_torch_enabled", "true");
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                          mobileTorch.isOn 
                            ? "bg-brand-primary border-brand-primary text-white" 
                            : "bg-black/50 border-white/10 text-white/95 hover:bg-black/70"
                        }`}
                        title="Toggle Flashlight"
                      >
                        <Flashlight className="w-4 h-4" />
                      </button>
                    )}
                    {/* Camera Switch (Environment vs User) */}
                    <button 
                      onClick={() => setFacingMode(prev => prev === "environment" ? "user" : "environment")}
                      className="w-9 h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/95 hover:bg-black/70 transition-colors cursor-pointer"
                      title="Switch Camera"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Sheet Cart (Always visible under active tab content, flex-1 min-h-0 to take maximum space) */}
            <div className="bg-canvas border border-hairline rounded-2xl p-5 flex flex-col flex-1 min-h-0 shadow-level-3">
              {/* Grab handle indicator */}
              <div className="w-12 h-1 bg-hairline-strong/20 rounded-full mx-auto mb-4 shrink-0" />
              
              {/* Sheet Header */}
              <div className="flex justify-between items-center mb-3 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Scanned Items</h3>
                  <p className="text-[10px] text-mute font-medium mt-0.5">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} items total
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold text-mute tracking-wider">Total Price</p>
                  <p className="text-lg font-black text-brand-primary font-mono mt-0.5">
                    ₹{(grandTotalPaise / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              <hr className="border-hairline mb-3 shrink-0" />

              {/* List of scanned items */}
              <div className="flex-1 overflow-y-auto min-h-0 mb-4 pr-1">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-mute">
                    <div className="w-12 h-12 rounded-full bg-canvas-soft flex items-center justify-center mb-3 border border-hairline mx-auto">
                      <ShoppingBag className="w-5 h-5 text-mute" />
                    </div>
                    <h4 className="text-[11px] font-bold text-foreground">List is empty</h4>
                    <p className="text-[10px] text-mute mt-1.5 max-w-[200px] leading-normal mx-auto">
                      Scanned items will appear here as you scan them with the camera or select from Catalog.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.shopProduct.id}
                        className="flex items-center justify-between gap-3 bg-canvas border border-hairline p-2.5 rounded-xl transition-colors hover:border-hairline-strong"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-foreground truncate">
                            {item.shopProduct.product.name}
                          </h4>
                          <p className="text-[10px] text-brand-primary font-extrabold mt-0.5">
                            ₹{(item.shopProduct.unitPrice / 100).toFixed(2)}
                          </p>
                        </div>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center border border-hairline rounded-lg bg-canvas shrink-0">
                          <button
                            onClick={() => updateQuantity(item.shopProduct.id, -1)}
                            className="p-1 hover:bg-canvas-soft text-body rounded-l-lg transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-foreground font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.shopProduct.id, 1)}
                            className="p-1 hover:bg-canvas-soft text-body rounded-r-lg transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.shopProduct.id)}
                          className="p-1.5 text-mute hover:text-error-deep hover:bg-error-soft/30 rounded-lg transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Order Button */}
              <button
                onClick={() => setCheckoutReviewOpen(true)}
                disabled={cart.length === 0}
                className="w-full h-11 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl transition-all duration-200 shadow-sm shadow-brand-primary/10 cursor-pointer disabled:bg-hairline-strong/20 disabled:text-mute disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Review Order</span>
              </button>
            </div>

            {/* Mobile Checkout Review Slide-Up Panel / Drawer */}
            {checkoutReviewOpen && (
              <div className="fixed inset-0 z-[200] bg-black/60 flex items-end justify-center animate-fade-in">
                <div className="bg-canvas border-t border-hairline w-full rounded-t-3xl p-6 flex flex-col max-h-[85vh] animate-slide-up shadow-level-4">
                  <div className="w-12 h-1 bg-hairline-strong/20 rounded-full mx-auto mb-4 shrink-0" />
                  
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-sm font-bold text-foreground">Review & Checkout</h3>
                    <button 
                      onClick={() => setCheckoutReviewOpen(false)}
                      className="text-xs font-bold text-brand-primary hover:text-brand-secondary px-2.5 py-1.5 rounded-lg bg-brand-primary/5 cursor-pointer"
                    >
                      Go Back
                    </button>
                  </div>

                  {/* Items summary */}
                  <div className="flex-1 overflow-y-auto min-h-0 mb-4 border border-hairline rounded-xl p-3 bg-canvas-soft">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-mute mb-2">Items Summary</h4>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.shopProduct.id} className="flex justify-between text-xs">
                          <span className="text-body font-medium truncate max-w-[220px]">
                            {item.shopProduct.product.name} <span className="text-mute font-bold">x {item.quantity}</span>
                          </span>
                          <span className="font-mono text-foreground font-semibold">
                            ₹{((item.shopProduct.unitPrice * item.quantity) / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes input */}
                  <div className="mb-4 shrink-0">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-mute mb-1.5">Transaction Notes</label>
                    <input
                      type="text"
                      placeholder="Add internal transaction notes (optional)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full text-xs px-3 border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-xl h-10 text-foreground"
                    />
                  </div>

                  {/* Totals */}
                  <div className="border-t border-hairline pt-3 space-y-2 mb-5 text-xs font-semibold text-body shrink-0">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{(subtotalPaise / 100).toFixed(2)}</span>
                    </div>
                    {shop?.taxType !== "no_tax" && (
                      <div className="flex justify-between">
                        <span>GST ({taxRate}% {shop?.taxType === "gst_inclusive" ? "Incl" : "Excl"})</span>
                        <span className="font-mono text-mute">₹{(taxPaise / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-extrabold text-foreground border-t border-hairline pt-2">
                      <span>Grand Total</span>
                      <span className="font-mono text-brand-primary">₹{(grandTotalPaise / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Action Button */}
                  {error && (
                    <div className="mb-3 text-[10px] font-bold text-error-deep bg-error-soft p-2 rounded-lg shrink-0">
                      ⚠️ {error}
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      await handleCheckout();
                      setCheckoutReviewOpen(false);
                    }}
                    disabled={checkoutLoading}
                    className="w-full h-12 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl transition-all duration-200 shadow-sm shadow-brand-primary/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                  >
                    {checkoutLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Compiling invoice…</span>
                      </>
                    ) : (
                      "Confirm & Generate Invoice"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Desktop Layout (Remains exactly identical to the original layout)
          <>
            {/* 1. Catalog / Search panel (Left side) */}
            <div className={`lg:col-span-7 flex flex-col bg-canvas border border-hairline rounded-2xl p-5 overflow-hidden ${
              activeTab === "catalog" ? "flex" : "hidden lg:flex"
            }`}>
              {/* Search header */}
              <div className="flex gap-2.5 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by product name, brand, or scan barcode (Press '/' to focus)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-xl text-xs transition-all duration-200 h-10 text-foreground"
                  />
                </div>
                <button
                  onClick={() => {
                    if (isMobileOrTablet) {
                      setActiveTab("cart");
                    } else {
                      setScannerOpen(true);
                    }
                  }}
                  className="h-10 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm shadow-brand-primary/10"
                  title="Scan barcode with camera"
                >
                  <ScanBarcode className="w-4 h-4" />
                  <span>Scan Barcode</span>
                </button>
              </div>

              {/* Catalog grid */}
              <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <AlertCircle className="w-8 h-8 text-mute mb-2" />
                    <h4 className="text-xs font-bold text-foreground">No active products found</h4>
                    <p className="text-[10px] text-mute mt-1.5 max-w-[280px]">
                      Search returned no results or there are no active items in your shop inventory yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredProducts.map((sp) => (
                      <button
                        key={sp.id}
                        onClick={() => addToCart(sp)}
                        className="p-3 text-left border border-hairline bg-canvas hover:bg-canvas-soft rounded-xl transition-all duration-150 hover:border-hairline-strong group outline-none active:scale-[0.98] cursor-pointer"
                      >
                        <div className="text-[9px] font-bold text-mute uppercase font-mono tracking-wider mb-1 truncate">
                          {sp.product.brand || "Generic"}
                        </div>
                        <h4 className="text-xs font-bold text-foreground line-clamp-2 h-8 leading-tight mb-2">
                          {sp.product.name}
                        </h4>
                        <div className="flex items-baseline justify-between mt-auto">
                          <span className="text-xs font-extrabold text-brand-primary">
                            ₹{(sp.unitPrice / 100).toFixed(2)}
                          </span>
                          {sp.product.mrp > sp.unitPrice && (
                            <span className="text-[9px] text-mute line-through">
                              ₹{(sp.product.mrp / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Billing Checkout panel (Right side) */}
            <div className={`lg:col-span-5 flex flex-col bg-canvas border border-hairline rounded-2xl p-5 overflow-hidden ${
              activeTab === "cart" ? "flex" : "hidden lg:flex"
            }`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-3 font-mono">
                Current Checkout Bill
              </h3>

              {/* Cart Item Listing */}
              <div className="flex-1 overflow-y-auto min-h-0 mb-4 border border-hairline rounded-xl p-2 bg-canvas-soft">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-mute">
                    <span className="text-2xl mb-2">🛒</span>
                    <h4 className="text-[11px] font-bold text-foreground">Cart is empty</h4>
                    <p className="text-[10px] text-mute mt-1">
                      Select products from the left catalog or scan barcode to compile an invoice.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.shopProduct.id}
                        className="flex items-center justify-between gap-3 bg-canvas border border-hairline p-2.5 rounded-lg transition-colors hover:border-hairline-strong"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[11px] font-bold text-foreground truncate">
                            {item.shopProduct.product.name}
                          </h4>
                          <p className="text-[10px] text-brand-primary font-bold mt-0.5">
                            ₹{(item.shopProduct.unitPrice / 100).toFixed(2)}
                          </p>
                        </div>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center border border-hairline rounded-md bg-canvas shrink-0">
                          <button
                            onClick={() => updateQuantity(item.shopProduct.id, -1)}
                            className="p-1 hover:bg-canvas-soft text-body rounded-l-md transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-foreground font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.shopProduct.id, 1)}
                            className="p-1 hover:bg-canvas-soft text-body rounded-r-md transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.shopProduct.id)}
                          className="p-1.5 text-mute hover:text-error-deep hover:bg-error-soft/30 rounded-md transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Add internal transaction notes (optional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg h-8 text-foreground"
                />
              </div>

              {/* Pricing Summary */}
              <div className="border-t border-hairline pt-3 space-y-2 mb-4 text-xs font-semibold text-body">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{(subtotalPaise / 100).toFixed(2)}</span>
                </div>
                {shop?.taxType !== "no_tax" && (
                  <div className="flex justify-between">
                    <span>GST ({taxRate}% {shop?.taxType === "gst_inclusive" ? "Incl" : "Excl"})</span>
                    <span className="font-mono text-mute">₹{(taxPaise / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-foreground border-t border-hairline pt-2">
                  <span>Grand Total</span>
                  <span className="font-mono text-brand-primary">₹{(grandTotalPaise / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Button */}
              {error && (
                <div className="mb-3 text-[10px] font-bold text-error-deep bg-error-soft p-2 rounded-lg">
                  ⚠️ {error}
                </div>
              )}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutLoading}
                className="w-full h-11 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-sm shadow-brand-primary/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Compiling invoice…</span>
                  </>
                ) : (
                  "Generate Invoice Bill"
                )}
              </button>
            </div>
          </>
        )}

      {/* 3. Thermal Receipt Preview Modal */}
      {receiptModalOpen && generatedBill && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-canvas border border-hairline rounded-2xl shadow-level-4 max-w-sm w-full p-6 relative flex flex-col max-h-[90vh]">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-widest text-center border-b border-hairline pb-3 mb-4 print:hidden">
              Invoice Generated Successfully
            </h2>

            <ThermalReceipt bill={generatedBill} shop={shop} />

            {/* Actions */}
            <div className="mt-4 flex gap-3.5 pt-3 border-t border-hairline shrink-0 print:hidden">
              <button
                onClick={() => {
                  setReceiptModalOpen(false);
                  setGeneratedBill(null);
                }}
                className="flex-1 h-10 border border-hairline hover:bg-canvas-soft text-foreground text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Register
              </button>
              <button
                onClick={printReceipt}
                className="flex-1 h-10 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-brand-primary/10"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
          setScannerError("");
        }}
        onScan={handleBarcodeScan}
        continuous={true}
        scanError={scannerError}
        title="Scan Billing Barcode"
      />
    </div>
    </Skeleton>
  );
}
