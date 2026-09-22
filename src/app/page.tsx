"use client";

import React, { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ChatInterface } from "@/components/ChatInterface";
import { Brain, Cpu, ShieldCheck } from "lucide-react";

export default function Home() {
  const [isDocumentUploaded, setIsDocumentUploaded] = useState<boolean>(false);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [chunksCount, setChunksCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleUploadSuccess = (filename: string, chunks: number) => {
    setIsDocumentUploaded(true);
    setUploadedFilename(filename);
    setChunksCount(chunks);
  };

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
                Enterprise MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Document Intelligence & RAG System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2 text-slate-400 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span>ChromaDB Vector Store</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-400 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Hallucination Grounding</span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium text-xs">System Ready</span>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Document Upload & Metadata (4 cols on lg) */}
        <section className="lg:col-span-5 xl:col-span-4 border-r border-slate-800 bg-slate-950/80 overflow-y-auto">
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </section>

        {/* Right Column: Interactive Chat & SSE Streaming (8 cols on lg) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col h-full overflow-hidden bg-slate-950">
          <ChatInterface
            isDocumentUploaded={isDocumentUploaded}
            uploadedFilename={uploadedFilename}
            chunksCount={chunksCount}
          />
        </section>
      </div>
    </main>
  );
}
