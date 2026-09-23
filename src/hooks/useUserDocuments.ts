import { useQuery } from "@tanstack/react-query";
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

export default useUserDocuments;
