"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { billsApi, shopsApi, Bill, Shop } from "../../../utils/api";
import { mockShops, mockBills } from "../../../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
import { 
  Search, 
  Receipt, 
  Trash2, 
  Printer, 
  XCircle, 
  CheckCircle2, 
  Eye,
  AlertCircle
} from "lucide-react";

export default function ShopBills({
  params: paramsPromise,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const params = use(paramsPromise);
  const shopId = parseInt(params.shopId, 10);
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadBills() {
    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
      
      if (isBoneyard) {
        setShop(mockShops[0]);
        setBills(mockBills[shopId] || mockBills[1] || []);
        setLoading(false);
        return;
      }

      const token = await getToken();
      const [shopDetail, billsList] = await Promise.all([
        shopsApi.getShop(token, shopId),
        billsApi.getShopBills(token, shopId)
      ]);
      setShop(shopDetail);
      setBills(billsList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBills();
  }, [shopId, getToken]);

  const handleVoid = async (billId: number) => {
    if (!confirm("Are you sure you want to void this invoice? This action cannot be undone.")) return;
    
    setVoidingId(billId);
    setError("");

    try {
      const token = await getToken();
      const updated = await billsApi.voidBill(token, shopId, billId);
      setBills(bills.map(b => b.id === billId ? updated : b));
      if (selectedBill?.id === billId) {
        setSelectedBill(updated);
      }
    } catch (err: any) {
      setError(err.message || "Failed to void invoice.");
    } finally {
      setVoidingId(null);
    }
  };

  const filteredBills = bills.filter((b) => {
    const query = searchQuery.toLowerCase();
    return b.billNumber.toLowerCase().includes(query);
  });

  const printReceipt = () => {
    window.print();
  };

  return (
    <Skeleton name="shop-bills" loading={loading}>
      <div className="space-y-8 select-none">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-sans">Bill Ledger History</h1>
          <p className="text-xs text-mute mt-1">
            Browse and manage all invoices issued by this shop location.
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <input
            type="text"
            placeholder="Search by Invoice number..."
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

      {/* 2. Main content split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ledger Table */}
        <div className="lg:col-span-8 bg-canvas border border-hairline rounded-2xl overflow-hidden shadow-sm">
          {filteredBills.length === 0 ? (
            <div className="p-12 text-center text-mute">
              <Receipt className="w-10 h-10 mx-auto text-mute mb-3" />
              <h4 className="text-xs font-bold text-foreground">No invoices registered</h4>
              <p className="text-[10px] text-mute mt-1.5">
                Generate transaction bills in the POS Register page to compile logs here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas-soft border-b border-hairline text-[9px] font-bold text-mute uppercase tracking-wider font-mono">
                    <th className="py-3.5 px-4">Date / Time</th>
                    <th className="py-3.5 px-4">Bill Number</th>
                    <th className="py-3.5 px-4">Cashier</th>
                    <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-xs">
                  {filteredBills.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBill(b)}
                      className={`hover:bg-canvas-soft transition-colors cursor-pointer ${
                        selectedBill?.id === b.id ? "bg-brand-primary/5" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-medium text-mute truncate max-w-[120px]">
                        {new Date(b.createdAt).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground font-mono">
                        {b.billNumber}
                      </td>
                      <td className="py-3.5 px-4 text-body font-semibold truncate max-w-[100px]">
                        {b.cashierName || "Cashier"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground text-right font-mono">
                        ₹{(b.totalPrice / 100).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {b.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-primary/10 border border-brand-primary/20 text-brand-primary uppercase tracking-wide">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-error-soft border border-error/15 text-error-deep uppercase tracking-wide">
                            Voided
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setSelectedBill(b)}
                            className="p-1 text-mute hover:text-foreground hover:bg-canvas-soft rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {b.status === "active" && (
                            <button
                              disabled={voidingId !== null}
                              onClick={() => handleVoid(b.id)}
                              className="p-1 text-mute hover:text-error-deep hover:bg-error-soft/30 rounded transition-colors"
                              title="Void Bill"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mobile Backdrop for Selected Bill Inspector */}
        {selectedBill && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setSelectedBill(null)}
          />
        )}

        {/* Selected Bill Side Panel (Details) */}
        <div className={`bg-canvas border border-hairline rounded-2xl p-5 shadow-sm space-y-4 ${
          selectedBill 
            ? "fixed inset-4 sm:inset-y-12 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-sm z-50 flex flex-col lg:static lg:z-auto lg:translate-x-0 lg:max-w-none lg:w-auto lg:col-span-4 animate-in fade-in zoom-in-95 lg:animate-none"
            : "hidden lg:block lg:col-span-4"
        }`}>
          <div className="flex items-center justify-between border-b border-hairline pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mute font-mono">
              Invoice Inspector
            </h3>
            {selectedBill && (
              <button
                onClick={() => setSelectedBill(null)}
                className="lg:hidden p-1 rounded-md border border-hairline text-mute hover:text-foreground hover:bg-canvas-soft text-[10px] font-bold cursor-pointer"
              >
                Close ✕
              </button>
            )}
          </div>

          {!selectedBill ? (
            <div className="p-8 text-center text-mute">
              <p className="text-[10px]">Select an invoice from the ledger to inspect products, cashier tags, and print settings.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Receipt Area */}
              <div className="bg-canvas-soft border border-hairline rounded-xl p-4 font-mono text-[9px] text-zinc-800 relative select-text select-all">
                <div className="text-center space-y-1 mb-3">
                  <h4 className="font-bold text-black">{shop?.name}</h4>
                  <p className="text-[8px] text-mute">{shop?.city}, {shop?.state}</p>
                </div>

                <div className="border-t border-b border-dashed border-zinc-400 py-1.5 my-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span>BILL NO:</span>
                    <span className="font-bold text-black">{selectedBill.billNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{new Date(selectedBill.createdAt).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>STATUS:</span>
                    <span className={`font-bold ${selectedBill.status === "active" ? "text-brand-primary" : "text-error-deep"}`}>
                      {selectedBill.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="border-b border-dashed border-zinc-400 pb-2 space-y-1">
                  {selectedBill.items?.map((item) => (
                    <div key={item.id} className="flex justify-between leading-snug">
                      <span className="truncate max-w-[120px]">{item.productName}</span>
                      <span>
                        {item.quantity} x {((item.unitPrice) / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-black font-bold flex justify-between text-xs">
                  <span>TOTAL:</span>
                  <span>₹{(selectedBill.totalPrice / 100).toFixed(2)}</span>
                </div>

                {selectedBill.notes && (
                  <div className="mt-3 bg-canvas border border-hairline p-2 rounded text-[8px] text-mute">
                    <strong>Notes:</strong> {selectedBill.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={printReceipt}
                  className="flex-1 h-9 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                {selectedBill.status === "active" && (
                  <button
                    disabled={voidingId !== null}
                    onClick={() => handleVoid(selectedBill.id)}
                    className="flex-1 h-9 border border-error/20 hover:bg-error-soft text-error-deep text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Void
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </Skeleton>
  );
}
