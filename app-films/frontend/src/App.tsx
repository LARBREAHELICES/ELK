import { useMemo, useState } from "react";
import { Film, Loader2 } from "lucide-react";

import { LanguageFilter } from "@/components/LanguageFilter";
import { MovieCard } from "@/components/MovieCard";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { useMovieSearch, useTitleSuggestions } from "@/hooks/use-search";
import { type SortValue } from "@/lib/api";

export default function App() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortValue>("relevance");
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  const debouncedQuery = useDebounce(query, 350);

  const params = useMemo(
    () => ({
      q: debouncedQuery,
      page,
      size: 12,
      sort,
      language,
      minRating,
    }),
    [debouncedQuery, page, sort, language, minRating]
  );

  const search = useMovieSearch(params);
  const suggestions = useTitleSuggestions(query);

  const total = search.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Film className="h-8 w-8 text-primary" />
            Movies Search Engine
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            React + TanStack Query + FastAPI + Logstash + Elasticsearch + Kibana
          </p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
          {search.isFetching ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Mise à jour...
            </span>
          ) : (
            <span>{total} résultats</span>
          )}
        </div>
      </header>

      <section className="space-y-4">
        <SearchBar
          query={query}
          suggestions={suggestions.data ?? []}
          sort={sort}
          minRating={minRating}
          onQueryChange={(value) => {
            setPage(1);
            setQuery(value);
          }}
          onSortChange={(value) => {
            setPage(1);
            setSort(value);
          }}
          onMinRatingChange={(value) => {
            setPage(1);
            setMinRating(value);
          }}
          onSubmit={() => setPage(1)}
        />

        <LanguageFilter
          languages={search.data?.facets.languages ?? []}
          selected={language}
          onSelect={(value) => {
            setPage(1);
            setLanguage(value);
          }}
        />

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} / {totalPages} - Temps de réponse: {search.data?.took_ms ?? 0} ms
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant
            </Button>
          </div>
        </div>

        {search.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-56" />
            ))}
          </div>
        ) : null}

        {!search.isLoading && search.data?.items.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            Aucun résultat. Vérifie que l'index `tmdb-movies` est bien alimenté par Logstash.
          </div>
        ) : null}

        {!search.isLoading && (search.data?.items.length ?? 0) > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {search.data?.items.map((item, idx) => (
              <MovieCard key={item.id ?? `${item.title ?? "movie"}-${idx}`} item={item} />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
