import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentService } from "@/services";
import { UploadResponse, ApiError } from "@/types";

interface UseUploadDocumentOptions {
  onSuccess?: (data: UploadResponse) => void;
  onError?: (error: ApiError) => void;
}

export const useUploadDocument = (options?: UseUploadDocumentOptions) => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const mutation = useMutation<UploadResponse, ApiError, File>({
    mutationFn: (file: File) => {
      setUploadProgress(0);
      return documentService.uploadDocument(file, ({ percentage }) => {
        setUploadProgress(percentage);
      });
    },
    onSuccess: (data) => {
      // Invalidate stats and user document list so UI updates automatically
      queryClient.invalidateQueries({ queryKey: ["documind", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["user", "documents"] });
      setUploadProgress(100);
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      setUploadProgress(0);
      options?.onError?.(error);
    },
  });

  return {
    upload: mutation.mutate,
    uploadAsync: mutation.mutateAsync,
    isUploading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    progress: uploadProgress,
    reset: mutation.reset,
  };
};

export default useUploadDocument;
