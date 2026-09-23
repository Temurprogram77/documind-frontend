import { useQuery } from "@tanstack/react-query";
import { documentService } from "@/services";
import { StatsResponse, ApiError } from "@/types";

export const useDocuMindStats = () => {
  return useQuery<StatsResponse, ApiError>({
    queryKey: ["documind", "stats"],
    queryFn: () => documentService.getStats(),
    refetchInterval: 15000, // Poll every 15s to keep vector counts fresh
  });
};

export default useDocuMindStats;
