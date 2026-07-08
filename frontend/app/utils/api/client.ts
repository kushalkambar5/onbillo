import axios, { AxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let isMockModeActive = false;

export function isMockMode(): boolean {
  if (typeof window !== "undefined") {
    return (window as any).__isMockMode || isMockModeActive;
  }
  return isMockModeActive;
}

export function setMockMode(active: boolean) {
  isMockModeActive = active;
  if (typeof window !== "undefined") {
    (window as any).__isMockMode = active;
    // Dispatch custom event to notify listeners
    window.dispatchEvent(new Event("mockModeChange"));
  }
}

// Axios instance configuration
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Resilient API Call wrapper using Axios
export async function apiCall<T>(config: AxiosRequestConfig, token: string | null): Promise<T> {
  if (isMockMode()) {
    throw new Error("Force mock sandbox mode");
  }

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
    
    // API request was successful, disable mock mode
    setMockMode(false);
    return response.data;
  } catch (error: any) {
    console.warn(`NestJS API call failed for ${config.method?.toUpperCase()} ${config.url}. Engaging sandbox fallback.`, error);
    setMockMode(true);
    throw error;
  }
}
