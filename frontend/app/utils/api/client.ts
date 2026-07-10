import axios, { AxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

if (typeof window !== "undefined") {
  console.log("[Onbillo API] Initialized with Base URL:", API_BASE_URL);
}

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

  try {
    const response = await axiosInstance.request<T>({
      ...config,
      headers,
    });
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data) {
      const serverData = err.response.data;
      if (serverData.errors && Array.isArray(serverData.errors)) {
        err.message = serverData.errors
          .map((e: any) => `${e.field}: ${e.message}`)
          .join(", ");
      } else {
        const serverMessage = serverData.message || serverData.error;
        if (serverMessage) {
          err.message = Array.isArray(serverMessage)
            ? serverMessage.join(", ")
            : serverMessage;
        }
      }
    }
    throw err;
  }
}
