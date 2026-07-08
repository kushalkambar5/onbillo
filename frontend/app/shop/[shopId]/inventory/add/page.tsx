"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { productsApi, Product } from "../../../../utils/api";
import { CreateCustomProductSchema, BarcodeSchema, validateSchema } from "../../../../utils/validation";
import { 
  Search, 
  PlusCircle, 
  Send, 
  Check, 
  HelpCircle,
  FileCheck2,
  FolderOpen,
  Camera
} from "lucide-react";
import dynamic from "next/dynamic";

const BarcodeScanner = dynamic(
  () => import("../../../../components/BarcodeScanner"),
  { ssr: false }
);

export default function AddProducts({
  params: paramsPromise,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const params = use(paramsPromise);
  const shopId = params.shopId;
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
    mrp: "",
    sellingPrice: ""
  });
  const [requestLoading, setRequestLoading] = useState(false);

  // Validation State for Add New Product Form
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>({});
  const [requestTouched, setRequestTouched] = useState<Record<string, boolean>>({});

  const validateRequestField = (name: string, value: string) => {
    if (name === "name") {
      if (!value.trim()) return "Product Name is required";
      if (value.length > 255) return "Product Name must be at most 255 characters";
      if (!/^[a-zA-Z0-9\s.,\-\/()#&'+:@!_]+$/.test(value)) return "Product Name contains invalid characters";
      return "";
    }
    if (name === "mrp") {
      if (!value.trim()) return "MRP is required";
      const floatVal = parseFloat(value);
      if (isNaN(floatVal) || floatVal <= 0) return "MRP must be a valid positive number";
      return "";
    }
    if (name === "sellingPrice") {
      if (!value.trim()) return "Your Shop Price is required";
      const floatVal = parseFloat(value);
      if (isNaN(floatVal) || floatVal <= 0) return "Your Shop Price must be a valid positive number";
      
      const mrpFloat = parseFloat(requestForm.mrp);
      if (!isNaN(mrpFloat) && floatVal > mrpFloat) {
        return "Your Shop Price cannot exceed the Maximum Retail Price (MRP)";
      }
      return "";
    }
    if (name === "barcode") {
      if (!value.trim()) return "";
      const res = BarcodeSchema.safeParse(value);
      if (!res.success) return res.error.issues[0].message;
      return "";
    }
    if (name === "brand") {
      if (!value.trim()) return "";
      if (value.length > 255) return "Brand name must be at most 255 characters";
      if (!/^[a-zA-Z0-9\s.,\-\/()#&'+:@!_]+$/.test(value)) return "Brand name contains invalid characters";
      return "";
    }
    if (name === "category") {
      if (!value.trim()) return "";
      if (value.length > 255) return "Category name must be at most 255 characters";
      if (!/^[a-zA-Z0-9\s.,\-\/()#&'+:@!_]+$/.test(value)) return "Category name contains invalid characters";
      return "";
    }
    return "";
  };

  const handleRequestBlur = (name: string, value: string) => {
    setRequestTouched(prev => ({ ...prev, [name]: true }));
    setRequestErrors(prev => ({ ...prev, [name]: validateRequestField(name, value) }));
  };

  const handleRequestFieldChange = (name: string, value: string) => {
    const updatedForm = { ...requestForm, [name]: value };
    setRequestForm(updatedForm);
    if (requestTouched[name]) {
      setRequestErrors(prev => ({ ...prev, [name]: validateRequestField(name, value) }));
    }
    if (name === "mrp" && requestTouched["sellingPrice"]) {
      setRequestErrors(prev => ({ 
        ...prev, 
        sellingPrice: validateRequestField("sellingPrice", updatedForm.sellingPrice) 
      }));
    }
  };

  const getMissingRequestFields = () => {
    const list: string[] = [];
    if (!requestForm.name.trim()) list.push("Product Name is required");
    if (!requestForm.mrp.trim()) list.push("MRP is required");
    if (!requestForm.sellingPrice.trim()) list.push("Your Shop Price is required");

    Object.keys(requestForm).forEach((key) => {
      const err = validateRequestField(key, (requestForm as any)[key]);
      if (err) {
        list.push(err);
      }
    });
    return Array.from(new Set(list));
  };

  const isRequestFormValid = getMissingRequestFields().length === 0;

  // Validation State for Set Selling Price Dialog (adding global product)
  const [sellingPriceTouched, setSellingPriceTouched] = useState(false);
  const [sellingPriceError, setSellingPriceError] = useState("");

  const validateSellingPrice = (val: string, maxMrp?: number) => {
    if (!val.trim()) return "Price is required";
    const floatVal = parseFloat(val);
    if (isNaN(floatVal) || floatVal <= 0) return "Price must be a valid positive number";
    if (maxMrp !== undefined && floatVal > maxMrp / 100) {
      return `Price cannot exceed the Maximum Retail Price (MRP) of ₹${(maxMrp / 100).toFixed(2)}`;
    }
    return "";
  };

  const handleSellingPriceChange = (val: string) => {
    setSellingPrice(val);
    if (sellingPriceTouched) {
      setSellingPriceError(validateSellingPrice(val, addingProduct?.mrp));
    }
  };

  const handleSellingPriceBlur = () => {
    setSellingPriceTouched(true);
    setSellingPriceError(validateSellingPrice(sellingPrice, addingProduct?.mrp));
  };

  const isSellingPriceValid = sellingPrice.trim() !== "" && !validateSellingPrice(sellingPrice, addingProduct?.mrp);

  // Barcode Scanner State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<"search" | "request">("search");

  const handleBarcodeScan = async (barcode: string) => {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return;

    if (scannerMode === "search") {
      setSearchQuery(cleanBarcode);
      setScannerOpen(false);

      setLoading(true);
      setMessage({ text: "", type: "" });
      try {
        const token = await getToken();
        const list = await productsApi.searchGlobalProducts(token, cleanBarcode, shopId);
        setGlobalProducts(list);
      } catch (err: any) {
        setMessage({ text: err.message || "Failed to search global database.", type: "error" });
      } finally {
        setLoading(false);
      }
    } else {
      setRequestForm((prev) => ({
        ...prev,
        barcode: cleanBarcode,
      }));
      setScannerOpen(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const token = await getToken();
      const list = await productsApi.searchGlobalProducts(token, searchQuery, shopId);
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

    const mrpFloat = parseFloat(requestForm.mrp);
    const sellingPriceFloat = parseFloat(requestForm.sellingPrice);
    const mrpPaise = isNaN(mrpFloat) ? undefined : Math.round(mrpFloat * 100);
    const unitPricePaise = isNaN(sellingPriceFloat) ? undefined : Math.round(sellingPriceFloat * 100);

    const validationPayload = {
      barcode: requestForm.barcode,
      name: requestForm.name,
      brand: requestForm.brand,
      category: requestForm.category,
      mrp: mrpPaise,
      unitPrice: unitPricePaise
    };

    const validation = validateSchema(CreateCustomProductSchema, validationPayload);
    if (!validation.success) {
      setMessage({ text: validation.error, type: "error" });
      return;
    }

    const cleanedData = validation.data;

    setRequestLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const token = await getToken();

      await productsApi.addCustomProduct(token, shopId, {
        barcode: cleanedData.barcode,
        name: cleanedData.name,
        brand: cleanedData.brand,
        category: cleanedData.category,
        mrp: cleanedData.mrp,
        unitPrice: cleanedData.unitPrice
      });

      setMessage({ 
        text: `Successfully added "${requestForm.name}" to your shop! It has also been submitted as pending to the global registry.`, 
        type: "success" 
      });
      
      // Reset form
      setRequestForm({
        barcode: "",
        name: "",
        brand: "",
        category: "",
        mrp: "",
        sellingPrice: ""
      });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to add product to shop.", type: "error" });
    } finally {
      setRequestLoading(false);
    }
  };


  return (
    <div className="space-y-8 select-none">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-sans">Add Products to your shop's inventory</h1>
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
          Add Existing Products
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
          Add a New Product 
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
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
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
            <div className="flex gap-2.5 sm:contents">
              <button
                type="button"
                onClick={() => {
                  setScannerMode("search");
                  setScannerOpen(true);
                }}
                className="flex-1 sm:flex-none h-10 px-4 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white font-bold text-xs rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                title="Scan barcode with camera"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Barcode</span>
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 h-10 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
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

      {/* TAB 2: Add a Product in My Shop */}
      {activeTab === "request" && (
        <form onSubmit={submitGlobalRequest} className="bg-canvas border border-hairline rounded-2xl p-6 max-w-xl space-y-5">
          <div className="border-b border-hairline pb-3">
            <h3 className="text-sm font-bold text-foreground font-sans">Add Custom Product in My Shop</h3>
            <p className="text-[10px] text-mute mt-1 leading-snug">
              Provide product details to add it to your shop inventory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Barcode / UPC <span className="text-mute font-normal">(Recommended)</span>
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {requestForm.barcode.length}/255 chars
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="barcode"
                  placeholder="e.g. 8901058002315"
                  value={requestForm.barcode}
                  onChange={(e) => handleRequestFieldChange("barcode", e.target.value)}
                  onBlur={(e) => handleRequestBlur("barcode", e.target.value)}
                  className={`flex-1 min-w-0 border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground ${
                    requestTouched.barcode && requestErrors.barcode ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setScannerMode("request");
                    setScannerOpen(true);
                  }}
                  className="h-10 px-3 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg transition-all duration-150 flex items-center justify-center cursor-pointer shrink-0"
                  title="Scan barcode with camera"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              {requestTouched.barcode && requestErrors.barcode && (
                <p className="text-xs text-red-500 mt-1">{requestErrors.barcode}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Maximum Retail Price (MRP) <span className="text-error-deep">*</span>
                </label>
              </div>
              <input
                type="text"
                name="mrp"
                required
                placeholder="e.g. 30.00"
                value={requestForm.mrp}
                onChange={(e) => handleRequestFieldChange("mrp", e.target.value)}
                onBlur={(e) => handleRequestBlur("mrp", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground ${
                  requestTouched.mrp && requestErrors.mrp ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                }`}
              />
              {requestTouched.mrp && requestErrors.mrp && (
                <p className="text-xs text-red-500 mt-1">{requestErrors.mrp}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Product Name <span className="text-error-deep">*</span>
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {requestForm.name.length}/255 chars
                </span>
              </div>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Maggi 2-Min Masala Noodles 140g"
                value={requestForm.name}
                onChange={(e) => handleRequestFieldChange("name", e.target.value)}
                onBlur={(e) => handleRequestBlur("name", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground ${
                  requestTouched.name && requestErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                }`}
              />
              {requestTouched.name && requestErrors.name && (
                <p className="text-xs text-red-500 mt-1">{requestErrors.name}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Brand / Manufacturer
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {requestForm.brand.length}/255 chars
                </span>
              </div>
              <input
                type="text"
                name="brand"
                placeholder="e.g. Nestle"
                value={requestForm.brand}
                onChange={(e) => handleRequestFieldChange("brand", e.target.value)}
                onBlur={(e) => handleRequestBlur("brand", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground ${
                  requestTouched.brand && requestErrors.brand ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                }`}
              />
              {requestTouched.brand && requestErrors.brand && (
                <p className="text-xs text-red-500 mt-1">{requestErrors.brand}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Category
                </label>
                <span className="text-[10px] text-mute font-mono">
                  {requestForm.category.length}/255 chars
                </span>
              </div>
              <input
                type="text"
                name="category"
                placeholder="e.g. Packaged Foods"
                value={requestForm.category}
                onChange={(e) => handleRequestFieldChange("category", e.target.value)}
                onBlur={(e) => handleRequestBlur("category", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground ${
                  requestTouched.category && requestErrors.category ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                }`}
              />
              {requestTouched.category && requestErrors.category && (
                <p className="text-xs text-red-500 mt-1">{requestErrors.category}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Your Shop Price (₹) <span className="text-error-deep">*</span>
                </label>
              </div>
              <input
                type="text"
                name="sellingPrice"
                required
                placeholder="e.g. 28.00"
                value={requestForm.sellingPrice}
                onChange={(e) => handleRequestFieldChange("sellingPrice", e.target.value)}
                onBlur={(e) => handleRequestBlur("sellingPrice", e.target.value)}
                className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-mono font-bold ${
                  requestTouched.sellingPrice && requestErrors.sellingPrice ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                }`}
              />
              {requestTouched.sellingPrice && requestErrors.sellingPrice && (
                <p className="text-xs text-red-500 mt-1">{requestErrors.sellingPrice}</p>
              )}
            </div>
          </div>

          {/* Submit warnings panel */}
          {!isRequestFormValid && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs font-medium text-yellow-700 dark:text-yellow-400 space-y-1">
              <p className="font-bold">⚠️ Resolve the following to enable adding this product:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {getMissingRequestFields().map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={requestLoading || !isRequestFormValid}
            className="w-full h-10 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {requestLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Adding Product...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Add Product to Shop
              </>
            )}
          </button>
        </form>

      )}

      {/* Price Input Modal (for adding product) */}
      {addingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
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
                  Your Shop Price (₹) <span className="text-error-deep">*</span>
                </label>
                <input
                  type="text"
                  value={sellingPrice}
                  onChange={(e) => handleSellingPriceChange(e.target.value)}
                  onBlur={handleSellingPriceBlur}
                  className={`w-full border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground font-mono font-bold ${
                    sellingPriceTouched && sellingPriceError ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                  }`}
                />
                {sellingPriceTouched && sellingPriceError && (
                  <p className="text-xs text-red-500 mt-1">{sellingPriceError}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setAddingProduct(null);
                  setSellingPriceTouched(false);
                  setSellingPriceError("");
                }}
                className="flex-1 h-9.5 border border-hairline hover:bg-canvas-soft text-foreground text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitAddToShop}
                disabled={addLoading || !isSellingPriceValid}
                className="flex-1 h-9.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addLoading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Adding…</span>
                  </>
                ) : (
                  "Add to Shop"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
        continuous={false}
        title={scannerMode === "search" ? "Scan to Search Global DB" : "Scan Product Barcode"}
      />
    </div>
  );
}
