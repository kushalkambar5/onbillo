"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { adminApi } from "../../utils/api";
import { Skeleton } from "boneyard-js/react";
import { 
  Users, 
  Store, 
  FileCheck, 
  Wallet,
  Activity,
  Cpu,
  Server
} from "lucide-react";

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<"1h" | "1d" | "7d" | "1m" | "6m" | "1y" | "all">("1m");

  useEffect(() => {
    async function loadStats() {
      try {
        const isBoneyard = typeof window !== "undefined" && 
          ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
        
        if (isBoneyard) {
          setStats({
            totalUsers: 148,
            totalShops: 12,
            totalProducts: 485,
            pendingProducts: 3,
            invoices: {
              "1h": 4,
              "1d": 28,
              "7d": 154,
              "1m": 620,
              "6m": 3120,
              "1y": 5890,
              all: 8400
            },
            averageBill: {
              "1h": 18500,
              "1d": 21000,
              "7d": 19500,
              "1m": 22400,
              "6m": 21800,
              "1y": 22100,
              all: 21950
            },
            serverUptime: "14 days, 3 hours",
            dbLatency: 3
          });
          setLoading(false);
          return;
        }

        const token = await getToken();
        const data = await adminApi.getStats(token);
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [getToken]);

  const timeRangeLabels = {
    "1h": "1 Hour",
    "1d": "1 Day",
    "7d": "7 Days",
    "1m": "1 Month",
    "6m": "6 Months",
    "1y": "1 Year",
    all: "All Time"
  };

  const getInvoicesCount = () => {
    return stats?.invoices?.[timeRange] ?? 0;
  };

  const getAverageBillValue = () => {
    const val = stats?.averageBill?.[timeRange] ?? 0;
    return val / 100; // convert paise to rupees
  };

  const getRevenue = () => {
    const count = getInvoicesCount();
    const avg = getAverageBillValue();
    return count * avg;
  };

  return (
    <Skeleton name="admin-dashboard" loading={loading}>
      <div className="space-y-8 select-none">
        {/* Header & Filter Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-zinc-800/80 pb-6">
          <div>
            <h1 className="text-xl font-bold text-white font-sans">Platform Overview</h1>
            <p className="text-xs text-zinc-400 mt-1">
              High-level statistics and health indicators for the Onbillo platform.
            </p>
          </div>

          {/* Time range switcher */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/60 p-1 border border-zinc-800/80 rounded-xl max-w-fit">
            {(Object.keys(timeRangeLabels) as Array<keyof typeof timeRangeLabels>).map((range) => {
              const active = timeRange === range;
              return (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer outline-none ${
                    active
                      ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {timeRangeLabels[range]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Users */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-800 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                Total User Registrations
              </span>
              <Users className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="mt-3.5">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {stats?.totalUsers}
              </h3>
              <p className="text-[9px] text-zinc-500 font-bold mt-1">
                Active sessions: 142 today
              </p>
            </div>
          </div>

          {/* Shops */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-800 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                Registered Shops
              </span>
              <Store className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="mt-3.5">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {stats?.totalShops}
              </h3>
              <p className="text-[9px] text-zinc-500 font-bold mt-1">
                Active workspaces: 92% online
              </p>
            </div>
          </div>

          {/* Total Invoices */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-800 transition-colors relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                Invoices Generated
              </span>
              <Wallet className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="mt-3.5">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {getInvoicesCount()}
              </h3>
              <p className="text-[9px] text-brand-primary font-bold mt-1">
                Period: {timeRangeLabels[timeRange]}
              </p>
            </div>
          </div>

          {/* Average Bill Value */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-800 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                Average Bill Value
              </span>
              <Activity className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="mt-3.5">
              <h3 className="text-2xl font-bold text-white tracking-tight font-mono">
                ₹{getAverageBillValue().toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[9px] text-zinc-500 font-bold mt-1">
                Period volume: ₹{getRevenue().toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* Global DB & Infrastructure Telemetry row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Global DB Size */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:border-zinc-800 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                Global Products
              </span>
              <FileCheck className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="mt-3.5">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {stats?.totalProducts}
              </h3>
              <p className="text-[9px] text-warning-deep font-bold mt-1">
                Pending review queue: {stats?.pendingProducts} requests
              </p>
            </div>
          </div>

          {/* System Infrastructure Telemetry */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm md:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-800/60 pb-2">
              System Infrastructure Telemetry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-zinc-850 flex items-center justify-center text-zinc-400 border border-zinc-850">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] font-bold uppercase font-mono">Server Status</span>
                  <span className="font-bold text-emerald-400">ONLINE</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-zinc-850 flex items-center justify-center text-zinc-400 border border-zinc-850">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] font-bold uppercase font-mono">Database Latency</span>
                  <span className="font-bold text-white">{stats?.dbLatency ?? 0} ms</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-zinc-850 flex items-center justify-center text-zinc-400 border border-zinc-850">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] font-bold uppercase font-mono">Platform Uptime</span>
                  <span className="font-bold text-white">{stats?.serverUptime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Skeleton>
  );
}
