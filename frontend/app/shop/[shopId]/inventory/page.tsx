"use client";
 
import { useEffect, useState, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { productsApi, ShopProduct } from "../../../utils/api";
import { mockShopProducts } from "../../../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
import { 
  Search, 
  Package, 
  Edit2, 
  Check, 
  X, 
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
 
export default function ShopInventory({
  params: paramsPromise,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const params = use(paramsPromise);
  const shopId = params.shopId;
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // CSV Export state
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
 
  async function loadInventory() {
    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
      
      if (isBoneyard) {
        setProducts(mockShopProducts[shopId] || mockShopProducts["1"] || []);
        setLoading(false);
        return;
      }
 
      const token = await getToken();
      const list = await productsApi.getShopProducts(token, shopId);
      setProducts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    loadInventory();
  }, [shopId, getToken]);
 
  const handleToggleActive = async (shopProductId: string, currentActive: boolean) => {
    setError("");
    const originalProducts = [...products];

    // Optimistically update the product active state in local state
    setProducts(
      products.map(p => p.id === shopProductId ? { ...p, isActive: !currentActive } : p)
    );

    try {
      const token = await getToken();
      const updated = await productsApi.updateShopProduct(token, shopId, shopProductId, {
        isActive: !currentActive
      });
      // Synchronize with the exact response from the server
      setProducts(prev => prev.map(p => p.id === shopProductId ? updated : p));
    } catch (err: any) {
      // Rollback on network failure
      setProducts(originalProducts);
      setError(err.message || "Failed to toggle product status.");
    }
  };
 
  const startEditing = (sp: ShopProduct) => {
    setEditingId(sp.id);
    setEditPrice((sp.unitPrice / 100).toFixed(2));
  };
 
  const savePrice = async (shopProductId: string) => {
    const priceFloat = parseFloat(editPrice);
    if (isNaN(priceFloat) || priceFloat < 0) {
      setError("Please enter a valid price.");
      return;
    }
 
    const pricePaise = Math.round(priceFloat * 100);
    setError("");
    setSavingId(shopProductId);
 
    try {
      const token = await getToken();
      const updated = await productsApi.updateShopProduct(token, shopId, shopProductId, {
        unitPrice: pricePaise
      });
      setProducts(products.map(p => p.id === shopProductId ? updated : p));
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || "Failed to update unit price.");
    } finally {
      setSavingId(null);
    }
  };
 
  const handleExport = () => {
    setExporting(true);
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Compile record data into CSV and trigger download
            const headers = ["Barcode", "Product Name", "Brand", "Category", "MRP", "Selling Price", "Status"];
            const rows = products.map(p => [
              p.product.barcode || "N/A",
              p.product.name,
              p.product.brand || "—",
              p.product.category || "—",
              (p.product.mrp / 100).toFixed(2),
              (p.unitPrice / 100).toFixed(2),
              p.isActive ? "Enabled" : "Disabled"
            ]);
            const csvContent = "data:text/csv;charset=utf-8," 
              + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `inventory_shop_${shopId}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setExporting(false);
          }, 300);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };
 
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.product.name.toLowerCase().includes(query) ||
      (p.product.barcode && p.product.barcode.includes(query)) ||
      (p.product.brand && p.product.brand.toLowerCase().includes(query))
    );
  });
 
  return (
    <Skeleton name="shop-inventory" loading={loading}>
      <div className="space-y-8 select-none">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-sans">Shop Inventory & Prices</h1>
          <p className="text-xs text-mute mt-1">
            Update unit prices and toggle POS availability for products added to your shop.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto">
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={products.length === 0}
            className="h-10 px-4 border border-hairline hover:bg-canvas-soft text-foreground font-bold text-xs rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export inventory to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-mute" />
            <span>Export CSV</span>
          </button>
 
          {/* Search */}
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
            <input
              type="text"
              placeholder="Search shop products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 rounded-xl text-xs transition-all duration-200 h-10 text-foreground"
            />
          </div>
        </div>
      </div>
 
      {error && (
        <div className="p-3.5 rounded-lg bg-error-soft border border-error/15 text-xs font-semibold text-error-deep">
          ⚠️ {error}
        </div>
      )}
 
      {/* 2. Inventory Table */}
      <div className="bg-canvas border border-hairline rounded-2xl overflow-hidden shadow-sm">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-mute">
            <Package className="w-10 h-10 mx-auto text-mute mb-3" />
            <h4 className="text-xs font-bold text-foreground">No inventory matches</h4>
            <p className="text-[10px] text-mute mt-1.5">
              Try searching a different item or add new products to your catalog.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas-soft border-b border-hairline text-[9px] font-bold text-mute uppercase tracking-wider font-mono">
                  <th className="py-3.5 px-4">Barcode</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Brand</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">MRP (₹)</th>
                  <th className="py-3.5 px-4 text-right">Selling Price (₹)</th>
                  <th className="py-3.5 px-4 text-center">POS Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-xs">
                {filteredProducts.map((sp) => (
                  <tr key={sp.id} className="hover:bg-canvas-soft/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-mute truncate max-w-[120px]">
                      {sp.product.barcode || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground truncate max-w-[200px]">
                      {sp.product.name}
                    </td>
                    <td className="py-3.5 px-4 text-body font-semibold truncate max-w-[100px]">
                      {sp.product.brand || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-mute font-medium truncate max-w-[100px]">
                      {sp.product.category || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-mute text-right font-mono">
                      ₹{(sp.product.mrp / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                      {editingId === sp.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="text"
                            disabled={savingId === sp.id}
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-16 h-7 text-right text-xs border border-hairline rounded bg-canvas px-1.5 focus:border-brand-primary outline-none text-foreground font-bold disabled:opacity-50"
                          />
                          <button
                            onClick={() => savePrice(sp.id)}
                            disabled={savingId === sp.id}
                            className="p-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded hover:bg-brand-primary/20 disabled:opacity-50 flex items-center justify-center min-w-7 h-7 cursor-pointer animate-fade-in"
                          >
                            {savingId === sp.id ? (
                              <svg className="animate-spin h-3.5 w-3.5 text-brand-primary" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={savingId === sp.id}
                            className="p-1 bg-canvas-soft border border-hairline text-mute rounded hover:bg-canvas-soft-2 disabled:opacity-50 cursor-pointer animate-fade-in"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 group/price">
                          <span className="text-brand-primary font-extrabold">₹{(sp.unitPrice / 100).toFixed(2)}</span>
                          <button
                            onClick={() => startEditing(sp)}
                            className="opacity-0 group-hover/price:opacity-100 p-1 text-mute hover:text-foreground hover:bg-canvas-soft rounded transition-all duration-150 cursor-pointer"
                            title="Edit Price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(sp.id, sp.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border transition-colors outline-none cursor-pointer ${
                          sp.isActive
                            ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary hover:bg-brand-primary/15"
                            : "bg-canvas-soft border-hairline text-mute hover:bg-canvas-soft-2"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sp.isActive ? "bg-brand-primary" : "bg-mute"}`} />
                        {sp.isActive ? "Enabled" : "Disabled"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* CSV Export Progress Modal */}
      {exporting && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-2xl shadow-level-4 max-w-sm w-full p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground font-sans">Generating Inventory Spreadsheet</h3>
              <p className="text-[10px] text-mute mt-1 leading-snug">
                Compiling product barcode catalog and formatting columns...
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-full bg-canvas-soft border border-hairline h-3.5 rounded-full overflow-hidden relative">
                <div 
                  className="bg-brand-primary h-full rounded-full transition-all duration-150 ease-out" 
                  style={{ width: `${exportProgress}%` }} 
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-mute font-bold">
                <span>{exportProgress < 100 ? "Processing records…" : "Ready for download!"}</span>
                <span>{exportProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </Skeleton>
  );
}
