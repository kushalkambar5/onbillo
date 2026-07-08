import { apiCall } from "./client";
import { StaffRequest } from "./types";

export const staffApi = {
  getPendingInvites: async (token: string | null): Promise<StaffRequest[]> => {
    return await apiCall<StaffRequest[]>({
      url: "/api/staff/invites",
      method: "GET"
    }, token);
  },
  respondToInvite: async (token: string | null, requestId: number, accept: boolean): Promise<any> => {
    return await apiCall<any>({
      url: `/api/staff/invites/${requestId}`,
      method: "PUT",
      data: { status: accept ? "accepted" : "rejected" }
    }, token);
  },
  sendInvite: async (token: string | null, shopId: number, email: string, role: "owner" | "shop_worker"): Promise<StaffRequest> => {
    return await apiCall<StaffRequest>({
      url: `/api/shops/${shopId}/staff/invite`,
      method: "POST",
      data: { email, role }
    }, token);
  },
  removeStaff: async (token: string | null, shopId: number, memberId: number): Promise<any> => {
    return await apiCall<any>({
      url: `/api/shops/${shopId}/staff/${memberId}`,
      method: "DELETE"
    }, token);
  }
};
