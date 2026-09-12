"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { adminApi, User } from "../../utils/api";
import { mockAdminUsers } from "../../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
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
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function loadUsers() {
    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
      
      if (isBoneyard) {
        setUsers(mockAdminUsers);
        setLoading(false);
        return;
      }

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

  const handleTogglePremium = async (userId: string, currentPremium: boolean) => {
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

  const handleToggleBan = async (userId: string, currentBanned: boolean) => {
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

  return (
    <Skeleton name="admin-users" loading={loading}>
      <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground font-sans">User Management</h1>
          <p className="text-xs text-body mt-1">
            Ban user accounts, toggle premium licenses, and inspect emails.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 text-foreground outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-error-soft border border-error/20 text-xs font-semibold text-error-deep">
          ⚠️ {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-canvas border border-hairline/80 rounded-2xl overflow-hidden shadow-md">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-mute">
            <Users className="w-10 h-10 mx-auto text-mute mb-3" />
            <h4 className="text-xs font-bold text-foreground">No user matches</h4>
            <p className="text-[10px] text-mute mt-1">
              Try searching a different name or email address.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas-soft border-b border-hairline text-[9px] font-bold text-mute uppercase tracking-wider font-mono">
                  <th className="py-3.5 px-5">ID</th>
                  <th className="py-3.5 px-5">User Profile Name</th>
                  <th className="py-3.5 px-5">Email Address</th>
                  <th className="py-3.5 px-5">Phone Number</th>
                  <th className="py-3.5 px-5">Working Shop</th>
                  <th className="py-3.5 px-5">Platform Role</th>
                  <th className="py-3.5 px-5 text-center">License Plan</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-xs">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-canvas-soft/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-mute">
                      #{u.id}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-foreground">
                      {u.name}
                      {u.role === "app_admin" && (
                        <span className="ml-2 text-[8px] font-mono font-bold bg-canvas-soft-2 px-1.5 py-0.5 rounded text-brand-primary border border-brand-primary/20">
                          SYSTEM
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-body font-medium">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-5 text-mute font-mono">
                      {u.phone || "—"}
                    </td>
                    <td className="py-3.5 px-5 text-body font-medium">
                      {u.shopName || "—"}
                    </td>
                    <td className="py-3.5 px-5 text-body">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        u.role === "app_admin" 
                          ? "bg-purple-500/10 border border-purple-500/25 text-purple-700 dark:bg-purple-950/30 dark:border-purple-900/30 dark:text-purple-400" 
                          : u.role === "shop_owner"
                          ? "bg-blue-500/10 border border-blue-500/25 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/30 dark:text-blue-400"
                          : "bg-canvas-soft border border-hairline text-body"
                      } uppercase tracking-wide`}>
                        {u.role === "app_admin" 
                          ? "Admin" 
                          : u.role === "shop_owner" 
                          ? "Owner" 
                          : u.role === "shop_worker" 
                          ? "Worker" 
                          : "User"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        disabled={actioningId !== null}
                        onClick={() => handleTogglePremium(u.id, u.isPremium)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border transition-colors outline-none cursor-pointer ${
                          u.isPremium
                            ? "bg-warning-soft border-warning/40 text-warning-deep hover:bg-warning-soft/90"
                            : "bg-canvas-soft border-hairline text-mute hover:bg-canvas"
                        }`}
                      >
                        <Crown className="w-3 h-3 shrink-0" />
                        {u.isPremium ? "Premium" : "Free"}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {u.isBanned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-error-soft border border-error/20 text-error-deep uppercase tracking-wide">
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:bg-emerald-950/25 dark:border-emerald-900/30 dark:text-emerald-400 uppercase tracking-wide">
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
                            ? "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15 dark:hover:bg-emerald-950/40"
                            : "text-error-deep hover:bg-error-soft"
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
    </Skeleton>
  );
}
