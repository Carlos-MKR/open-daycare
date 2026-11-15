"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { fetchComposerAudience } from "@/actions/posts/composer-audience";
import {
  CreatePublicationModal,
  type ComposerAudienceState,
} from "@/components/feed/create-publication-modal";

type ComposerContext = {
  open: (trigger: HTMLElement) => void;
};

const PublicationComposerContext = createContext<ComposerContext | null>(null);

// Provee el modal de publicación a todas las pantallas con sidebar.
// Los destinatarios (niños/salas reales) se cargan al abrir, vía Server
// Action, porque el provider vive en el layout raíz y no tiene sesión ahí.
export function PublicationComposerProvider({ children }: { children: React.ReactNode }) {
  const [audience, setAudience] = useState<ComposerAudienceState>({ status: "loading" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const loadAudience = useCallback(async () => {
    setAudience({ status: "loading" });

    const result = await fetchComposerAudience();

    setAudience(
      result.ok
        ? { status: "ready", kids: result.kids, rooms: result.rooms }
        : { status: "error", error: result.error },
    );
  }, []);

  const open = useCallback(
    (trigger: HTMLElement) => {
      triggerRef.current = trigger;
      setIsModalOpen(true);
      void loadAudience();
    },
    [loadAudience],
  );

  return (
    <PublicationComposerContext.Provider value={{ open }}>
      {children}
      {isModalOpen && (
        <CreatePublicationModal
          audience={audience}
          onRetryAudience={loadAudience}
          onClose={() => setIsModalOpen(false)}
          triggerRef={triggerRef}
        />
      )}
    </PublicationComposerContext.Provider>
  );
}

export function usePublicationComposer() {
  const context = useContext(PublicationComposerContext);
  if (!context) {
    throw new Error("usePublicationComposer must be used inside PublicationComposerProvider");
  }
  return context;
}
