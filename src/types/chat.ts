export type MessageSender = "user" | "ai";

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface ChatRequest {
  query: string;
  document_id: number | string;
  top_k?: number;
}

export interface SSETokenPayload {
  token?: string;
  error?: string;
}
