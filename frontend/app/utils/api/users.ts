import { apiCall } from "./client";
import { User } from "./types";
import { mockUser } from "./mockData";

export const usersApi = {
  getMe: async (token: string | null): Promise<User> => {
    try {
      return await apiCall<User>({
        url: "/api/users/me",
        method: "GET"
      }, token);
    } catch {
      return mockUser;
    }
  },
  updateProfile: async (token: string | null, name: string, phone: string): Promise<User> => {
    try {
      await apiCall<User>({
        url: "/api/users/me",
        method: "PUT",
        data: { phone }
      }, token);
      mockUser.name = name;
      mockUser.phone = phone;
      return mockUser;
    } catch {
      mockUser.name = name;
      mockUser.phone = phone;
      return mockUser;
    }
  }
};
