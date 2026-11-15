import { FeedBrowser } from "@/components/feed/feed-browser";
import { getDisplayName } from "@/lib/auth/require-user";
import { requireRole, STAFF_ROLES } from "@/lib/auth/require-role";

// La página lee la sesión en el request, no puede prerendererse (SPEC 10).
export const instant = false;

export default async function FeedPage() {
  const user = await requireRole(STAFF_ROLES);

  return <FeedBrowser displayName={getDisplayName(user)} />;
}
