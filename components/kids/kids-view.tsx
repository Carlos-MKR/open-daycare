"use client";

import { useRef, useState, useTransition } from "react";
import { createChild } from "@/actions/kids/create-child";
import type { CreateChildInput } from "@/actions/kids/create-child";
import { AddChildModal, type AddChildFormState } from "@/components/kids/add-child-modal";
import { MobileTabBar } from "@/components/feed/mobile-tabbar";
import { MobileTopBar } from "@/components/feed/mobile-topbar";
import { Sidebar } from "@/components/feed/sidebar";
import { KidsBrowser } from "@/components/kids/kids-browser";
import { PlusIcon } from "@/components/ui/icons";
import type { Kid, Room } from "@/lib/kids";

type KidsViewProps = {
  displayName: string;
  rooms: Room[];
  kids: Kid[];
};

// Listado real de niños + alta vía Server Action (SPEC 12). Lo renderiza
// app/kids/page.tsx tras requireUser(); los datos vienen de la DB y el refresco
// posterior al alta llega por revalidatePath("/kids").
export function KidsView({ displayName, rooms, kids }: KidsViewProps) {
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();
  const addChildButtonRef = useRef<HTMLButtonElement>(null);

  function handleSave(form: AddChildFormState): Promise<boolean> {
    setServerError(null);

    const input: CreateChildInput = {
      fullName: form.fullName,
      birthDate: form.birthDate,
      roomId: form.room,
      allergies: form.allergies,
      medicalNotes: form.medicalNotes,
    };

    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const result = await createChild(input);
          if (result.ok) {
            setIsAddChildModalOpen(false);
          } else {
            setServerError(result.error);
          }
          resolve(result.ok);
        } catch {
          setServerError("No pudimos conectar con el servidor. Intentá de nuevo.");
          resolve(false);
        }
      });
    });
  }

  function handleCloseModal() {
    setIsAddChildModalOpen(false);
    setServerError(null);
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar displayName={displayName} />
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
        rooms={rooms}
        saving={isSaving}
        serverError={serverError}
        onClose={handleCloseModal}
        onSave={handleSave}
        returnFocusRef={addChildButtonRef}
      />
    </div>
  );
}
