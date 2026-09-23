"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  ShieldAlert,
  StopCircle,
  Trash2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useChatStream } from "@/hooks";
import { DocumentInfo } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface ChatInterfaceProps {
  isDocumentUploaded: boolean;
  documentInfo: DocumentInfo | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isDocumentUploaded,
  documentInfo,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [inputQuery, setInputQuery] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isStreaming,
    errorMessage,
    sendMessage,
    abortStream,
    clearMessages,
  } = useChatStream();

  // Scroll to bottom whenever messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when document is ready
  useEffect(() => {
    if (isAuthenticated && isDocumentUploaded) {
      inputRef.current?.focus();
    }
  }, [isAuthenticated, isDocumentUploaded]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (!inputQuery.trim() || isStreaming || !isDocumentUploaded || !documentInfo?.documentId) {
      return;
    }

    const query = inputQuery.trim();
    setInputQuery("");
    sendMessage(query, {
      documentId: documentInfo.documentId,
      topK: 4,
    });
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
              Document Intelligence Assistant
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            </h3>
            <p className="text-xs text-slate-400">
              {!isAuthenticated ? (
                "Multi-Tenant RAG • Authentication required"
              ) : isDocumentUploaded && documentInfo ? (
                <span>
                  Querying <strong className="text-slate-200">{documentInfo.filename}</strong> (
                  {documentInfo.chunksCount > 0
                    ? `${documentInfo.chunksCount} chunks indexed`
                    : `Doc ID: ${documentInfo.documentId}`}
                  )
                </span>
              ) : (
                "Select or upload a PDF to query isolated vectors in ChromaDB"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && !isStreaming && (
            <button
              onClick={clearMessages}
              title="Clear conversation"
              className="text-xs text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-teal-400" />
            Grounded Context
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!isAuthenticated ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 shadow-lg">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="text-base font-semibold text-white">Sign In Required</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                DocuMind enforces strict multi-tenant ChromaDB isolation. Please log in or register
                to upload and query your private enterprise documents.
              </p>
            </div>
            <button
              onClick={openAuthModal}
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <span>Sign In / Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : !isDocumentUploaded && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <Bot className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-medium text-slate-300">Document AI Standby</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Please upload a PDF document or select one from &ldquo;Your Documents&rdquo; on the left panel
                to begin real-time semantic chat.
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
                Ready for Document Inquiries
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                You can now ask questions about figures, policies, dates, or summaries contained
                within <strong className="text-teal-300">{documentInfo?.filename}</strong>.
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
            disabled={!isAuthenticated || !isDocumentUploaded || isStreaming}
            placeholder={
              !isAuthenticated
                ? "Sign in to unlock Document AI chat..."
                : !isDocumentUploaded
                ? "Upload or select a document to unlock chat..."
                : isStreaming
                ? "Analyzing document context via SSE stream..."
                : "Ask a question based on your document..."
            }
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={abortStream}
              className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-xl transition-all shadow-sm flex items-center justify-center flex-shrink-0"
              aria-label="Stop generation"
              title="Stop generation"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isAuthenticated || !isDocumentUploaded || !inputQuery.trim()}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white disabled:text-slate-500 p-3 rounded-xl transition-all disabled:cursor-not-allowed shadow-sm flex items-center justify-center flex-shrink-0"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
        <p className="text-[11px] text-slate-500 text-center mt-2.5">
          Django DRF Backend • Real-time Server-Sent Events (SSE) Streaming
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
