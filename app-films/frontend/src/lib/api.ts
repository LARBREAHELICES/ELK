export type SortValue = "relevance" | "rating_desc" | "popularity_desc" | "newest";

export type SearchParams = {
  q: string;
  page: number;
  size: number;
  sort: SortValue;
  language?: string;
  minRating?: number;
  yearFrom?: number;
  yearTo?: number;
};

export type MovieHit = {
  id: string | null;
  score: number | null;
  title: string | null;
  overview: string | null;
  original_language: string | null;
  release_date: string | null;
  vote_average: number | null;
  vote_count: number | null;
  popularity: number | null;
};

export type FacetBucket = {
  key: string;
  count: number;
};

export type SearchResponse = {
  total: number;
  page: number;
  size: number;
  took_ms: number;
  items: MovieHit[];
  facets: {
    languages: FacetBucket[];
  };
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

function toQueryString(params: SearchParams): string {
  const q = new URLSearchParams();
  if (params.q.trim()) q.set("q", params.q.trim());
  q.set("page", String(params.page));
  q.set("size", String(params.size));
  q.set("sort", params.sort);
  if (params.language) q.set("language", params.language);
  if (typeof params.minRating === "number") q.set("min_rating", String(params.minRating));
  if (typeof params.yearFrom === "number") q.set("year_from", String(params.yearFrom));
  if (typeof params.yearTo === "number") q.set("year_to", String(params.yearTo));
  return q.toString();
}

export async function fetchSearch(params: SearchParams): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE}/search?${toQueryString(params)}`);
  if (!response.ok) throw new Error(`Search failed: ${response.status}`);
  return response.json();
}

export async function fetchSuggestions(query: string): Promise<string[]> {
  const value = query.trim();
  if (value.length < 2) return [];
  const response = await fetch(`${API_BASE}/suggest?q=${encodeURIComponent(value)}&limit=8`);
  if (!response.ok) throw new Error(`Suggest failed: ${response.status}`);
  const payload = (await response.json()) as { suggestions: string[] };
  return payload.suggestions;
}
