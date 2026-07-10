"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { adminApi, productsApi, Product } from "../../../utils/api";
import { Skeleton } from "boneyard-js/react";
import { 
  FileX, 
  Edit3, 
  Check, 
  RotateCcw, 
  AlertCircle,
  X,
  ShieldAlert
} from "lucide-react";

const mockRejectedProducts: Product[] = [
  { 
    id: "r1", 
    barcode: "8901030818270", 
    name: "Duplicate Tea Pack 250g", 
    brand: "Brooke Bond", 
    category: "Beverages", 
    mrp: 9500, 
    status: "rejected", 
    rejectionReason: "Duplicate barcode request from another shop", 
    createdBy: "99", 
    creatorName: "Kushal Kambar",
    creatorShopName: "Kambar Groceries",
    createdAt: new Date().toISOString() 
  },
  { 
    id: "r2", 
    barcode: "8901207040515", 
    name: "Tata Salt Lite 1kg (Typos)", 
    brand: "Tata", 
    category: "Grocery", 
    mrp: 3500, 
    status: "rejected", 
    rejectionReason: "Incomplete/Incorrect details entered", 
    createdBy: "102", 
    creatorName: "Ananya Sharma",
    creatorShopName: "Corner Cafe & Bakery",
    createdAt: new Date().toISOString() 
  }
];

export default function AdminRejectedProducts() {
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
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
        setProducts(mockRejectedProducts);
        setLoading(false);
        return;
      }

      const token = await getToken();
      const list = await adminApi.listRejectedProducts(token);
      setProducts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [getToken]);

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
        setSuccess(`Successfully updated details for "${editData.name}".`);
        setEditingProduct(null);
        return;
      }

      const token = await getToken();
      const updated = await productsApi.updateGlobalProduct(token, editingProduct.id, editData);
      setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
      setSuccess(`Successfully updated product "${updated.name}" details.`);
      setEditingProduct(null);
    } catch (err: any) {
      setError(err.message || "Failed to update product details.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleApprove = async (id: string, prodName: string) => {
    if (!confirm(`Are you sure you want to approve "${prodName}" directly?`)) return;
    
    setActioningId(id);
    setError("");
    setSuccess("");

    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));

      if (isBoneyard) {
        setProducts(products.filter(p => p.id !== id));
        setSuccess(`Successfully approved and published "${prodName}" to the global database.`);
        return;
      }

      const token = await getToken();
      await adminApi.approveProduct(token, id);
      setProducts(products.filter(p => p.id !== id));
      setSuccess(`Successfully approved and published "${prodName}" to the global database.`);
    } catch (err: any) {
      setError(err.message || "Failed to approve product.");
    } finally {
      setActioningId(null);
    }
  };

  const handleMakePending = async (id: string, prodName: string) => {
    if (!confirm(`Are you sure you want to make "${prodName}" pending review again?`)) return;
    
    setActioningId(id);
    setError("");
    setSuccess("");

    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));

      if (isBoneyard) {
        setProducts(products.filter(p => p.id !== id));
        setSuccess(`"${prodName}" has been moved back to the approval queue.`);
        return;
      }

      const token = await getToken();
      await adminApi.makeProductPending(token, id);
      setProducts(products.filter(p => p.id !== id));
      setSuccess(`"${prodName}" has been moved back to the approval queue.`);
    } catch (err: any) {
      setError(err.message || "Failed to move product back to pending.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <Skeleton name="admin-rejected-products" loading={loading}>
      <div className="space-y-8 select-none">
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-6">
          <h1 className="text-xl font-bold text-white font-sans">Rejected Product Queue</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Browse global product requests that were previously rejected. You can edit details and either approve or reset their statuses.
          </p>
        </div>

        {success && (
          <div className="p-3.5 rounded-lg bg-zinc-900 border border-brand-primary/20 text-xs font-semibold text-brand-primary">
            ✓ {success}
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-900/30 text-xs font-semibold text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Catalog Table */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-md">
          {products.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <FileX className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
              <h4 className="text-xs font-bold text-white">No rejected products</h4>
              <p className="text-[10px] text-zinc-500 mt-1">
                There are no rejected product requests on the platform.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                    <th className="py-3.5 px-5">UPC Barcode</th>
                    <th className="py-3.5 px-5">Brand / Name</th>
                    <th className="py-3.5 px-5">Submitted By</th>
                    <th className="py-3.5 px-5 text-right">MRP (₹)</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5">Rejection Reason</th>
                    <th className="py-3.5 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-xs">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-950/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-zinc-500 truncate max-w-[120px]">
                        {p.barcode || "N/A"}
                      </td>
                      <td className="py-3.5 px-5 truncate max-w-[220px]">
                        <span className="font-bold text-brand-primary block text-[10px] mb-0.5">
                          {p.brand || "—"}
                        </span>
                        <div className="flex items-center gap-2.5">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} className="w-8 h-8 rounded object-cover border border-zinc-850 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-zinc-950 border border-zinc-850 flex items-center justify-center text-[9px] text-zinc-600 font-bold shrink-0">
                              —
                            </div>
                          )}
                          <span className="font-bold text-white truncate">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 truncate max-w-[160px]">
                        <span className="text-white font-medium block">
                          {p.creatorName || "Anonymous"}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono block">
                          {p.creatorShopName || "Admin Console"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-white text-right font-mono">
                        ₹{(p.mrp / 100).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 text-zinc-400 font-medium">
                        {p.category || "—"}
                      </td>
                      <td className="py-3.5 px-5 text-red-400 font-medium max-w-[220px] truncate" title={p.rejectionReason || ""}>
                        {p.rejectionReason || "No reason provided"}
                      </td>
                      <td className="py-3.5 px-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={actioningId !== null}
                            onClick={() => triggerEditDialog(p)}
                            className="h-8 px-2 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white font-bold text-xs rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1"
                            title="Edit Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          
                          <button
                            disabled={actioningId !== null}
                            onClick={() => handleMakePending(p.id, p.name)}
                            className="h-8 px-2 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white font-bold text-xs rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1"
                            title="Make Pending"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Reset
                          </button>

                          <button
                            disabled={actioningId !== null}
                            onClick={() => handleApprove(p.id, p.name)}
                            className="h-8 px-2 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 hover:bg-emerald-800 hover:text-white font-bold text-xs rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1"
                            title="Approve Directly"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        </div>
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
            <form onSubmit={handleEditSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg max-w-md w-full p-6 space-y-4 text-white">
              <div>
                <h3 className="text-sm font-bold font-sans">Edit Rejected Product</h3>
                <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                  Modify details for this rejected request before choosing to approve or move it back to the pending queue.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 font-mono">
                    UPC Barcode
                  </label>
                  <input
                    type="text"
                    value={editForm.barcode}
                    onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                    className="w-full border border-zinc-800 bg-zinc-950 focus:border-brand-primary rounded-lg text-xs h-9 px-3 text-white"
                    placeholder="e.g. 8901030818279"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 font-mono">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={editForm.brand}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      className="w-full border border-zinc-800 bg-zinc-950 focus:border-brand-primary rounded-lg text-xs h-9 px-3 text-white"
                      placeholder="e.g. Brooke Bond"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 font-mono">
                      Category
                    </label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full border border-zinc-800 bg-zinc-950 focus:border-brand-primary rounded-lg text-xs h-9 px-3 text-white"
                      placeholder="e.g. Beverages"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 font-mono">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-zinc-800 bg-zinc-950 focus:border-brand-primary rounded-lg text-xs h-9 px-3 text-white"
                    placeholder="e.g. Red Label Tea 500g"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 font-mono">
                    MRP (₹ Rupees) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={editForm.mrp}
                    onChange={(e) => setEditForm({ ...editForm, mrp: e.target.value })}
                    className="w-full border border-zinc-800 bg-zinc-950 focus:border-brand-primary rounded-lg text-xs h-9 px-3 text-white font-mono"
                    placeholder="e.g. 195.00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 h-9.5 border border-zinc-800 hover:bg-zinc-850 text-white text-xs font-bold rounded-lg cursor-pointer"
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
