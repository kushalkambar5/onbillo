import { apiCall } from "./client";
import { StaffRequest } from "./types";
import { mockUser, mockShops, mockShopMembers, mockStaffRequests, mockAdminUsers } from "./mockData";

export const staffApi = {
  getPendingInvites: async (token: string | null): Promise<StaffRequest[]> => {
    try {
      return await apiCall<StaffRequest[]>({
        url: "/api/staff/invites",
        method: "GET"
      }, token);
    } catch {
      return mockStaffRequests.filter(req => req.requestedTo === mockUser.id && req.status === "pending");
    }
  },
  respondToInvite: async (token: string | null, requestId: number, accept: boolean): Promise<any> => {
    try {
      return await apiCall<any>({
        url: `/api/staff/invites/${requestId}`,
        method: "PUT",
        data: { status: accept ? "accepted" : "rejected" }
      }, token);
    } catch {
      const idx = mockStaffRequests.findIndex(r => r.id === requestId);
      if (idx === -1) throw new Error("Invite not found");
      const req = mockStaffRequests[idx];
      req.status = accept ? "accepted" : "rejected";

      if (accept) {
        if (!mockShopMembers[req.shopId]) mockShopMembers[req.shopId] = [];
        mockShopMembers[req.shopId].push({
          id: Date.now(),
          shopId: req.shopId,
          userId: mockUser.id,
          role: req.role,
          isActive: true,
          joinedAt: new Date().toISOString(),
          user: mockUser
        });
        
        const shopToAdd = mockShops.find(s => s.id === req.shopId);
        if (shopToAdd && !mockShops.some(s => s.id === req.shopId)) {
          mockShops.push(shopToAdd);
        }
      }

      mockStaffRequests.splice(idx, 1);
      return { success: true };
    }
  },
  sendInvite: async (token: string | null, shopId: number, email: string, role: "owner" | "shop_worker"): Promise<StaffRequest> => {
    try {
      return await apiCall<StaffRequest>({
        url: `/api/staff/shop/${shopId}/invite`,
        method: "POST",
        data: { email, role }
      }, token);
    } catch {
      const receiver = mockAdminUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!receiver) throw new Error("User with this email not found in Onbillo database.");

      const newInvite: StaffRequest = {
        id: Date.now(),
        shopId,
        requestedBy: mockUser.id,
        requestedTo: receiver.id,
        role,
        status: "pending",
        createdAt: new Date().toISOString(),
        shopName: mockShops.find(s => s.id === shopId)?.name || "Shop",
        requesterName: mockUser.name,
        receiverEmail: receiver.email,
        receiverName: receiver.name
      };
      
      mockStaffRequests.push(newInvite);
      return newInvite;
    }
  },
  removeStaff: async (token: string | null, shopId: number, memberId: number): Promise<any> => {
    try {
      return await apiCall<any>({
        url: `/api/staff/shop/${shopId}/member/${memberId}`,
        method: "DELETE"
      }, token);
    } catch {
      const list = mockShopMembers[shopId] || [];
      const idx = list.findIndex(m => m.id === memberId);
      if (idx === -1) throw new Error("Staff member not found");
      list.splice(idx, 1);
      return { success: true };
    }
  }
};
