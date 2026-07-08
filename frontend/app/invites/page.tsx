"use client";

import { useEffect, useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { StaffRequest, staffApi } from "../utils/api";
import { mockStaffRequests } from "../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
import DevMockModeIndicator from "../components/DevMockModeIndicator";
import Link from "next/link";

export default function InvitesPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<StaffRequest[]>([]);
  const [actioningId, setActioningId] = useState<number | null>(null);
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

  const handleResponse = async (requestId: number, accept: boolean) => {
    setActioningId(requestId);
    setMessage({ text: "", type: "" });
    try {
      const token = await getToken();
      await staffApi.respondToInvite(token, requestId, accept);
      setInvites(invites.filter((inv) => inv.id !== requestId));
      setMessage({
        text: accept ? "Successfully accepted the invitation!" : "Invitation declined.",
        type: "success",
      });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to respond to invite.", type: "error" });
    } finally {
      setActioningId(null);
    }
  };

  return (
    <Skeleton name="invites" loading={loading}>
      <div className="min-h-screen w-full bg-background relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Navigation Header */}
      <div className="max-w-3xl mx-auto mb-8 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-2 group outline-none">
          <img src="/favicon.svg" alt="Onbillo Logo" className="w-6 h-6 rounded-lg" />
          <span className="font-bold tracking-tight text-foreground font-sans text-sm">
            Onbillo
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-xs font-semibold text-body hover:text-foreground">
            User Settings
          </Link>
          <UserButton />
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground font-sans">Pending Invitations</h1>
          <p className="text-xs text-mute mt-1">
            Accept or decline invites to join existing shop workspaces as owners or staff workers.
          </p>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg text-xs font-medium border flex items-center gap-2.5 ${
              message.type === "success"
                ? "bg-canvas-soft border-brand-primary/15 text-brand-primary"
                : "bg-error-soft border-error/15 text-error-deep"
            }`}
          >
            <span>{message.type === "success" ? "✓" : "⚠️"}</span>
            <span>{message.text}</span>
          </div>
        )}

        {invites.length === 0 ? (
          <div className="bg-canvas border border-hairline rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mx-auto mb-4 text-mute text-lg">
              ✉
            </div>
            <h3 className="text-sm font-semibold text-foreground">No pending invites</h3>
            <p className="text-xs text-mute mt-1">
              When a shop owner invites you by email or user ID, the request will appear here.
            </p>
            <div className="mt-6">
              <Link
                href="/onboarding"
                className="h-9 px-4 inline-flex items-center justify-center bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-xs rounded-lg transition-all duration-200"
              >
                Create your own shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="bg-canvas border border-hairline rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:border-hairline-strong"
              >
                <div>
                  <h3 className="text-sm font-bold text-foreground">{invite.shopName}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-2 items-center text-xs text-mute">
                    <span>Role:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-primary/5 text-brand-primary border border-brand-primary/10 capitalize">
                      {invite.role === "shop_worker" ? "Shop Worker" : "Co-owner"}
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span>Invited by:</span>
                    <span className="text-body font-medium">{invite.requesterName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-auto md:ml-0">
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

      <DevMockModeIndicator />
    </div>
    </Skeleton>
  );
}
