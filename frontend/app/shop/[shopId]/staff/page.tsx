"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { ShopMember, StaffRequest, staffApi, shopsApi, Shop } from "../../../utils/api";
import { InviteStaffByEmailSchema, EmailSchema, validateSchema } from "../../../utils/validation";
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
  const shopId = params.shopId;
  const { userId: clerkUserId, getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [receivedLoading, setReceivedLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [members, setMembers] = useState<ShopMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<StaffRequest[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<StaffRequest[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  
  // Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "shop_worker">("shop_worker");
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const currentMember = members.find(m => m.user?.clerkId === clerkUserId);
  const isOwner = loading || !currentMember || currentMember.role === "owner";
  
  const [inviteEmailError, setInviteEmailError] = useState("");
  const [inviteEmailTouched, setInviteEmailTouched] = useState(false);

  const validateInviteEmail = (val: string) => {
    if (!val.trim()) return "Email address is required";
    const res = EmailSchema.safeParse(val);
    if (!res.success) return res.error.issues[0].message;
    return "";
  };

  const handleEmailChange = (val: string) => {
    setInviteEmail(val);
    if (inviteEmailTouched) {
      setInviteEmailError(validateInviteEmail(val));
    }
  };

  const handleEmailBlur = () => {
    setInviteEmailTouched(true);
    setInviteEmailError(validateInviteEmail(inviteEmail));
  };

  const isInviteFormValid = inviteEmail.trim() !== "" && !validateInviteEmail(inviteEmail);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function loadStaffData() {
    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
      
      if (isBoneyard) {
        setShop(mockShops[0]);
        setMembers(mockShopMembers[shopId] || mockShopMembers["2"] || []);
        setPendingInvites(mockStaffRequests.filter(inv => inv.shopId === shopId));
        setReceivedInvites(mockStaffRequests);
        setLoading(false);
        setReceivedLoading(false);
        return;
      }

      const token = await getToken();
      const [shopDetail, membersList, invitesList, receivedList] = await Promise.all([
        shopsApi.getShop(token, shopId),
        shopsApi.getMembers(token, shopId),
        staffApi.getShopInvites(token, shopId),
        staffApi.getPendingInvites(token)
      ]);
      setShop(shopDetail);
      setMembers(membersList);
      setPendingInvites(invitesList);
      setReceivedInvites(receivedList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setReceivedLoading(false);
    }
  }

  useEffect(() => {
    loadStaffData();
  }, [shopId, getToken]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateSchema(InviteStaffByEmailSchema, {
      email: inviteEmail,
      role: inviteRole,
    });

    if (!validation.success) {
      setModalError(validation.error);
      return;
    }

    setSubmittingInvite(true);
    setModalError("");
    setError("");
    setSuccess("");

    try {
      const token = await getToken();
      const invite = await staffApi.sendInvite(
        token,
        shopId,
        validation.data.email,
        validation.data.role
      );
      setPendingInvites([...pendingInvites, invite]);
      setSuccess(`Invitation sent successfully to ${validation.data.email}!`);
      setInviteEmail("");
      setInviteModalOpen(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setModalError(
          "Make sure this email's account exists in Onbillo. If the user doesn't have account on Onbillo, then tell me to create account on Onbillo"
        );
      } else {
        setModalError(err.message || "Failed to send staff invitation.");
      }
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleRemoveStaff = async (memberId: string, memberName: string) => {
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

  const handleRespondToReceivedInvite = async (requestId: string, accept: boolean) => {
    setActioningId(requestId);
    setError("");
    setSuccess("");
    try {
      const token = await getToken();
      await staffApi.respondToInvite(token, requestId, accept);
      
      if (accept) {
        setSuccess("Successfully accepted the invitation! Reloading workspace...");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setReceivedInvites(
          receivedInvites.map((inv) =>
            inv.id === requestId ? { ...inv, status: "rejected" } : inv
          )
        );
        setSuccess("Invitation declined.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to respond to invite.");
    } finally {
      setActioningId(null);
    }
  };

  const pendingReceived = receivedInvites.filter((inv) => inv.status === "pending");
  const historyReceived = receivedInvites.filter((inv) => inv.status !== "pending");

  if (!isOwner) {
    // ----------------------------------------------------
    // WORKER VIEW: Show only received invites & histories
    // ----------------------------------------------------
    return (
      <Skeleton name="shop-staff" loading={loading || receivedLoading}>
        <div className="space-y-8 select-none max-w-4xl mx-auto py-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-sans">Staff Management</h1>
            <p className="text-xs text-mute mt-1">
              Review and manage shop join invitations sent to you, and view your accept/reject histories.
            </p>
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

          {/* Pending received invites */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
              Pending Invitations ({pendingReceived.length})
            </h2>
            {pendingReceived.length === 0 ? (
              <div className="bg-canvas border border-hairline rounded-2xl p-10 text-center shadow-sm">
                <div className="w-10 h-10 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mx-auto mb-3 text-mute text-sm">
                  ✉
                </div>
                <p className="text-xs text-mute">No pending invitations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReceived.map((invite) => (
                  <div
                    key={invite.id}
                    className="bg-canvas border border-hairline rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:border-hairline-strong"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{invite.shopName}</h3>
                      <div className="mt-1.5 flex flex-wrap gap-2 items-center text-xs text-mute">
                        <span>Role:</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-primary/5 text-brand-primary border border-brand-primary/10 capitalize">
                          {invite.role === "shop_worker" ? "Shop Worker" : "Co-owner"}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>Invited by:</span>
                        <span className="text-body font-medium">{invite.requesterName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-auto sm:ml-0">
                      <button
                        disabled={actioningId !== null}
                        onClick={() => handleRespondToReceivedInvite(invite.id, false)}
                        className="h-9 px-4 border border-hairline text-foreground hover:bg-canvas-soft font-semibold text-xs rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        disabled={actioningId !== null}
                        onClick={() => handleRespondToReceivedInvite(invite.id, true)}
                        className="h-9 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-xs rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {actioningId === invite.id ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Accepting...
                          </>
                        ) : (
                          "Accept & Join"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Received invites history */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
              Invitation History ({historyReceived.length})
            </h2>
            {historyReceived.length === 0 ? (
              <div className="bg-canvas border border-hairline rounded-2xl p-8 text-center shadow-sm opacity-60">
                <p className="text-xs text-mute">No invitation history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyReceived.map((invite) => (
                  <div
                    key={invite.id}
                    className="bg-canvas border border-hairline rounded-xl p-4 flex flex-row items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity duration-200"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-foreground">{invite.shopName}</h3>
                      <p className="text-[10px] text-mute mt-1">
                        Invited by <span className="font-semibold text-body">{invite.requesterName}</span> as <span className="capitalize">{invite.role === "shop_worker" ? "Shop Worker" : "Co-owner"}</span>
                      </p>
                    </div>
                    <div>
                      {invite.status === "accepted" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success-soft text-success-deep border border-success/15 capitalize">
                          Accepted
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error-soft text-error-deep border border-error/15 capitalize">
                          Declined
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Skeleton>
    );
  }

  // ----------------------------------------------------
  // OWNER VIEW: Show full active roster, sent invites, and received invites
  // ----------------------------------------------------
  return (
    <Skeleton name="shop-staff" loading={loading || receivedLoading}>
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
              setModalError("");
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
                    
                    {m.role !== "owner" && (
                      <button
                        disabled={actioningId !== null}
                        onClick={() => handleRemoveStaff(m.id, m.user?.name || "Staff")}
                        className="p-1.5 text-mute hover:text-error-deep hover:bg-error-soft/30 rounded-lg transition-colors cursor-pointer flex items-center justify-center min-w-7 h-7"
                        title="Revoke Access"
                      >
                        {actioningId === m.id ? (
                          <svg className="animate-spin h-3.5 w-3.5 text-error-deep" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Invites List */}
          <div className="bg-canvas border border-hairline rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mute font-mono border-b border-hairline pb-2">
              Team Invites (Sent)
            </h3>

            {pendingInvites.length === 0 ? (
              <div className="p-8 text-center text-mute">
                <Clock className="w-7 h-7 mx-auto text-mute mb-2" />
                <p className="text-[10px]">No team invites.</p>
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
                    {inv.status === "accepted" ? (
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 tracking-wider font-mono shrink-0">
                        Accepted
                      </span>
                    ) : inv.status === "rejected" ? (
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 tracking-wider font-mono shrink-0">
                        Rejected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 tracking-wider font-mono shrink-0">
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Received Invitations & Histories */}
        <div className="border-t border-hairline pt-8 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-foreground font-sans">My Received Invitations</h3>
            <p className="text-xs text-mute mt-0.5">Invitations sent to you from other shop workspaces.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                Pending ({pendingReceived.length})
              </h4>
              {pendingReceived.length === 0 ? (
                <div className="bg-canvas border border-hairline rounded-2xl p-8 text-center shadow-sm opacity-80">
                  <p className="text-xs text-mute">No pending received invitations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReceived.map((invite) => (
                    <div
                      key={invite.id}
                      className="bg-canvas border border-hairline rounded-xl p-4 shadow-sm flex items-center justify-between gap-4 transition-all duration-200 hover:border-hairline-strong"
                    >
                      <div>
                        <h5 className="text-xs font-bold text-foreground">{invite.shopName}</h5>
                        <p className="text-[10px] text-mute mt-1">
                          Role: <span className="font-semibold text-body capitalize">{invite.role === "shop_worker" ? "Worker" : "Owner"}</span> • Invited by: <span className="font-semibold text-body">{invite.requesterName}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={actioningId !== null}
                          onClick={() => handleRespondToReceivedInvite(invite.id, false)}
                          className="h-8 px-3 border border-hairline text-foreground hover:bg-canvas-soft font-semibold text-[10px] rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          disabled={actioningId !== null}
                          onClick={() => handleRespondToReceivedInvite(invite.id, true)}
                          className="h-8 px-3 bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-[10px] rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                History ({historyReceived.length})
              </h4>
              {historyReceived.length === 0 ? (
                <div className="bg-canvas border border-hairline rounded-2xl p-8 text-center shadow-sm opacity-60">
                  <p className="text-xs text-mute">No history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyReceived.map((invite) => (
                    <div
                      key={invite.id}
                      className="bg-canvas border border-hairline rounded-xl p-4 flex flex-row items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity duration-200"
                    >
                      <div>
                        <h5 className="text-xs font-bold text-foreground">{invite.shopName}</h5>
                        <p className="text-[9px] text-mute mt-1">
                          Role: <span className="capitalize">{invite.role === "shop_worker" ? "Worker" : "Owner"}</span> • Invited by: <span className="text-body font-medium">{invite.requesterName}</span>
                        </p>
                      </div>
                      <div>
                        {invite.status === "accepted" ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-success-soft text-success-deep border border-success/15 capitalize">
                            Accepted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-error-soft text-error-deep border border-error/15 capitalize">
                            Declined
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <form onSubmit={handleSendInvite} className="bg-canvas border border-hairline rounded-2xl shadow-level-4 max-w-sm w-full p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground font-sans">Invite Staff Member</h3>
                <p className="text-[10px] text-mute mt-1 leading-snug">
                  Send an invitation to join the <strong>{shop?.name}</strong> workspace.
                </p>
              </div>

              {modalError && (
                <div className={`p-3.5 rounded-lg border text-xs font-semibold leading-normal ${
                  modalError.includes("Onbillo")
                    ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                    : "bg-error-soft border-error/15 text-error-deep"
                }`}>
                  ⚠️ {modalError}
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-foreground">
                      Email Address <span className="text-error-deep">*</span>
                    </label>
                    <span className="text-[10px] text-mute font-mono">
                      {inviteEmail.length}/255 chars
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
                    <input
                      type="email"
                      required
                      placeholder="staff@mybusiness.com"
                      value={inviteEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={handleEmailBlur}
                      className={`w-full pl-9 pr-3 border bg-canvas hover:border-hairline-strong focus:border-brand-primary rounded-lg text-xs h-10 text-foreground ${
                        inviteEmailTouched && inviteEmailError ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-hairline"
                      }`}
                    />
                  </div>
                  {inviteEmailTouched && inviteEmailError && (
                    <p className="text-xs text-red-500 mt-1">{inviteEmailError}</p>
                  )}
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
                    <option value="shop_worker">Shop Worker (Billing & Bills only)</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>

              {!isInviteFormValid && inviteEmail.length > 0 && (
                <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-medium text-yellow-700 dark:text-yellow-400">
                  ⚠️ Enter a valid email address to enable invitation.
                </div>
              )}

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
                  disabled={submittingInvite || !isInviteFormValid}
                  className="flex-1 h-9.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingInvite ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Sending…</span>
                    </>
                  ) : (
                    "Send Invite"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Skeleton>
  );
}
