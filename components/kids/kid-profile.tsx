"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { linkParent } from "@/actions/kids/link-parent";
import {
  LinkParentModal,
  type LinkParentFormState,
  type LinkParentSaveResult,
} from "@/components/kids/link-parent-modal";
import { ParentsPanel } from "@/components/kids/parents-panel";
import { SunIcon } from "@/components/ui/icons";
import type { Kid, LinkedParent } from "@/lib/kids";

type KidProfileProps = {
  kid: Kid;
  // Vinculados reales (invitaciones + parent_children) desde el Server Component.
  parents: LinkedParent[];
};

export function KidProfile({ kid, parents }: KidProfileProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // SPEC 13: el modal envía invitaciones reales; la lista se refresca desde la DB.
  async function handleSave(form: LinkParentFormState): Promise<LinkParentSaveResult> {
    const result = await linkParent({
      childId: kid.id,
      parentName: form.name,
      email: form.email,
      relationshipLabel: form.relationship,
    });

    if (result.ok) {
      router.refresh();
    }

    return result.ok ? { ok: true } : { ok: false, error: result.error };
  }

  return (
    <div className="flex w-full flex-none flex-col gap-[14px] md:w-[300px]">
      <a
        href="#"
        className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-ink p-[13px] text-[15px] font-extrabold text-white"
      >
        <SunIcon size={18} />
        Resumen del día
      </a>
      <ParentsPanel
        parents={parents}
        onLinkParent={() => setIsModalOpen(true)}
        triggerRef={triggerRef}
      />
      <LinkParentModal
        isOpen={isModalOpen}
        kidName={kid.name}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        returnFocusRef={triggerRef}
      />
    </div>
  );
}
