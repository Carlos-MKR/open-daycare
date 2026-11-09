import { ComposerPrompt } from "@/components/feed/composer-prompt";
import { PageHeader } from "@/components/feed/page-header";
import { SectionLabel } from "@/components/feed/section-label";
import { Sidebar } from "@/components/feed/sidebar";

export default function FeedPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-[40px] pt-[34px] pb-[80px]">
          <PageHeader
            eyebrow="GUARDERÍA · SALA SOLES"
            title="Buenas, Caro"
            subtitle="12 niños · martes 17 jun"
          />
          <ComposerPrompt />
          <SectionLabel label="PUBLICADO HOY" />
        </div>
      </main>
    </div>
  );
}
