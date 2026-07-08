"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { productsApi, Product } from "../../../../utils/api";
import { 
  Search, 
  PlusCircle, 
  Send, 
  Check, 
  HelpCircle,
  FileCheck2,
  FolderOpen
} from "lucide-react";

export default function AddProducts({
  params: paramsPromise,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const params = use(paramsPromise);
  const shopId = parseInt(params.shopId, 10);
  const { getToken } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"search" | "request">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [globalProducts, setGlobalProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Add-to-shop price dialog state
  const [addingProduct, setAddingProduct] = useState<Product | null>(null);
  const [sellingPrice, setSellingPrice] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Request new product form state
  const [requestForm, setRequestForm] = useState({
    barcode: "",
    name: "",
    brand: "",
    category: "",
    mrp: ""
  });
  const [requestLoading, setRequestLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const token = await getToken();
      const list = await productsApi.searchGlobalProducts(token, searchQuery);
      setGlobalProducts(list);
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to search global database.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [getToken]);

  const triggerAddToShop = (prod: Product) => {
    setAddingProduct(prod);
    setSellingPrice((prod.mrp / 100).toFixed(2));
    setMessage({ text: "", type: "" });
  };

  const submitAddToShop = async () => {
    if (!addingProduct) return;
    const priceFloat = parseFloat(sellingPrice);
    if (isNaN(priceFloat) || priceFloat < 0) {
      setMessage({ text: "Please enter a valid price.", type: "error" });
      return;
    }

    setAddLoading(true);
    try {
      const token = await getToken();
      const pricePaise = Math.round(priceFloat * 100);
      await productsApi.addGlobalProductToShop(token, shopId, addingProduct.id, pricePaise);
      
      setMessage({ 
        text: `Successfully added ${addingProduct.name} to your shop inventory!`, 
        type: "success" 
      });
      setAddingProduct(null);
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to add product to shop.", type: "error" });
    } finally {
      setAddLoading(false);
    }
  };

  const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequestForm({
      ...requestForm,
      [e.target.name]: e.target.value
    });
  };

  const submitGlobalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.name || !requestForm.mrp) {
      setMessage({ text: "Product Name and MRP are required fields.", type: "error" });
      return;
    }

    const mrpFloat = parseFloat(requestForm.mrp);
    if (isNaN(mrpFloat) || mrpFloat <= 0) {
      setMessage({ text: "Please enter a valid MRP.", type: "error" });
      return;
    }

    setRequestLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const token = await getToken();
      const mrpPaise = Math.round(mrpFloat * 100);
      await productsApi.requestNewGlobalProduct(token, {
        barcode: requestForm.barcode,
        name: requestForm.name,
        brand: requestForm.brand,
        category: requestForm.category,
        mrp: mrpPaise
      });

      setMessage({ 
        text: `Global registration request submitted for ${requestForm.name}. It is now pending admin approval.`, 
        type: "success" 
      });
      
      // Reset form
      setRequestForm({
        barcode: "",
        name: "",
        brand: "",
        category: "",
        mrp: ""
      });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to submit request.", type: "error" });
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-sans">Expand Shop Catalog</h1>
        <p className="text-xs text-mute mt-1">
          Link products from Onbillo's shared global retail index or request new additions.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-hairline gap-4 text-xs font-semibold">
        <button
          onClick={() => {
            setActiveTab("search");
            setMessage({ text: "", type: "" });
          }}
          className={`pb-3 px-1 transition-all duration-200 outline-none cursor-pointer ${
            activeTab === "search" 
              ? "border-b-2 border-brand-primary text-brand-primary font-bold" 
              : "text-mute hover:text-foreground"
          }`}
        >
          Search Global Database
        </button>
        <button
          onClick={() => {
            setActiveTab("request");
            setMessage({ text: "", type: "" });
          }}
          className={`pb-3 px-1 transition-all duration-200 outline-none cursor-pointer ${
            activeTab === "request" 
              ? "border-b-2 border-brand-primary text-brand-primary font-bold" 
              : "text-mute hover:text-foreground"
          }`}
        >
          Request Global Product
        </button>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-lg text-xs font-semibold border flex items-start gap-2.5 ${
            message.type === "success"
              ? "bg-canvas-soft border-brand-primary/15 text-brand-primary"
              : "bg-error-soft border-error/15 text-error-deep"
          }`}
        >
          <span className="mt-0.5">{message.type === "success" ? "✓" : "⚠️"}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB 1: Search Global DB */}
      {activeTab === "search" && (
        <div className="space-y-6">
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
              <input
                type="text"
                placeholder="Search global items by name, category, or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-lg text-xs transition-all duration-200 h-10 text-foreground"
              />
            </div>
            <button
              type="submit"
              className="px-5 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Results Grid */}
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <svg className="animate-spin h-6 w-6 text-brand-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : globalProducts.length === 0 ? (
            <div className="bg-canvas border border-hairline rounded-2xl p-8 text-center text-mute max-w-2xl">
              <FolderOpen className="w-8 h-8 mx-auto text-mute mb-2" />
              <h4 className="text-xs font-bold text-foreground">No global products match search query</h4>
              <p className="text-[10px] text-mute mt-1">
                If the item doesn't exist in our global registry, you can submit a registration request in the next tab.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
              {globalProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-canvas border border-hairline rounded-2xl p-4.5 shadow-sm flex items-center justify-between gap-4 transition-all duration-150 hover:border-hairline-strong"
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-mute uppercase font-mono tracking-wider">
                      {p.brand || "Generic"}
                    </span>
                    <h4 className="text-xs font-bold text-foreground truncate mt-0.5">
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-mute font-medium mt-1 font-mono">
                      UPC: {p.barcode || "N/A"} | MRP: ₹{(p.mrp / 100).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => triggerAddToShop(p)}
                    className="h-8.5 px-3 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white font-bold text-xs rounded-lg transition-all duration-150 cursor-pointer shrink-0"
                  >
                    Add to Shop
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Request Global Product */}
      {activeTab === "request" && (
        <form onSubmit={submitGlobalRequest} className="bg-canvas border border-hairline rounded-2xl p-6 max-w-xl space-y-5">
          <div className="border-b border-hairline pb-3">
            <h3 className="text-sm font-bold text-foreground font-sans">Request New Global Product</h3>
            <p className="text-[10px] text-mute mt-1 leading-snug">
              Provide product specs. Once verified, this barcode item will be published globally for all shops on the network to use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Barcode / UPC <span className="text-mute font-normal">(Recommended)</span>
              </label>
              <input
                type="text"
                name="barcode"
                placeholder="e.g. 8901058002315"
                value={requestForm.barcode}
                onChange={handleRequestChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Maximum Retail Price (MRP) <span className="text-error-deep">*</span>
              </label>
              <input
                type="text"
                name="mrp"
                required
                placeholder="e.g. 30.00"
                value={requestForm.mrp}
                onChange={handleRequestChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Product Name <span className="text-error-deep">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Maggi 2-Min Masala Noodles 140g"
                value={requestForm.name}
                onChange={handleRequestChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                name="brand"
                placeholder="e.g. Nestle"
                value={requestForm.brand}
                onChange={handleRequestChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Category
              </label>
              <input
                type="text"
                name="category"
                placeholder="e.g. Packaged Foods"
                value={requestForm.category}
                onChange={handleRequestChange}
                className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={requestLoading}
            className="w-full h-10 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {requestLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting Request...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Submit Registration Request
              </>
            )}
          </button>
        </form>
      )}

      {/* Price Input Modal (for adding product) */}
      {addingProduct && (
        <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-2xl shadow-level-4 max-w-sm w-full p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground font-sans">Set Shop Selling Price</h3>
              <p className="text-[10px] text-mute mt-1 leading-snug">
                Configure your retail selling price for <strong>{addingProduct.name}</strong>.
              </p>
            </div>

            <div className="space-y-3.5 text-xs text-body">
              <div className="flex justify-between">
                <span>Maximum Retail Price (MRP):</span>
                <span className="font-mono font-bold text-foreground">₹{(addingProduct.mrp / 100).toFixed(2)}</span>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Your Shop Price (₹)
                </label>
                <input
                  type="text"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setAddingProduct(null)}
                className="flex-1 h-9.5 border border-hairline hover:bg-canvas-soft text-foreground text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitAddToShop}
                disabled={addLoading}
                className="flex-1 h-9.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                {addLoading ? "Adding..." : "Add to Shop"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
