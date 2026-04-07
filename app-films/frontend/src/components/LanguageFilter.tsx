import { Button } from "@/components/ui/button";
import { type FacetBucket } from "@/lib/api";

type Props = {
  languages: FacetBucket[];
  selected: string | undefined;
  onSelect: (value: string | undefined) => void;
};

export function LanguageFilter({ languages, selected, onSelect }: Props) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Langues</h3>
        <Button variant="outline" size="sm" onClick={() => onSelect(undefined)}>
          Reset
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {languages.length === 0 ? <span className="text-xs text-muted-foreground">Aucune facette</span> : null}
        {languages.map((bucket) => (
          <Button
            key={bucket.key}
            size="sm"
            variant={selected === bucket.key ? "default" : "secondary"}
            onClick={() => onSelect(bucket.key)}
          >
            {bucket.key} ({bucket.count})
          </Button>
        ))}
      </div>
    </div>
  );
}
