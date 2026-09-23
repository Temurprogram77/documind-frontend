import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentService } from "@/services";
import { ResetResponse, ApiError } from "@/types";

export const useResetStore = (options?: {
  onSuccess?: (data: ResetResponse) => void;
  onError?: (error: ApiError) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<ResetResponse, ApiError, string | undefined>({
    mutationFn: (adminToken?: string) => documentService.resetStore(adminToken),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documind", "stats"] });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export default useResetStore;
