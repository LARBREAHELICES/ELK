import { useQuery } from "@tanstack/react-query";

import { fetchSearch, fetchSuggestions, type SearchParams } from "@/lib/api";

export function useMovieSearch(params: SearchParams) {
  return useQuery({
    queryKey: ["search", params],
    queryFn: () => fetchSearch(params),
    placeholderData: (prev) => prev,
  });
}

export function useTitleSuggestions(query: string) {
  return useQuery({
    queryKey: ["suggest", query],
    queryFn: () => fetchSuggestions(query),
    enabled: query.trim().length >= 2,
  });
}
