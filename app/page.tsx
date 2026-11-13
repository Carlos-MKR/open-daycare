import { FeedBrowser } from "@/components/feed/feed-browser";
import { requireUser } from "@/lib/auth/require-user";

// La página lee la sesión en el request, no puede prerendererse (SPEC 10).
export const instant = false;

export default async function FeedPage() {
  await requireUser();

  return <FeedBrowser />;
}
