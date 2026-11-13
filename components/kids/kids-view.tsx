"use client";

import { useRef, useState } from "react";
import { AddChildModal, type AddChildFormState } from "@/components/kids/add-child-modal";
import { MobileTabBar } from "@/components/feed/mobile-tabbar";
import { MobileTopBar } from "@/components/feed/mobile-topbar";
import { Sidebar } from "@/components/feed/sidebar";
import { KidsBrowser } from "@/components/kids/kids-browser";
import { PlusIcon } from "@/components/ui/icons";
import { KIDS, type Kid } from "@/lib/kids";

// Estado client del listado de niños (references/pantallas/ninos.dc.html,
// SPEC 03). Lo renderiza app/kids/page.tsx tras el guard requireUser().
export function KidsView() {
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [kids, setKids] = useState<Kid[]>(KIDS);
  const addChildButtonRef = useRef<HTMLButtonElement>(null);

  function handleSave(child: AddChildFormState) {
    const name = child.fullName.trim();
    const allergy = child.allergies
      .split(",")[0]
      .trim()
      .toUpperCase();

    const newKid: Kid = {
      slug: `${slugify(name)}-${Date.now()}`,
      name,
      ageLabel: "—",
      birthDate: child.birthDate.trim(),
      room: child.room,
      enrolledSince: "hoy",
      ...(allergy ? { allergyChip: allergy, allergyNote: child.allergies.trim() } : {}),
      avatarInitial: name.charAt(0).toUpperCase(),
      avatarTone: "sky",
      parents: [],
    };

    setKids((currentKids) => [...currentKids, newKid]);
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <MobileTopBar />
        <MobileTabBar />
        <main className="md:h-screen md:overflow-y-auto">
          <div className="mx-auto w-full max-w-[880px] px-[16px] pt-[74px] pb-[140px] md:px-[40px] md:pt-[34px] md:pb-[80px]">
            <div className="mb-[22px] flex items-end justify-between gap-[16px]">
              <div>
                <div className="mb-[4px] text-[12.5px] font-extrabold tracking-[.8px] text-accent-deep">
                  GESTIÓN
                </div>
                <h1 className="font-display text-[30px] font-semibold text-ink">
                  Niños
                </h1>
              </div>
              <button
                ref={addChildButtonRef}
                type="button"
                onClick={() => setIsAddChildModalOpen(true)}
                className="flex items-center gap-[8px] rounded-[14px] bg-linear-to-b from-accent-light to-accent-strong px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
              >
                <PlusIcon size={17} />
                Agregar niño
              </button>
            </div>
            <KidsBrowser kids={kids} />
          </div>
        </main>
      </div>
      <AddChildModal
        isOpen={isAddChildModalOpen}
        onClose={() => setIsAddChildModalOpen(false)}
        onSave={handleSave}
        returnFocusRef={addChildButtonRef}
      />
    </div>
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
