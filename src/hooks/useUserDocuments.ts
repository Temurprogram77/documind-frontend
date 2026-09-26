import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentService } from "@/services";
import { DocumentListItem, ApiError } from "@/types";

export const useUserDocuments = (enabled: boolean = true) => {
  return useQuery<DocumentListItem[], ApiError>({
    queryKey: ["user", "documents"],
    queryFn: () => documentService.getDocuments(),
    enabled,
    staleTime: 30000,
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<{ status: string; message: string }, ApiError, number>({
    mutationFn: (documentId: number) => documentService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "documents"] });
      queryClient.invalidateQueries({ queryKey: ["documind", "stats"] });
    },
  });
};

export default useUserDocuments;
