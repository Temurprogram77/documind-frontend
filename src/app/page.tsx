"use client";

import React, { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ChatInterface } from "@/components/ChatInterface";
import { AuthModal } from "@/components/AuthModal";
import {
  Brain,
  ShieldCheck,
  Database,
  User as UserIcon,
  LogOut,
  LogIn,
} from "lucide-react";
import { useDocuMindStats } from "@/hooks";
import { DocumentInfo } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [activeDocument, setActiveDocument] = useState<DocumentInfo | null>(null);
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();

  // TanStack Query polling vector statistics
  const { data: statsData } = useDocuMindStats();

  const handleUploadSuccess = (info: DocumentInfo) => {
    setActiveDocument(info);
  };

  const handleResetDocument = () => {
    setActiveDocument(null);
  };

  const totalChunks =
    statsData?.total_chunks ?? statsData?.indexed_chunks ?? activeDocument?.chunksCount ?? 0;

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Enterprise Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-teal-400">
              <Brain className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                DocuMind <span className="text-teal-400 font-extrabold">AI</span>
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                Enterprise RAG
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Autonomous Document Intelligence & Isolated Vector Knowledge Base
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Live Vector Stats badge powered by TanStack Query */}
          <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>
              Vectors: <strong className="text-teal-300 font-mono">{totalChunks}</strong> chunks
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-400 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Document Grounding</span>
          </div>

          {/* Authentication Status / Profile */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xs uppercase">
                  {user.username.slice(0, 2)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-semibold text-slate-200 text-xs leading-none">
                    {user.username}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {user.email || "Active User"}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="pl-3 border-l border-slate-800">
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Document Upload & Metadata (4 cols on lg) */}
        <section className="lg:col-span-5 xl:col-span-4 border-r border-slate-800 bg-slate-950/80 overflow-y-auto">
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onReset={handleResetDocument}
            activeDocumentId={activeDocument?.documentId}
          />
        </section>

        {/* Right Column: Interactive Chat & SSE Streaming (8 cols on lg) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col h-full overflow-hidden bg-slate-950">
          <ChatInterface
            isDocumentUploaded={Boolean(activeDocument)}
            documentInfo={activeDocument}
          />
        </section>
      </div>

      {/* Global Authentication Modal */}
      <AuthModal />
    </main>
  );
}
