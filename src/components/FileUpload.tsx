"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  FolderOpen,
  Calendar,
  Lock,
} from "lucide-react";
import { useUploadDocument, useUserDocuments } from "@/hooks";
import { DocumentInfo, DocumentListItem } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface FileUploadProps {
  onUploadSuccess: (info: DocumentInfo) => void;
  onReset: () => void;
  activeDocumentId?: number | string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onReset,
  activeDocumentId,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<DocumentInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch list of user's uploaded documents if authenticated
  const { data: userDocuments, isLoading: isLoadingDocs } = useUserDocuments(isAuthenticated);

  const { upload, isUploading, progress, error, reset: resetMutation } = useUploadDocument({
    onSuccess: (data) => {
      const info: DocumentInfo = {
        filename: data.filename || "Uploaded Document.pdf",
        chunksCount: data.chunks_processed,
        documentId: data.document_id,
        uploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setUploadedDoc(info);
      setLocalError(null);
      onUploadSuccess(info);
    },
    onError: (apiError) => {
      const code = apiError.status ?? apiError.statusCode;
      if (code === 401) {
        setLocalError("Session expired or authentication required. Please sign in.");
        openAuthModal();
      } else if (code === 413) {
        setLocalError("Payload Too Large: File exceeds the 25MB limit. Please upload a smaller PDF.");
      } else if (code === 415) {
        setLocalError("Unsupported Media Type: Only valid PDF documents are accepted.");
      } else {
        setLocalError(apiError.message || "Failed to upload and index document.");
      }
    },
  });

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = (file: File) => {
    if (!isAuthenticated) {
      setLocalError("Authentication required. Please sign in to upload documents.");
      openAuthModal();
      return;
    }

    setLocalError(null);

    // Security Check: MIME type & extension
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setLocalError("Unsupported Media Type: Only PDF files (.pdf) are permitted.");
      return;
    }

    // Strict 25MB limit check
    if (file.size > 25 * 1024 * 1024) {
      setLocalError("Payload Too Large: File exceeds the strict 25MB limit.");
      return;
    }

    if (file.size === 0) {
      setLocalError("Bad Request: Selected PDF file is empty (0 bytes).");
      return;
    }

    upload(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

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
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleResetClick = () => {
    setUploadedDoc(null);
    setLocalError(null);
    resetMutation();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onReset();
  };

  const handleSelectExistingDoc = (doc: DocumentListItem) => {
    const formattedDate = doc.uploaded_at
      ? new Date(doc.uploaded_at).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Previously uploaded";

    const info: DocumentInfo = {
      filename: doc.filename,
      chunksCount: 0,
      documentId: doc.id,
      uploadedAt: formattedDate,
    };
    setUploadedDoc(info);
    setLocalError(null);
    onUploadSuccess(info);
  };

  const displayError = localError || error?.message;

  return (
    <div className="flex flex-col h-full justify-between p-6 overflow-y-auto space-y-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            Document Ingestion
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Upload your enterprise PDF to partition and index vectors into ChromaDB.
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
            !isAuthenticated
              ? "border-slate-800 bg-slate-900/20 hover:border-slate-700"
              : dragActive
              ? "border-teal-400 bg-teal-950/20 scale-[0.99]"
              : isUploading
              ? "border-slate-700 bg-slate-900/50 cursor-wait"
              : uploadedDoc
              ? "border-emerald-500/50 bg-emerald-950/10"
              : "border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleChange}
            disabled={isUploading || !isAuthenticated}
          />

          {!isAuthenticated ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-teal-400">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200">
                  <span className="text-teal-400 font-semibold underline underline-offset-2">
                    Sign in required
                  </span>{" "}
                  to upload documents
                </p>
                <p className="text-xs text-slate-500">
                  Multi-tenant isolation requires a verified user token
                </p>
              </div>
            </div>
          ) : isUploading ? (
            <div className="flex flex-col items-center gap-3 py-4 w-full">
              <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
              <div className="space-y-2 w-full max-w-xs">
                <p className="text-sm font-semibold text-slate-200">
                  Uploading & Vectorizing Document...
                </p>
                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-400 h-1.5 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{progress}% complete</p>
              </div>
            </div>
          ) : uploadedDoc ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white truncate max-w-[260px]">
                  {uploadedDoc.filename}
                </p>
                <p className="text-xs font-medium text-emerald-400">
                  {uploadedDoc.chunksCount > 0
                    ? `✓ ${uploadedDoc.chunksCount} semantic chunks indexed`
                    : "✓ Selected from knowledge base"}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Doc ID: {uploadedDoc.documentId}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetClick();
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
                  PDF format strictly supported (max 25MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {displayError && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/50 flex items-start gap-2.5 text-red-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{displayError}</p>
          </div>
        )}

        {/* User's Existing Documents List */}
        {isAuthenticated && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-teal-400" />
                Your Documents
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {userDocuments?.length || 0} total
              </span>
            </div>

            {isLoadingDocs ? (
              <div className="py-4 flex items-center justify-center text-slate-500 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                Loading documents...
              </div>
            ) : userDocuments && userDocuments.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {userDocuments.map((doc) => {
                  const isCurrentActive =
                    activeDocumentId !== undefined && activeDocumentId !== null
                      ? String(activeDocumentId) === String(doc.id)
                      : String(uploadedDoc?.documentId) === String(doc.id);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectExistingDoc(doc)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isCurrentActive
                          ? "bg-teal-950/30 border-teal-500/50 text-white shadow-sm"
                          : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900/70"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <FileText
                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                            isCurrentActive ? "text-teal-400" : "text-slate-500"
                          }`}
                        />
                        <div className="truncate">
                          <p className="truncate font-medium">{doc.filename}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {doc.uploaded_at
                              ? new Date(doc.uploaded_at).toLocaleDateString()
                              : "Recent"}
                          </p>
                        </div>
                      </div>

                      {isCurrentActive ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 text-center border border-slate-800/60 rounded-lg">
                No documents uploaded yet. Upload your first PDF above.
              </p>
            )}
          </div>
        )}

        {/* Pipeline Specs Details */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Enterprise Architecture Specs
          </h3>
          <ul className="text-xs text-slate-400 space-y-2">
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Security & Isolation:</span>
              <span className="font-mono text-teal-400">JWT Multi-Tenant</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Vector Store:</span>
              <span className="font-mono text-slate-300">ChromaDB (Isolated)</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Chunk Strategy:</span>
              <span className="font-mono text-slate-300">1000 chars / 200 overlap</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500">Real-time Stream:</span>
              <span className="font-mono text-teal-400">Server-Sent Events (SSE)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Status */}
      <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span>DocuMind Enterprise v1.2</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400">API Connected</span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
