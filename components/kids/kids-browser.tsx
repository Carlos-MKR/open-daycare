"use client";

import { useState } from "react";
import { KidCard } from "@/components/kids/kid-card";
import { SearchIcon } from "@/components/ui/icons";
import type { Kid } from "@/lib/kids";

type KidsBrowserProps = {
  kids: Kid[];
};

// Buscador + grid de niños; el filtrado por nombre es estado local (SPEC 03).
export function KidsBrowser({ kids }: KidsBrowserProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleKids = normalizedQuery
    ? kids.filter((kid) => kid.name.toLowerCase().includes(normalizedQuery))
    : kids;

  return (
    <div>
      <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-[16px] py-[12px]">
        <SearchIcon size={18} className="text-photo-fg" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar niño…"
          className="flex-1 border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-placeholder"
        />
      </div>

      <div className="mb-[14px] flex items-center gap-[12px]">
        <span className="text-[12.5px] font-extrabold tracking-[.8px] text-ink">
          SALA SOLES
        </span>
        <span className="text-[13px] text-muted">{kids.length} niños</span>
        <span className="h-px flex-1 bg-line-soft" />
      </div>

      <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
        {visibleKids.map((kid) => (
          <KidCard key={kid.slug} kid={kid} />
        ))}
      </div>
    </div>
  );
}
