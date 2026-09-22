"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Bot, User, Sparkles, AlertCircle, ShieldAlert } from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface ChatInterfaceProps {
  isDocumentUploaded: boolean;
  uploadedFilename: string | null;
  chunksCount: number;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isDocumentUploaded,
  uploadedFilename,
  chunksCount,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when document becomes available
  useEffect(() => {
    if (isDocumentUploaded) {
      inputRef.current?.focus();
    }
  }, [isDocumentUploaded]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const query = inputQuery.trim();
    if (!query || isStreaming || !isDocumentUploaded) return;

    setErrorMessage(null);
    setInputQuery("");

    const userMessageId = `user-${Date.now()}`;
    const aiMessageId = `ai-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newUserMessage: ChatMessage = {
      id: userMessageId,
      sender: "user",
      content: query,
      timestamp,
    };

    const newAiPlaceholderMessage: ChatMessage = {
      id: aiMessageId,
      sender: "ai",
      content: "",
      timestamp,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, newUserMessage, newAiPlaceholderMessage]);
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ query, top_k: 4 }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.detail || `Server returned error ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No readable stream received from backend.");
      }

      // Read Server-Sent Events stream using ReadableStream reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let partialBuffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        partialBuffer += decoder.decode(value, { stream: true });

        // Split by Server-Sent Event boundary (\n\n)
        const events = partialBuffer.split("\n\n");
        partialBuffer = events.pop() || ""; // Retain incomplete remainder

        for (const event of events) {
          const lines = event.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataPayload = line.slice(6).trim();

              if (dataPayload === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(dataPayload);
                if (parsed.token) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, content: msg.content + parsed.token }
                        : msg
                    )
                  );
                } else if (parsed.error) {
                  setErrorMessage(parsed.error);
                }
              } catch {
                // If payload is plain text rather than JSON
                if (dataPayload && dataPayload !== "[DONE]") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, content: msg.content + dataPayload }
                        : msg
                    )
                  );
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to communicate with Document AI service.");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content:
                  msg.content ||
                  "⚠️ An error occurred while retrieving answer from the document context.",
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg))
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/20">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              Document Assistant
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            </h3>
            <p className="text-xs text-slate-400">
              {isDocumentUploaded && uploadedFilename ? (
                <span>
                  Querying <strong className="text-slate-200">{uploadedFilename}</strong> (
                  {chunksCount} chunks)
                </span>
              ) : (
                "Upload a document on the left to start asking questions"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-teal-400" />
            Zero Hallucination Mode
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!isDocumentUploaded && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <Bot className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-medium text-slate-300">Document AI Offline</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Please upload a PDF document on the left panel to initialize the vector database
                and enable real-time semantic chat.
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-semibold text-slate-200">
                Document Indexed Successfully
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                You can now ask specific questions about figures, policies, dates, or summaries
                contained within the uploaded document.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.sender === "user";
            return (
              <div
                key={message.id}
                className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-400 flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                    isUser
                      ? "bg-teal-600 text-white rounded-tr-xs"
                      : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-xs"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-teal-400 animate-pulse align-middle" />
                    )}
                  </div>
                  <div
                    className={`mt-1.5 text-[10px] ${
                      isUser ? "text-teal-100/70 text-right" : "text-slate-500 text-left"
                    }`}
                  >
                    {message.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/50 flex items-center gap-2.5 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <form onSubmit={handleSubmit} className="flex gap-2.5 items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={!isDocumentUploaded || isStreaming}
            placeholder={
              !isDocumentUploaded
                ? "Upload a document to unlock chat..."
                : isStreaming
                ? "DocuMind AI is analyzing document context..."
                : "Ask a question based on your document..."
            }
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={!isDocumentUploaded || isStreaming || !inputQuery.trim()}
            className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white disabled:text-slate-500 p-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-sm flex items-center justify-center flex-shrink-0"
            aria-label="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[11px] text-slate-500 text-center mt-2.5">
          DocuMind AI retrieves relevant text segments and strictly adheres to document truth.
        </p>
      </div>
    </div>
  );
};
