import { apiCall } from "./client";
import { User } from "./types";

export const usersApi = {
  getMe: async (token: string | null): Promise<User> => {
    return await apiCall<User>({
      url: "/api/users/me",
      method: "GET"
    }, token);
  },
  updateProfile: async (token: string | null, name: string, phone: string): Promise<User> => {
    return await apiCall<User>({
      url: "/api/users/me",
      method: "PUT",
      data: { phone }
    }, token);
  }
};
