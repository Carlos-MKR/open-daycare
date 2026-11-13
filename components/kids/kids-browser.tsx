"use client";

import { useState } from "react";
import { KidCard } from "@/components/kids/kid-card";
import { SearchIcon } from "@/components/ui/icons";
import { type Kid } from "@/lib/kids";

type KidsBrowserProps = {
  kids: Kid[];
};

// Buscador + grid de niños reales agrupados por sala (SPEC 12); el filtrado
// por nombre es estado local (SPEC 03).
export function KidsBrowser({ kids }: KidsBrowserProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleKids = normalizedQuery
    ? kids.filter((kid) => kid.name.toLowerCase().includes(normalizedQuery))
    : kids;
  const sections = groupByRoom(visibleKids);

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

      {kids.length === 0 ? <EmptyState /> : null}

      {kids.length > 0 && sections.length === 0 ? (
        <p className="text-[14px] text-muted">
          Ningún niño coincide con la búsqueda.
        </p>
      ) : null}

      {sections.map((section) => (
        <section key={section.roomName}>
          <div className="mb-[14px] flex items-center gap-[12px]">
            <span className="text-[12.5px] font-extrabold tracking-[.8px] text-ink">
              {section.roomName.toUpperCase()}
            </span>
            <span className="text-[13px] text-muted">
              {section.kids.length} {section.kids.length === 1 ? "niño" : "niños"}
            </span>
            <span className="h-px flex-1 bg-line-soft" />
          </div>

          <div className="mb-[22px] grid grid-cols-1 gap-[14px] md:grid-cols-2">
            {section.kids.map((kid) => (
              <KidCard key={kid.id} kid={kid} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[18px] border border-dashed border-[#e3d5c2] bg-surface px-[24px] py-[48px] text-center">
      <div className="font-display text-[18px] font-semibold text-ink">
        Todavía no hay niños
      </div>
      <p className="mx-auto mt-[8px] max-w-[360px] text-[14px] leading-[1.6] text-muted-strong">
        Usá el botón «Agregar niño» para inscribir al primero en la guardería.
      </p>
    </div>
  );
}

function groupByRoom(kids: Kid[]): { roomName: string; kids: Kid[] }[] {
  const byRoom = new Map<string, Kid[]>();

  for (const kid of kids) {
    const roomKids = byRoom.get(kid.room);
    if (roomKids) {
      roomKids.push(kid);
    } else {
      byRoom.set(kid.room, [kid]);
    }
  }

  return [...byRoom.entries()]
    .map(([roomName, roomKids]) => ({ roomName, kids: roomKids }))
    .sort((a, b) => a.roomName.localeCompare(b.roomName, "es"));
}
