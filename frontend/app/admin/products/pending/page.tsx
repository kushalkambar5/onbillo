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
  const [actioningId, setActioningId] = useState<number | null>(null);

  // Rejection dialog state
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  async function loadPending() {
    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
      
      if (isBoneyard) {
        setPendingProducts([
          { id: 11, barcode: "8901030818279", name: "Red Label Tea 500g", brand: "Brooke Bond", category: "Beverages", mrp: 19500, status: "pending", rejectionReason: null, createdBy: 99, createdAt: new Date().toISOString() }
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

  const handleApprove = async (productId: number, productName: string) => {
    setActioningId(productId);
    setError("");
    setSuccess("");

    try {
      const token = await getToken();
      await adminApi.approveProduct(token, productId);
      setPendingProducts(pendingProducts.filter(p => p.id !== productId));
      setSuccess(`Successfully approved and published "${productName}" to the global database.`);
    } catch (err: any) {
      setError(err.message || "Failed to approve product.");
    } finally {
      setActioningId(null);
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
                          onClick={() => handleApprove(p.id, p.name)}
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

      {/* Reject Product Modal */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-sm flex items-center justify-center p-4">
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
