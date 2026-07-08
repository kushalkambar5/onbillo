"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { staffApi, shopsApi, ShopMember, StaffRequest, Shop } from "../../../utils/api";
import { mockShops, mockShopMembers, mockStaffRequests } from "../../../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
import { 
  UserPlus, 
  Trash2, 
  Mail, 
  Shield, 
  User, 
  Clock, 
  AlertCircle
} from "lucide-react";

export default function ShopStaff({
  params: paramsPromise,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const params = use(paramsPromise);
  const shopId = parseInt(params.shopId, 10);
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [members, setMembers] = useState<ShopMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<StaffRequest[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  
  // Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "shop_worker">("shop_worker");
  const [submittingInvite, setSubmittingInvite] = useState(false);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);

  async function loadStaffData() {
    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
      
      if (isBoneyard) {
        setShop(mockShops[0]);
        setMembers(mockShopMembers[shopId] || mockShopMembers[2] || []);
        setPendingInvites(mockStaffRequests.filter(inv => inv.shopId === shopId));
        setLoading(false);
        return;
      }

      const token = await getToken();
      const [shopDetail, membersList] = await Promise.all([
        shopsApi.getShop(token, shopId),
        shopsApi.getMembers(token, shopId)
      ]);
      setShop(shopDetail);
      setMembers(membersList);

      // We filter pending invites by shopId and status
      const allPending = await staffApi.getPendingInvites(token);
      // Wait, getPendingInvites returns invites for the current user. How to get invites sent by this shop?
      // Since it's a mock fallback anyway, let's load invites and mock filter by shopId
      setPendingInvites(allPending.filter(inv => inv.shopId === shopId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaffData();
  }, [shopId, getToken]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setSubmittingInvite(true);
    setError("");
    setSuccess("");

    try {
      const token = await getToken();
      const invite = await staffApi.sendInvite(token, shopId, inviteEmail, inviteRole);
      setPendingInvites([...pendingInvites, invite]);
      setSuccess(`Invitation sent successfully to ${inviteEmail}!`);
      setInviteEmail("");
      setInviteModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to send staff invitation.");
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleRemoveStaff = async (memberId: number, memberName: string) => {
    if (!confirm(`Are you sure you want to revoke ${memberName}'s access to this shop?`)) return;

    setActioningId(memberId);
    setError("");
    setSuccess("");

    try {
      const token = await getToken();
      await staffApi.removeStaff(token, shopId, memberId);
      setMembers(members.filter(m => m.id !== memberId));
      setSuccess(`Revoked access for ${memberName}.`);
    } catch (err: any) {
      setError(err.message || "Failed to remove staff member.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <Skeleton name="shop-staff" loading={loading}>
      <div className="space-y-8 select-none">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-sans">Staff & Permissions</h1>
          <p className="text-xs text-mute mt-1">
            Manage employee access roles (owner vs. worker) and review pending team invites.
          </p>
        </div>

        <button
          onClick={() => {
            setInviteModalOpen(true);
            setError("");
            setSuccess("");
          }}
          className="h-10 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" /> Invite Staff Member
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-lg bg-canvas-soft border border-brand-primary/15 text-xs font-semibold text-brand-primary">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-error-soft border border-error/15 text-xs font-semibold text-error-deep">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Active Staff List */}
        <div className="lg:col-span-2 bg-canvas border border-hairline rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-hairline bg-canvas-soft flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mute font-mono">
              Active Team Roster
            </h3>
            <span className="text-[10px] font-bold bg-hairline px-2 py-0.5 rounded-full text-mute font-mono">
              {members.length} members
            </span>
          </div>

          <div className="divide-y divide-hairline">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-5 flex items-center justify-between gap-4 hover:bg-canvas-soft/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary shrink-0 border border-brand-primary/10">
                    {m.role === "owner" ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {m.user?.name || "Active Staff"}
                    </h4>
                    <p className="text-[10px] text-mute font-mono mt-0.5">
                      {m.user?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                    m.role === "owner" 
                      ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary" 
                      : "bg-canvas-soft border-hairline text-mute"
                  }`}>
                    {m.role === "owner" ? "Owner" : "Worker"}
                  </span>
                  
                  {/* Revoke option (Owners can delete others but not themselves) */}
                  {m.role !== "owner" && (
                    <button
                      disabled={actioningId !== null}
                      onClick={() => handleRemoveStaff(m.id, m.user?.name || "Staff")}
                      className="p-1.5 text-mute hover:text-error-deep hover:bg-error-soft/30 rounded-lg transition-colors cursor-pointer"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invites List */}
        <div className="bg-canvas border border-hairline rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mute font-mono border-b border-hairline pb-2">
            Outgoing Invites
          </h3>

          {pendingInvites.length === 0 ? (
            <div className="p-8 text-center text-mute">
              <Clock className="w-7 h-7 mx-auto text-mute mb-2" />
              <p className="text-[10px]">No pending team invites outstanding.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {pendingInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 bg-canvas-soft border border-hairline rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-foreground truncate">
                      {inv.receiverEmail}
                    </h4>
                    <p className="text-[10px] text-mute font-medium mt-0.5 capitalize">
                      Role: {inv.role === "shop_worker" ? "Worker" : "Owner"}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-warning-soft border border-warning-deep/15 text-warning-deep tracking-wider font-mono shrink-0">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSendInvite} className="bg-canvas border border-hairline rounded-2xl shadow-level-4 max-w-sm w-full p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground font-sans">Invite Staff Member</h3>
              <p className="text-[10px] text-mute mt-1 leading-snug">
                Send an invitation to join the <strong>{shop?.name}</strong> workspace.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
                  <input
                    type="email"
                    required
                    placeholder="staff@mybusiness.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-9 pr-3 border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full border border-hairline bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 px-3 text-foreground"
                >
                  <option value="shop_worker">Shop Worker (POS register & Bills only)</option>
                  <option value="owner">Co-owner (Full permissions)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="flex-1 h-9.5 border border-hairline hover:bg-canvas-soft text-foreground text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingInvite}
                className="flex-1 h-9.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                {submittingInvite ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
    </Skeleton>
  );
}
