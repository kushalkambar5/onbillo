import { apiCall } from "./client";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface AiAssistantResponse {
  response: string;
  agentName?: string;
}

export const aiAssistantApi = {
  sendMessage: async (
    shopId: string,
    prompt: string,
    history: AiChatMessage[] = [],
    token: string | null = null
  ): Promise<AiAssistantResponse> => {
    return apiCall<AiAssistantResponse>(
      {
        url: `/api/shops/${shopId}/ai-assistant`,
        method: "POST",
        data: {
          prompt,
          history: history.map((h) => ({ role: h.role, content: h.content })),
        },
      },
      token
    );
  },
};
