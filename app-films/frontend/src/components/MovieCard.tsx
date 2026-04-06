import { Star, CalendarDays, Languages, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type MovieHit } from "@/lib/api";

type Props = {
  item: MovieHit;
};

function safeText(value: string | null | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

export function MovieCard({ item }: Props) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="line-clamp-2 text-lg">{safeText(item.title, "Sans titre")}</CardTitle>
        <CardDescription className="line-clamp-3">{safeText(item.overview, "Pas de résumé disponible")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge className="gap-1">
            <Languages className="h-3 w-3" />
            {safeText(item.original_language, "n/a")}
          </Badge>
          <Badge className="gap-1">
            <CalendarDays className="h-3 w-3" />
            {safeText(item.release_date, "n/a")}
          </Badge>
          <Badge className="gap-1">
            <Star className="h-3 w-3" />
            {item.vote_average ?? "n/a"}
          </Badge>
          <Badge className="gap-1">
            <TrendingUp className="h-3 w-3" />
            {item.popularity ?? "n/a"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
