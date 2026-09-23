import { API_BASE_URL } from "./api";
import { authStorage } from "./authService";
import { ChatRequest, SSETokenPayload } from "@/types";

export const chatService = {
  /**
   * Initiates Server-Sent Events (SSE) streaming with Django DRF: POST /api/chat/
   */
  async streamChat(
    request: ChatRequest,
    options: {
      onToken: (token: string) => void;
      onError?: (errorMsg: string) => void;
      onComplete?: () => void;
      signal?: AbortSignal;
    }
  ): Promise<void> {
    const { onToken, onError, onComplete, signal } = options;

    const token = authStorage.getAccessToken();
    if (!token) {
      throw new Error("Authentication required. Please log in to query your documents.");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
      "Authorization": `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/chat/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        document_id: request.document_id,
        query: request.query,
      }),
      signal,
    });

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errJson.error || errorDetail;
      } catch {
        // use default errorDetail
      }

      if (response.status === 401 && typeof window !== "undefined") {
        window.dispatchEvent(new Event("documind:unauthorized"));
      }

      throw new Error(errorDetail);
    }

    if (!response.body) {
      throw new Error("Response body is not a ReadableStream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const lines = event.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();

              if (dataStr === "[DONE]") {
                continue;
              }

              try {
                const parsed: SSETokenPayload = JSON.parse(dataStr);
                if (parsed.token) {
                  onToken(parsed.token);
                } else if (parsed.error) {
                  onError?.(parsed.error);
                }
              } catch {
                if (dataStr) {
                  onToken(dataStr);
                }
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      onComplete?.();
    }
  },
};

export default chatService;
