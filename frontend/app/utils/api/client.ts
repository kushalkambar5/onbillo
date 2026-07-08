import axios, { AxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function isMockMode(): boolean {
  return false;
}

export function setMockMode(active: boolean) {
  // Mock mode disabled entirely
}

// Axios instance configuration
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Resilient API Call wrapper using Axios
export async function apiCall<T>(config: AxiosRequestConfig, token: string | null): Promise<T> {
  // Inject token if available
  const headers: Record<string, any> = { ...(config.headers || {}) };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await axiosInstance.request<T>({
    ...config,
    headers,
  });
  return response.data;
}
