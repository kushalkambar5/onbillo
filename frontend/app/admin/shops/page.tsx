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
  Layers,
  Phone,
  Users,
  Wallet
} from "lucide-react";

export default function AdminShops() {
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState<"1h" | "1d" | "7d" | "1m" | "6m" | "1y" | "all">("1m");

  useEffect(() => {
    async function loadShops() {
      try {
        const isBoneyard = typeof window !== "undefined" && 
          ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
        
        if (isBoneyard) {
          const mapped = mockShops.map(s => ({
            ...s,
            workerCount: s.id === "1" ? 4 : 2,
            billsCount1h: s.id === "1" ? 1 : 0,
            billsValue1h: s.id === "1" ? 45000 : 0,
            billsCount1d: s.id === "1" ? 8 : 2,
            billsValue1d: s.id === "1" ? 340000 : 85000,
            billsCount7d: s.id === "1" ? 42 : 12,
            billsValue7d: s.id === "1" ? 1850000 : 420000,
            billsCount1m: s.id === "1" ? 142 : 89,
            billsValue1m: s.id === "1" ? 6080000 : 3120000,
            billsCount6m: s.id === "1" ? 850 : 540,
            billsValue6m: s.id === "1" ? 36000000 : 19000000,
            billsCount1y: s.id === "1" ? 1800 : 1100,
            billsValue1y: s.id === "1" ? 78000000 : 39000000,
            billsCountAll: s.id === "1" ? 2200 : 1300,
            billsValueAll: s.id === "1" ? 95000000 : 46000000,
          }));
          setShops(mapped);
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

  const timeRangeLabels = {
    "1h": "1 Hour",
    "1d": "1 Day",
    "7d": "7 Days",
    "1m": "1 Month",
    "6m": "6 Months",
    "1y": "1 Year",
    all: "All Time"
  };

  const getBillsText = (s: any) => {
    let countKey = "billsCountAll";
    let valueKey = "billsValueAll";
    
    if (timeRange === "1h") { countKey = "billsCount1h"; valueKey = "billsValue1h"; }
    else if (timeRange === "1d") { countKey = "billsCount1d"; valueKey = "billsValue1d"; }
    else if (timeRange === "7d") { countKey = "billsCount7d"; valueKey = "billsValue7d"; }
    else if (timeRange === "1m") { countKey = "billsCount1m"; valueKey = "billsValue1m"; }
    else if (timeRange === "6m") { countKey = "billsCount6m"; valueKey = "billsValue6m"; }
    else if (timeRange === "1y") { countKey = "billsCount1y"; valueKey = "billsValue1y"; }
    
    const count = s[countKey] ?? 0;
    const value = (s[valueKey] ?? 0) / 100; // in rupees
    return `${count} bills (₹${value.toLocaleString("en-IN")})`;
  };

  return (
    <Skeleton name="admin-shops" loading={loading}>
      <div className="space-y-8 select-none">
        {/* Header & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-zinc-800/80 pb-6">
          <div>
            <h1 className="text-xl font-bold text-white font-sans">Shop Workspace Directory</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Browse, audit, and inspect the performance of all retail workspaces.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 border border-zinc-800 bg-zinc-900 hover:border-zinc-700 focus:border-brand-primary rounded-lg text-xs h-10 text-white outline-none"
              />
            </div>

            {/* Time range switcher */}
            <div className="flex items-center gap-1 bg-zinc-900/60 p-1 border border-zinc-800/80 rounded-xl">
              {(Object.keys(timeRangeLabels) as Array<keyof typeof timeRangeLabels>).map((range) => {
                const active = timeRange === range;
                return (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer outline-none ${
                      active
                        ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {range === "all" ? "All" : range}
                  </button>
                );
              })}
            </div>
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
                    <th className="py-3.5 px-5">Phone Number</th>
                    <th className="py-3.5 px-5">Location</th>
                    <th className="py-3.5 px-5 text-center">Workers</th>
                    <th className="py-3.5 px-5">GSTIN</th>
                    <th className="py-3.5 px-5">Invoices ({timeRangeLabels[timeRange]})</th>
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
                      <td className="py-3.5 px-5 text-zinc-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          {s.phone || "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-400 font-medium max-w-[200px] truncate" title={`${s.addressLine1}, ${s.city}, ${s.state}`}>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                          {s.city}, {s.state}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center font-bold text-white font-mono">
                        <span className="inline-flex items-center gap-1 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
                          <Users className="w-3 h-3 text-zinc-500 shrink-0" />
                          {s.workerCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-400 font-mono">
                        {s.gstNumber || "No GST"}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-white font-mono">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Wallet className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
                          {getBillsText(s)}
                        </span>
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
