"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";

interface UploadResponse {
  status: string;
  chunks_processed: number;
  document_id?: string;
  filename?: string;
}

interface FileUploadProps {
  onUploadSuccess: (filename: string, chunksCount: number) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  isProcessing,
  setIsProcessing,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ filename: string; chunks: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = async (file: File) => {
    setErrorMsg(null);

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Only PDF documents (.pdf) are supported.");
      return;
    }

    if (file.size === 0) {
      setErrorMsg("The selected file is empty.");
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
      }

      const data: UploadResponse = await response.json();
      setSuccessInfo({
        filename: file.name,
        chunks: data.chunks_processed,
      });
      onUploadSuccess(file.name, data.chunks_processed);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload and process document.");
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const triggerSelect = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setSuccessInfo(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full justify-between p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            Document Ingestion
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Upload your enterprise PDF to extract, chunk, and index into ChromaDB.
          </p>
        </div>

        {/* Upload Box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={triggerSelect}
          className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-teal-400 bg-teal-950/20 scale-[0.99]"
              : isProcessing
              ? "border-slate-700 bg-slate-900/50 cursor-wait"
              : successInfo
              ? "border-emerald-500/50 bg-emerald-950/10"
              : "border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleChange}
            disabled={isProcessing}
          />

          {isProcessing ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">
                  Parsing & Embedding Document...
                </p>
                <p className="text-xs text-slate-400">
                  Partitioning chunks (1000 chars, 200 overlap) & vectorizing
                </p>
              </div>
            </div>
          ) : successInfo ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white truncate max-w-[260px]">
                  {successInfo.filename}
                </p>
                <p className="text-xs font-medium text-emerald-400">
                  ✓ {successInfo.chunks} semantic chunks indexed
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="mt-2 text-xs flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors py-1 px-3 rounded-md bg-slate-800 hover:bg-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Upload New Document
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-teal-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200">
                  <span className="text-teal-400 font-semibold underline underline-offset-2">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-slate-500">
                  PDF format (max size 25MB recommended)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/50 flex items-start gap-2.5 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Pipeline Specs Details */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            RAG Pipeline Architecture
          </h3>
          <ul className="text-xs text-slate-400 space-y-2">
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Vector Store:</span>
              <span className="font-mono text-slate-300">ChromaDB (Persistent)</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Chunk Strategy:</span>
              <span className="font-mono text-slate-300">1000 chars / 200 overlap</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Context Search:</span>
              <span className="font-mono text-slate-300">Cosine Similarity (Top 4)</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Streaming:</span>
              <span className="font-mono text-teal-400">SSE (Server-Sent Events)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Status */}
      <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span>DocuMind Enterprise v1.0</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400">ChromaDB Online</span>
        </div>
      </div>
    </div>
  );
};
