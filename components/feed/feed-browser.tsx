"use client";

import { ComposerPrompt } from "@/components/feed/composer-prompt";
import { MobileTabBar } from "@/components/feed/mobile-tabbar";
import { MobileTopBar } from "@/components/feed/mobile-topbar";
import { PageHeader } from "@/components/feed/page-header";
import { PostCard } from "@/components/feed/post-card";
import { SectionLabel } from "@/components/feed/section-label";
import { Sidebar } from "@/components/feed/sidebar";
import type { PostView } from "@/lib/posts";

type FeedBrowserProps = {
  displayName: string;
  posts: PostView[];
};

// Feed del staff con publicaciones reales del daycare (SPEC 14).
export function FeedBrowser({ displayName, posts }: FeedBrowserProps) {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar displayName={displayName} />
      <div className="min-w-0 flex-1">
        <MobileTopBar />
        <MobileTabBar />
        <main className="md:h-screen md:overflow-y-auto">
          <div className="mx-auto w-full max-w-[760px] px-[16px] pt-[74px] pb-[140px] md:px-[40px] md:pt-[34px] md:pb-[80px]">
            <PageHeader eyebrow="GUARDERÍA · SALA SOLES" title="Buenas, Caro" subtitle="12 niños · martes 17 jun" />
            <ComposerPrompt />
            {posts.length === 0 ? (
              <div className="mt-[26px] rounded-[16px] border-[1.5px] border-dashed border-dashed-stroke bg-surface px-[18px] py-[22px] text-center text-[14.5px] leading-[1.5] text-muted-strong">
                Todavía no hay publicaciones. Compartí el primer momento del día.
              </div>
            ) : (
              <>
                <SectionLabel label="PUBLICACIONES" />
                <div className="flex flex-col gap-[16px]">
                  {posts.map((post) => <PostCard key={post.id} post={post} />)}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
