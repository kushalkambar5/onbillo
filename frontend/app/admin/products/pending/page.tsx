"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { adminApi, Product } from "../../../utils/api";
import { Skeleton } from "boneyard-js/react";
import { 
  FileCheck2, 
  Check, 
  X, 
  Search, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

export default function AdminPendingProducts() {
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Rejection dialog state
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // Approval with editing dialog state
  const [approvingProduct, setApprovingProduct] = useState<Product | null>(null);
  const [approveForm, setApproveForm] = useState({
    barcode: "",
    brand: "",
    name: "",
    category: "",
    mrp: ""
  });
  const [approveLoading, setApproveLoading] = useState(false);

  async function loadPending() {
    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
      
      if (isBoneyard) {
        setPendingProducts([
          { id: "11", barcode: "8901030818279", name: "Red Label Tea 500g", brand: "Brooke Bond", category: "Beverages", mrp: 19500, status: "pending", rejectionReason: null, createdBy: "99", createdAt: new Date().toISOString() }
        ]);
        setLoading(false);
        return;
      }

      const token = await getToken();
      const list = await adminApi.listPendingProducts(token);
      setPendingProducts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, [getToken]);

  const triggerApproveDialog = (prod: Product) => {
    setApprovingProduct(prod);
    setApproveForm({
      barcode: prod.barcode || "",
      brand: prod.brand || "",
      name: prod.name || "",
      category: prod.category || "",
      mrp: (prod.mrp / 100).toString()
    });
    setError("");
    setSuccess("");
  };

  const handleApproveConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingProduct) return;

    setApproveLoading(true);
    setError("");
    setSuccess("");

    try {
      const parsedMrp = Math.round(parseFloat(approveForm.mrp) * 100);
      if (isNaN(parsedMrp) || parsedMrp <= 0) {
        throw new Error("MRP must be a valid positive number.");
      }

      const editData = {
        barcode: approveForm.barcode.trim() || null,
        brand: approveForm.brand.trim() || null,
        name: approveForm.name.trim(),
        category: approveForm.category.trim() || null,
        mrp: parsedMrp
      };

      const token = await getToken();
      await adminApi.approveProduct(token, approvingProduct.id, editData);
      setPendingProducts(pendingProducts.filter(p => p.id !== approvingProduct.id));
      setSuccess(`Successfully approved and published "${editData.name}" to the global database.`);
      setApprovingProduct(null);
    } catch (err: any) {
      setError(err.message || "Failed to approve product.");
    } finally {
      setApproveLoading(false);
    }
  };

  const triggerRejectDialog = (prod: Product) => {
    setRejectingProduct(prod);
    setRejectionReason("");
    setError("");
    setSuccess("");
  };

  const submitRejection = async () => {
    if (!rejectingProduct) return;
    if (!rejectionReason) {
      setError("Please specify a reason for rejecting the product request.");
      return;
    }

    setRejectLoading(true);
    try {
      const token = await getToken();
      await adminApi.rejectProduct(token, rejectingProduct.id, rejectionReason);
      setPendingProducts(pendingProducts.filter(p => p.id !== rejectingProduct.id));
      setSuccess(`Rejected global product submission for "${rejectingProduct.name}".`);
      setRejectingProduct(null);
    } catch (err: any) {
      setError(err.message || "Failed to reject product.");
    } finally {
      setRejectLoading(false);
    }
  };

  const filteredPending = pendingProducts.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q)) || (p.barcode && p.barcode.includes(q));
  });

  return (
    <Skeleton name="admin-pending-products" loading={loading}>
      <div className="space-y-8 select-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white font-sans">Global DB Request Queue</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Approve or reject retail product submissions to the Onbillo global registry.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 border border-zinc-800 bg-zinc-900 hover:border-zinc-700 focus:border-brand-primary rounded-lg text-xs h-10 text-white outline-none"
            />
          </div>
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

        {/* Queue Table */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-md">
          {filteredPending.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <FileCheck2 className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
              <h4 className="text-xs font-bold text-white">Queue is clear</h4>
              <p className="text-[10px] text-zinc-500 mt-1">
                There are no pending global database product requests from shop owners.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                    <th className="py-3.5 px-5">UPC Barcode</th>
                    <th className="py-3.5 px-5">Brand</th>
                    <th className="py-3.5 px-5">Product Name</th>
                    <th className="py-3.5 px-5 font-right text-right">MRP (₹)</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-xs">
                  {filteredPending.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-950/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-zinc-500 truncate max-w-[120px]">
                        {p.barcode || "N/A"}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-brand-primary truncate max-w-[100px]">
                        {p.brand || "—"}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-white truncate max-w-[220px]">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-white text-right font-mono">
                        ₹{(p.mrp / 100).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 text-zinc-400 font-medium">
                        {p.category || "—"}
                      </td>
                      <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-3">
                          <button
                            disabled={actioningId !== null}
                            onClick={() => triggerApproveDialog(p)}
                            className="h-8.5 px-3 bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 hover:bg-emerald-900 hover:text-white font-bold text-xs rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            disabled={actioningId !== null}
                            onClick={() => triggerRejectDialog(p)}
                            className="h-8.5 px-3 border border-red-900/30 text-red-400 hover:bg-red-900 hover:text-white font-bold text-xs rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
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

        {/* Approve Product Modal (With Edit fields) */}
        {approvingProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <form onSubmit={handleApproveConfirm} className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg max-w-md w-full p-6 space-y-4 text-white">
              <div>
                <h3 className="text-sm font-bold font-sans">Approve Global Registration</h3>
                <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                  Review and make changes to the product details before publishing to the platform catalog.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 font-mono">
                    UPC Barcode
                  </label>
                  <input
                    type="text"
                    value={approveForm.barcode}
                    onChange={(e) => setApproveForm({ ...approveForm, barcode: e.target.value })}
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
                      value={approveForm.brand}
                      onChange={(e) => setApproveForm({ ...approveForm, brand: e.target.value })}
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
                      value={approveForm.category}
                      onChange={(e) => setApproveForm({ ...approveForm, category: e.target.value })}
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
                    value={approveForm.name}
                    onChange={(e) => setApproveForm({ ...approveForm, name: e.target.value })}
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
                    value={approveForm.mrp}
                    onChange={(e) => setApproveForm({ ...approveForm, mrp: e.target.value })}
                    className="w-full border border-zinc-800 bg-zinc-950 focus:border-brand-primary rounded-lg text-xs h-9 px-3 text-white font-mono"
                    placeholder="e.g. 195.00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingProduct(null)}
                  className="flex-1 h-9.5 border border-zinc-800 hover:bg-zinc-850 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approveLoading}
                  className="flex-1 h-9.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {approveLoading ? "Saving..." : "Approve & Publish"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reject Product Modal */}
        {rejectingProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg max-w-sm w-full p-6 space-y-4 text-white">
              <div>
                <h3 className="text-sm font-bold font-sans">Reject Global Registration</h3>
                <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                  Specify why <strong>{rejectingProduct.name}</strong> cannot be approved for the platform DB.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 font-mono">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Typo in product details, incorrect barcode value, or duplicate of existing item."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-zinc-800 bg-zinc-950 focus:border-brand-primary rounded-lg text-xs p-3 text-white leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingProduct(null)}
                  className="flex-1 h-9.5 border border-zinc-800 hover:bg-zinc-850 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitRejection}
                  disabled={rejectLoading}
                  className="flex-1 h-9.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {rejectLoading ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Skeleton>
  );
}
