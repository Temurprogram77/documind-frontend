import { useState, useRef, useCallback } from "react";
import { chatService } from "@/services";
import { ChatMessage, ChatRequest } from "@/types";

export const useChatStream = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (queryText: string, options?: { documentId?: number | string; topK?: number }) => {
      const cleanQuery = queryText.trim();
      if (!cleanQuery || isStreaming) return;

      setErrorMessage(null);

      if (!options?.documentId) {
        setErrorMessage("Please select or upload a document before submitting a query.");
        return;
      }

      const userMsgId = `user-${Date.now()}`;
      const aiMsgId = `ai-${Date.now()}`;
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const userMessage: ChatMessage = {
        id: userMsgId,
        sender: "user",
        content: cleanQuery,
        timestamp,
      };

      const aiMessage: ChatMessage = {
        id: aiMsgId,
        sender: "ai",
        content: "",
        timestamp,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, aiMessage]);
      setIsStreaming(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const requestPayload: ChatRequest = {
        query: cleanQuery,
        top_k: options?.topK || 4,
        document_id: options.documentId,
      };

      try {
        await chatService.streamChat(requestPayload, {
          signal: abortController.signal,
          onToken: (token: string) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId ? { ...msg, content: msg.content + token } : msg
              )
            );
          },
          onError: (errMsg: string) => {
            setErrorMessage(errMsg);
          },
        });
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Handled cancellation cleanly
          return;
        }
        const message = err.message || "Failed to communicate with Document AI service.";
        setErrorMessage(message);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  content:
                    msg.content ||
                    "⚠️ An error occurred while retrieving answers from document context.",
                }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg))
        );
      }
    },
    [isStreaming]
  );

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setErrorMessage(null);
  }, []);

  return {
    messages,
    isStreaming,
    errorMessage,
    sendMessage,
    abortStream,
    clearMessages,
  };
};

export default useChatStream;
