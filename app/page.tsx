import { FeedBrowser } from "@/components/feed/feed-browser";
import { getDisplayName, requireUser } from "@/lib/auth/require-user";

// La página lee la sesión en el request, no puede prerendererse (SPEC 10).
export const instant = false;

export default async function FeedPage() {
  const user = await requireUser();

  return <FeedBrowser displayName={getDisplayName(user)} />;
}
