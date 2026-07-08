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
  ToggleLeft, 
  ToggleRight,
  AlertCircle
} from "lucide-react";

export default function ShopInventory({
  params: paramsPromise,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const params = use(paramsPromise);
  const shopId = parseInt(params.shopId, 10);
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  
  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState("");

  async function loadInventory() {
    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
      
      if (isBoneyard) {
        setProducts(mockShopProducts[shopId] || mockShopProducts[1] || []);
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

  const handleToggleActive = async (shopProductId: number, currentActive: boolean) => {
    setError("");
    try {
      const token = await getToken();
      const updated = await productsApi.updateShopProduct(token, shopId, shopProductId, {
        isActive: !currentActive
      });
      setProducts(products.map(p => p.id === shopProductId ? updated : p));
    } catch (err: any) {
      setError(err.message || "Failed to toggle product status.");
    }
  };

  const startEditing = (sp: ShopProduct) => {
    setEditingId(sp.id);
    setEditPrice((sp.unitPrice / 100).toFixed(2));
  };

  const savePrice = async (shopProductId: number) => {
    const priceFloat = parseFloat(editPrice);
    if (isNaN(priceFloat) || priceFloat < 0) {
      setError("Please enter a valid price.");
      return;
    }

    const pricePaise = Math.round(priceFloat * 100);
    setError("");

    try {
      const token = await getToken();
      const updated = await productsApi.updateShopProduct(token, shopId, shopProductId, {
        unitPrice: pricePaise
      });
      setProducts(products.map(p => p.id === shopProductId ? updated : p));
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || "Failed to update unit price.");
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
        
        {/* Search */}
        <div className="relative w-full sm:w-72 shrink-0">
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
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-16 h-7 text-right text-xs border border-hairline rounded bg-canvas px-1.5 focus:border-brand-primary outline-none text-foreground font-bold"
                          />
                          <button
                            onClick={() => savePrice(sp.id)}
                            className="p-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded hover:bg-brand-primary/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 bg-canvas-soft border border-hairline text-mute rounded hover:bg-canvas-soft-2"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 group/price">
                          <span className="text-brand-primary font-extrabold">₹{(sp.unitPrice / 100).toFixed(2)}</span>
                          <button
                            onClick={() => startEditing(sp)}
                            className="opacity-0 group-hover/price:opacity-100 p-1 text-mute hover:text-foreground hover:bg-canvas-soft rounded transition-all duration-150"
                            title="Edit Price"
                          >
                            <Edit2 className="w-3 h-3" />
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
    </div>
    </Skeleton>
  );
}
