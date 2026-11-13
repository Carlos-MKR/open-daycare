"use client";

import { useRef, useState } from "react";
import { LinkParentModal, type LinkParentFormState } from "@/components/kids/link-parent-modal";
import { ParentsPanel } from "@/components/kids/parents-panel";
import { SunIcon } from "@/components/ui/icons";
import { type Kid, type LinkedParent } from "@/lib/kids";

type KidProfileProps = {
  kid: Kid;
};

export function KidProfile({ kid }: KidProfileProps) {
  // La vinculación real de padres llega en otra spec; el modal sigue en memoria.
  const [parents, setParents] = useState<LinkedParent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function handleSave(form: LinkParentFormState) {
    const newParent: LinkedParent = {
      name: form.name.trim(),
      role: `${form.relationship} · invitación enviada`,
      status: "pending",
      initial: form.name.trim().charAt(0).toUpperCase(),
      tone: "sky",
    };

    setParents((currentParents) => [...currentParents, newParent]);
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
