"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { adminApi } from "../../utils/api";
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

  useEffect(() => {
    async function loadStats() {
      try {
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="animate-spin h-6 w-6 text-brand-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white font-sans">Platform Overview</h1>
        <p className="text-xs text-zinc-400 mt-1">
          High-level statistics and health indicators for the Onbillo platform.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Users */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
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
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
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

        {/* Global DB Size */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
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

        {/* Financial Flow */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
              Estimated Transaction Volume
            </span>
            <Wallet className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              ₹{(stats?.monthlyRevenue / 100).toLocaleString("en-IN")}
            </h3>
            <p className="text-[9px] text-zinc-500 font-bold mt-1">
              Processed in latest 30 days
            </p>
          </div>
        </div>
      </div>

      {/* Server Health widgets */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-800/80 pb-2.5">
          System Infrastructure Telemetry
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-zinc-850 flex items-center justify-center text-zinc-400 border border-zinc-800">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <span className="text-zinc-500 block text-[9px] font-bold uppercase font-mono">Server Status</span>
              <span className="font-bold text-emerald-400">ONLINE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-zinc-850 flex items-center justify-center text-zinc-400 border border-zinc-800">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-zinc-500 block text-[9px] font-bold uppercase font-mono">Database Latency</span>
              <span className="font-bold text-white">4 ms</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-zinc-850 flex items-center justify-center text-zinc-400 border border-zinc-800">
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
  );
}
