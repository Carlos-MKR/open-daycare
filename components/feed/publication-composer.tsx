"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreatePublicationModal } from "@/components/feed/create-publication-modal";
import type { FeedPost } from "@/lib/feed";

type ComposerContext = {
  newPosts: FeedPost[];
  open: (trigger: HTMLElement) => void;
};

const PublicationComposerContext = createContext<ComposerContext | null>(null);

// Provee el modal de publicación a todas las pantallas con sidebar.
export function PublicationComposerProvider({ children }: { children: React.ReactNode }) {
  const [newPosts, setNewPosts] = useState<FeedPost[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const router = useRouter();

  const open = useCallback((trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setIsModalOpen(true);
  }, []);

  const addPost = useCallback(
    (post: FeedPost) => {
      setNewPosts((current) => [post, ...current]);
      router.push("/");
    },
    [router],
  );

  return (
    <PublicationComposerContext.Provider value={{ newPosts, open }}>
      {children}
      {isModalOpen && (
        <CreatePublicationModal
          onClose={() => setIsModalOpen(false)}
          onPublish={addPost}
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
