"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { adminApi, User } from "../../utils/api";
import { 
  Users, 
  Search, 
  Ban, 
  Unlock, 
  Crown, 
  UserMinus,
  AlertCircle
} from "lucide-react";

export default function AdminUsers() {
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);

  async function loadUsers() {
    try {
      const token = await getToken();
      const list = await adminApi.listUsers(token);
      setUsers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [getToken]);

  const handleTogglePremium = async (userId: number, currentPremium: boolean) => {
    setActioningId(userId);
    setError("");
    try {
      const token = await getToken();
      const updated = await adminApi.togglePremium(token, userId, !currentPremium);
      setUsers(users.map(u => u.id === userId ? updated : u));
    } catch (err: any) {
      setError(err.message || "Failed to update premium licensing status.");
    } finally {
      setActioningId(null);
    }
  };

  const handleToggleBan = async (userId: number, currentBanned: boolean) => {
    const actionText = currentBanned ? "unban" : "ban";
    if (!confirm(`Are you sure you want to ${actionText} this user account?`)) return;

    setActioningId(userId);
    setError("");
    try {
      const token = await getToken();
      const updated = await adminApi.toggleBan(token, userId, !currentBanned);
      setUsers(users.map(u => u.id === userId ? updated : u));
    } catch (err: any) {
      setError(err.message || "Failed to toggle account ban status.");
    } finally {
      setActioningId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-sans">User Management</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Ban user accounts, toggle premium licenses, and inspect emails.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 border border-zinc-800 bg-zinc-900 hover:border-zinc-700 focus:border-brand-primary rounded-lg text-xs h-10 text-white outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-900/30 text-xs font-semibold text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-md">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Users className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
            <h4 className="text-xs font-bold text-white">No user matches</h4>
            <p className="text-[10px] text-zinc-500 mt-1">
              Try searching a different name or email address.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                  <th className="py-3.5 px-5">ID</th>
                  <th className="py-3.5 px-5">User Profile Name</th>
                  <th className="py-3.5 px-5">Email Address</th>
                  <th className="py-3.5 px-5">Phone Number</th>
                  <th className="py-3.5 px-5 text-center">License Plan</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-xs">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-950/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-zinc-500">
                      #{u.id}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-white">
                      {u.name}
                      {u.role === "app_admin" && (
                        <span className="ml-2 text-[8px] font-mono font-bold bg-zinc-800 px-1.5 py-0.5 rounded text-brand-primary border border-brand-primary/20">
                          SYSTEM
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-400 font-medium">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-500 font-mono">
                      {u.phone || "—"}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        disabled={actioningId !== null}
                        onClick={() => handleTogglePremium(u.id, u.isPremium)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border transition-colors outline-none cursor-pointer ${
                          u.isPremium
                            ? "bg-amber-950/20 border-amber-900/30 text-amber-400 hover:bg-amber-950/40"
                            : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900"
                        }`}
                      >
                        <Crown className="w-3 h-3 shrink-0" />
                        {u.isPremium ? "Premium" : "Free"}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {u.isBanned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-950/30 border border-red-900/30 text-red-400 uppercase tracking-wide">
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 uppercase tracking-wide">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={actioningId !== null}
                        onClick={() => handleToggleBan(u.id, u.isBanned)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          u.isBanned
                            ? "text-emerald-400 hover:bg-emerald-950/40"
                            : "text-red-400 hover:bg-red-950/40"
                        }`}
                        title={u.isBanned ? "Unban Account" : "Ban Account"}
                      >
                        {u.isBanned ? (
                          <Unlock className="w-3.5 h-3.5" />
                        ) : (
                          <Ban className="w-3.5 h-3.5" />
                        )}
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
  );
}
