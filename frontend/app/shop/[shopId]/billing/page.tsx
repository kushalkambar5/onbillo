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
  ScanBarcode
} from "lucide-react";
import BarcodeScanner from "../../../components/BarcodeScanner";
import ThermalReceipt from "../../../components/ThermalReceipt";

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

  const searchInputRef = useRef<HTMLInputElement>(null);

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
          Catalog ({filteredProducts.length})
        </button>
        <button
          onClick={() => setActiveTab("cart")}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all duration-150 relative cursor-pointer ${
            activeTab === "cart"
              ? "bg-brand-primary text-white shadow-sm"
              : "text-body hover:text-foreground"
          }`}
        >
          Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          {cart.length > 0 && (
            <span className="absolute top-1.5 right-6 w-2 h-2 rounded-full bg-error-deep animate-ping" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-140px)] h-[calc(100vh-210px)] select-none">
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
            onClick={() => setScannerOpen(true)}
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
