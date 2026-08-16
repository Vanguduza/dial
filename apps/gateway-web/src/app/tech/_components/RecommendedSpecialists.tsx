"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SpecialistHintView = {
  required: boolean;
  brand: string | null;
  system: string | null;
  reason: string;
};

export type SpecialistCardView = {
  technicianId: string;
  displayName: string;
  tradeName: string;
  oemSpecialties?: string[];
  availability?: string;
};

function SpecialistTile({
  card,
  recommended,
  selected,
  onSelect,
}: {
  card: SpecialistCardView;
  recommended: boolean;
  selected: boolean;
  onSelect?: (technicianId: string) => void;
}) {
  const specialties = (card.oemSpecialties ?? []).join(", ");
  return (
    <li>
      <Card
        data-testid={
          recommended
            ? "tech-recommended-specialist"
            : "tech-fallback-technician"
        }
        className={cn(
          "transition-colors",
          recommended && "border-primary/50 bg-primary/5",
          selected && "ring-2 ring-primary",
        )}
      >
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{card.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {card.tradeName}
                {card.availability ? ` · ${card.availability}` : ""}
              </p>
            </div>
            {recommended ? <Badge>Specialist</Badge> : null}
          </div>
          {specialties ? (
            <p className="text-xs text-muted-foreground">OEM: {specialties}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {onSelect ? (
              <Button
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                onClick={() => onSelect(card.technicianId)}
              >
                {selected ? "Selected" : "Select"}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/tech/find-technicians/${card.technicianId}`}>
                View profile
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

/** FixItNow-patterned specialist ranking — ids come from jobs registry, not the model. */
export function RecommendedSpecialists({
  hint,
  recommended,
  fallback,
  selectedTechnicianId,
  onSelectTechnician,
}: {
  hint: SpecialistHintView;
  recommended: SpecialistCardView[];
  fallback: SpecialistCardView[];
  selectedTechnicianId?: string | null;
  onSelectTechnician?: (technicianId: string) => void;
}) {
  if (!hint.required) {
    return null;
  }
  return (
    <section
      className="space-y-3"
      data-testid="tech-specialist-routing"
    >
      <div>
        <h2 className="text-lg font-semibold">Recommended specialist</h2>
        <p className="text-sm text-muted-foreground">{hint.reason}</p>
      </div>
      {recommended.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {recommended.map((c) => (
            <SpecialistTile
              key={c.technicianId}
              card={c}
              recommended
              selected={selectedTechnicianId === c.technicianId}
              {...(onSelectTechnician
                ? { onSelect: onSelectTechnician }
                : {})}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No registered {hint.brand ?? "OEM"} specialist yet.
        </p>
      )}
      {fallback.length > 0 ? (
        <>
          <h3 className="text-base font-semibold">Other technicians</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {fallback.slice(0, 4).map((c) => (
              <SpecialistTile
                key={c.technicianId}
                card={c}
                recommended={false}
                selected={selectedTechnicianId === c.technicianId}
                {...(onSelectTechnician
                  ? { onSelect: onSelectTechnician }
                  : {})}
              />
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
