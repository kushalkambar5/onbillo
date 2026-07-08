"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { adminApi, Shop } from "../../utils/api";
import { mockShops } from "../../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
import { 
  Store, 
  Search, 
  MapPin, 
  Calendar,
  Layers
} from "lucide-react";

export default function AdminShops() {
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadShops() {
      try {
        const isBoneyard = typeof window !== "undefined" && 
          ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
        
        if (isBoneyard) {
          setShops(mockShops);
          setLoading(false);
          return;
        }

        const token = await getToken();
        const list = await adminApi.listShops(token);
        setShops(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadShops();
  }, [getToken]);

  const filteredShops = shops.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.state.toLowerCase().includes(q);
  });

  return (
    <Skeleton name="admin-shops" loading={loading}>
      <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-sans">Shop Workspace Directory</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Browse and audit all retail and billing stores registered on the platform.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search shops by name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 border border-zinc-800 bg-zinc-900 hover:border-zinc-700 focus:border-brand-primary rounded-lg text-xs h-10 text-white outline-none"
          />
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-md">
        {filteredShops.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Store className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
            <h4 className="text-xs font-bold text-white">No shops found</h4>
            <p className="text-[10px] text-zinc-500 mt-1">
              No registered workspaces match this search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                  <th className="py-3.5 px-5">ID</th>
                  <th className="py-3.5 px-5">Shop Name</th>
                  <th className="py-3.5 px-5">Location (Address)</th>
                  <th className="py-3.5 px-5">GSTIN Status</th>
                  <th className="py-3.5 px-5 text-right">Invoice Counter</th>
                  <th className="py-3.5 px-5 text-center">Tax Scheme</th>
                  <th className="py-3.5 px-5 text-center">Register Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-xs">
                {filteredShops.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-950/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-zinc-500">
                      #{s.id}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-white">
                      {s.name}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-400 font-medium max-w-[200px] truncate" title={`${s.addressLine1}, ${s.city}, ${s.state}`}>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                        {s.city}, {s.state}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-zinc-400 font-mono">
                      {s.gstNumber || "No GST Registration"}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-white text-right font-mono">
                      {s.invoiceCounter - 1} invoices
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-zinc-950 border border-zinc-800 text-zinc-400 capitalize">
                        {s.taxType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center text-zinc-500 font-mono">
                      <span className="flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-600 shrink-0" />
                        {new Date(s.createdAt).toLocaleDateString("en-IN")}
                      </span>
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
