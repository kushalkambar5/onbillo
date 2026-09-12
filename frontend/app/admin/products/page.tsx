"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { productsApi, Product } from "../../utils/api";
import { Skeleton } from "boneyard-js/react";
import { 
  Layers, 
  Search, 
  Edit3, 
  PlusCircle, 
  Tag, 
  AlertCircle,
  X,
  Plus
} from "lucide-react";
import Link from "next/link";

const mockApprovedProducts: Product[] = [
  { id: "1", barcode: "8901030818279", name: "Red Label Tea 500g", brand: "Brooke Bond", category: "Beverages", mrp: 19500, status: "approved", rejectionReason: null, createdBy: "99", createdAt: new Date().toISOString() },
  { id: "2", barcode: "8901719101036", name: "Dettol Liquid Handwash 200ml", brand: "Dettol", category: "Personal Care", mrp: 9900, status: "approved", rejectionReason: null, createdBy: "99", createdAt: new Date().toISOString() },
  { id: "3", barcode: "8901058002490", name: "Britannia Marie Gold 250g", brand: "Britannia", category: "Biscuits", mrp: 4000, status: "approved", rejectionReason: null, createdBy: "101", createdAt: new Date().toISOString() },
  { id: "4", barcode: "8901207040510", name: "Tata Salt 1kg", brand: "Tata", category: "Grocery", mrp: 2800, status: "approved", rejectionReason: null, createdBy: "101", createdAt: new Date().toISOString() }
];

export default function AdminApprovedProducts() {
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Edit product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    barcode: "",
    brand: "",
    name: "",
    category: "",
    mrp: ""
  });
  const [saveLoading, setSaveLoading] = useState(false);

  async function loadProducts() {
    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
      
      if (isBoneyard) {
        setProducts(mockApprovedProducts);
        setLoading(false);
        return;
      }

      const token = await getToken();
      // standard search with empty query returns all approved global products
      const list = await productsApi.searchGlobalProducts(token, searchQuery);
      setProducts(list.filter(p => p.status === "approved"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, getToken]);

  const triggerEditDialog = (prod: Product) => {
    setEditingProduct(prod);
    setEditForm({
      barcode: prod.barcode || "",
      brand: prod.brand || "",
      name: prod.name || "",
      category: prod.category || "",
      mrp: (prod.mrp / 100).toString()
    });
    setError("");
    setSuccess("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSaveLoading(true);
    setError("");
    setSuccess("");

    try {
      const parsedMrp = Math.round(parseFloat(editForm.mrp) * 100);
      if (isNaN(parsedMrp) || parsedMrp <= 0) {
        throw new Error("MRP must be a valid positive number.");
      }

      const editData = {
        barcode: editForm.barcode.trim() || null,
        brand: editForm.brand.trim() || null,
        name: editForm.name.trim(),
        category: editForm.category.trim() || null,
        mrp: parsedMrp
      };

      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));

      if (isBoneyard) {
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...editData, mrp: parsedMrp } : p));
        setSuccess(`Successfully updated product "${editData.name}".`);
        setEditingProduct(null);
        return;
      }

      const token = await getToken();
      const updated = await productsApi.updateGlobalProduct(token, editingProduct.id, editData);
      setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
      setSuccess(`Successfully updated product "${updated.name}" in the global database.`);
      setEditingProduct(null);
    } catch (err: any) {
      setError(err.message || "Failed to update product details.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Skeleton name="admin-approved-products" loading={loading}>
      <div className="space-y-8 select-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline/80 pb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground font-sans">Global Product Catalog</h1>
            <p className="text-xs text-body mt-1">
              Browse, search, and edit verified products in the Onbillo global registry.
            </p>
          </div>

          <div className="flex flex-row items-center gap-3">
            <Link
              href="/admin/products/add"
              className="h-10 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Product
            </Link>
          </div>
        </div>

        {/* Search & Feedback */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
            <input
              type="text"
              placeholder="Search by barcode, name or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 text-foreground outline-none"
            />
          </div>
        </div>

        {success && (
          <div className="p-3.5 rounded-lg bg-canvas border border-brand-primary/20 text-xs font-semibold text-brand-primary">
            ✓ {success}
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-lg bg-error-soft border border-error/20 text-xs font-semibold text-error-deep">
            ⚠️ {error}
          </div>
        )}

        {/* Catalog Table */}
        <div className="bg-canvas border border-hairline/80 rounded-2xl overflow-hidden shadow-md">
          {products.length === 0 ? (
            <div className="p-12 text-center text-mute">
              <Layers className="w-10 h-10 mx-auto text-mute mb-3" />
              <h4 className="text-xs font-bold text-foreground">No products found</h4>
              <p className="text-[10px] text-mute mt-1">
                Try searching for a different barcode or product name.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas-soft border-b border-hairline text-[9px] font-bold text-mute uppercase tracking-wider font-mono">
                    <th className="py-3.5 px-5">UPC Barcode</th>
                    <th className="py-3.5 px-5">Brand</th>
                    <th className="py-3.5 px-5">Product Name</th>
                    <th className="py-3.5 px-5 text-right">MRP (₹)</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-xs">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-canvas-soft/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-mute truncate max-w-[120px]">
                        {p.barcode || "N/A"}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-brand-primary truncate max-w-[100px]">
                        {p.brand || "—"}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-foreground truncate max-w-[240px]">
                        <div className="flex items-center gap-2.5">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} className="w-8 h-8 rounded object-cover border border-hairline shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-canvas-soft border border-hairline flex items-center justify-center text-[9px] text-mute font-bold shrink-0">
                              —
                            </div>
                          )}
                          <span className="truncate">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-foreground text-right font-mono">
                        ₹{(p.mrp / 100).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 text-body font-medium">
                        {p.category || "—"}
                      </td>
                      <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          disabled={actioningId !== null}
                          onClick={() => triggerEditDialog(p)}
                          className="h-8 px-2.5 border border-hairline text-body hover:bg-canvas-soft-2 hover:text-foreground font-bold text-xs rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5"
                          title="Edit Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <form onSubmit={handleEditSubmit} className="bg-canvas border border-hairline rounded-2xl shadow-lg max-w-md w-full p-6 space-y-4 text-foreground">
              <div>
                <h3 className="text-sm font-bold font-sans">Edit Verified Product</h3>
                <p className="text-[10px] text-body mt-1 leading-snug">
                  Modify details for this verified item. Changes take effect across all stores linking this barcode.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-bold text-mute uppercase tracking-wider mb-1 font-mono">
                    UPC Barcode
                  </label>
                  <input
                    type="text"
                    value={editForm.barcode}
                    onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                    className="w-full border border-hairline bg-canvas-soft focus:border-brand-primary rounded-lg text-xs h-9 px-3 text-foreground"
                    placeholder="e.g. 8901030818279"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-mute uppercase tracking-wider mb-1 font-mono">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={editForm.brand}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      className="w-full border border-hairline bg-canvas-soft focus:border-brand-primary rounded-lg text-xs h-9 px-3 text-foreground"
                      placeholder="e.g. Brooke Bond"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-mute uppercase tracking-wider mb-1 font-mono">
                      Category
                    </label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full border border-hairline bg-canvas-soft focus:border-brand-primary rounded-lg text-xs h-9 px-3 text-foreground"
                      placeholder="e.g. Beverages"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-mute uppercase tracking-wider mb-1 font-mono">
                    Product Name <span className="text-error-deep">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-hairline bg-canvas-soft focus:border-brand-primary rounded-lg text-xs h-9 px-3 text-foreground"
                    placeholder="e.g. Red Label Tea 500g"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-mute uppercase tracking-wider mb-1 font-mono">
                    MRP (₹ Rupees) <span className="text-error-deep">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={editForm.mrp}
                    onChange={(e) => setEditForm({ ...editForm, mrp: e.target.value })}
                    className="w-full border border-hairline bg-canvas-soft focus:border-brand-primary rounded-lg text-xs h-9 px-3 text-foreground font-mono"
                    placeholder="e.g. 195.00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 h-9.5 border border-hairline hover:bg-canvas-soft-2 text-foreground text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 h-9.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {saveLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Skeleton>
  );
}
