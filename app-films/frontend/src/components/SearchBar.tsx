import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type SortValue } from "@/lib/api";

type Props = {
  query: string;
  suggestions: string[];
  sort: SortValue;
  minRating: number | undefined;
  onQueryChange: (value: string) => void;
  onSortChange: (value: SortValue) => void;
  onMinRatingChange: (value: number | undefined) => void;
  onSubmit: () => void;
};

export function SearchBar({
  query,
  suggestions,
  sort,
  minRating,
  onQueryChange,
  onSortChange,
  onMinRatingChange,
  onSubmit,
}: Props) {
  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_180px_160px_auto]">
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Recherche</label>
        <Input
          list="title-suggestions"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Ex: interstellar, science fiction, nolan"
        />
        <datalist id="title-suggestions">
          {suggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Tri</label>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortValue)}
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="relevance">Pertinence</option>
          <option value="rating_desc">Meilleure note</option>
          <option value="popularity_desc">Popularité</option>
          <option value="newest">Plus récent</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Note min</label>
        <select
          value={minRating ?? ""}
          onChange={(e) => onMinRatingChange(e.target.value ? Number(e.target.value) : undefined)}
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Aucune</option>
          <option value="5">5+</option>
          <option value="6">6+</option>
          <option value="7">7+</option>
          <option value="8">8+</option>
        </select>
      </div>

      <div className="flex items-end">
        <Button onClick={onSubmit} className="w-full gap-2 md:w-auto">
          <Search className="h-4 w-4" />
          Rechercher
        </Button>
      </div>
    </div>
  );
}
