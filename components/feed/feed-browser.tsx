"use client";

import { useRef, useState } from "react";
import { ComposerPrompt } from "@/components/feed/composer-prompt";
import { CreatePublicationModal } from "@/components/feed/create-publication-modal";
import { MobileTabBar } from "@/components/feed/mobile-tabbar";
import { MobileTopBar } from "@/components/feed/mobile-topbar";
import { PageHeader } from "@/components/feed/page-header";
import { PostCard } from "@/components/feed/post-card";
import { SectionLabel } from "@/components/feed/section-label";
import { Sidebar } from "@/components/feed/sidebar";
import { FEED_POSTS, type FeedPost } from "@/lib/feed";

export function FeedBrowser() {
  const [posts, setPosts] = useState<FeedPost[]>(FEED_POSTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);

  const openModal = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) event.preventDefault();
    triggerRef.current = event?.currentTarget ?? null;
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar onCreatePublication={openModal} />
      <div className="min-w-0 flex-1">
        <MobileTopBar />
        <MobileTabBar onCreatePublication={openModal} />
        <main className="md:h-screen md:overflow-y-auto">
          <div className="mx-auto w-full max-w-[760px] px-[16px] pt-[74px] pb-[140px] md:px-[40px] md:pt-[34px] md:pb-[80px]">
            <PageHeader eyebrow="GUARDERÍA · SALA SOLES" title="Buenas, Caro" subtitle="12 niños · martes 17 jun" />
            <ComposerPrompt onCreatePublication={openModal} />
            <SectionLabel label="PUBLICADO HOY" />
            <div className="flex flex-col gap-[16px]">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div>
          </div>
        </main>
      </div>
      {isModalOpen && <CreatePublicationModal onClose={() => setIsModalOpen(false)} onPublish={(post) => setPosts((current) => [post, ...current])} triggerRef={triggerRef} />}
    </div>
  );
}
