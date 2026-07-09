"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { StaffRequest, staffApi } from "../utils/api";
import { mockStaffRequests } from "../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
import DevMockModeIndicator from "../components/DevMockModeIndicator";
import { useRouter } from "next/navigation";

export default function InvitesPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<StaffRequest[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  async function loadInvites() {
    try {
      const isBoneyard = typeof window !== "undefined" && 
        ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
      
      if (isBoneyard) {
        setInvites(mockStaffRequests);
        setLoading(false);
        return;
      }

      const token = await getToken();
      const list = await staffApi.getPendingInvites(token);
      setInvites(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvites();
  }, [getToken]);

  const handleResponse = async (requestId: string, accept: boolean) => {
    setActioningId(requestId);
    setMessage({ text: "", type: "" });
    try {
      const token = await getToken();
      await staffApi.respondToInvite(token, requestId, accept);
      
      if (accept) {
        const acceptedInvite = invites.find((inv) => inv.id === requestId);
        setMessage({
          text: "Successfully accepted the invitation! Redirecting...",
          type: "success",
        });
        setTimeout(() => {
          if (acceptedInvite) {
            router.push(`/shop/${acceptedInvite.shopId}/billing`);
          } else {
            router.push("/");
          }
        }, 1500);
      } else {
        setInvites(
          invites.map((inv) =>
            inv.id === requestId ? { ...inv, status: "rejected" } : inv
          )
        );
        setMessage({
          text: "Invitation declined.",
          type: "success",
        });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to respond to invite.", type: "error" });
    } finally {
      setActioningId(null);
    }
  };

  const pendingInvites = invites.filter((inv) => inv.status === "pending");
  const invitesHistory = invites.filter((inv) => inv.status !== "pending");

  return (
    <Skeleton name="invites" loading={loading}>
      <div className="max-w-3xl mx-auto select-none space-y-8 py-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-sans">Staff Management</h1>
          <p className="text-xs text-mute mt-1">
            Accept or decline invites to join existing shop workspaces, and view your invitation histories.
          </p>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-lg text-xs font-medium border flex items-center gap-2.5 ${
              message.type === "success"
                ? "bg-canvas-soft border-brand-primary/15 text-brand-primary"
                : "bg-error-soft border-error/15 text-error-deep"
            }`}
          >
            <span>{message.type === "success" ? "✓" : "⚠️"}</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* Pending Invitations Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            Pending Invitations ({pendingInvites.length})
          </h2>
          {pendingInvites.length === 0 ? (
            <div className="bg-canvas border border-hairline rounded-2xl p-10 text-center shadow-sm">
              <div className="w-10 h-10 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mx-auto mb-3 text-mute text-sm">
                ✉
              </div>
              <p className="text-xs text-mute">No pending invitations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvites.map((invite) => (
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
                      onClick={() => handleResponse(invite.id, false)}
                      className="h-9 px-4 border border-hairline text-foreground hover:bg-canvas-soft font-semibold text-xs rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      disabled={actioningId !== null}
                      onClick={() => handleResponse(invite.id, true)}
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

        {/* Invitation History Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            Invitation History ({invitesHistory.length})
          </h2>
          {invitesHistory.length === 0 ? (
            <div className="bg-canvas border border-hairline rounded-2xl p-8 text-center shadow-sm opacity-60">
              <p className="text-xs text-mute">No invitation history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitesHistory.map((invite) => (
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

      <DevMockModeIndicator />
    </Skeleton>
  );
}
