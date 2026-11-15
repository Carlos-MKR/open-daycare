import { FeedBrowser } from "@/components/feed/feed-browser";
import { getDisplayName } from "@/lib/auth/require-user";
import { requireRole, STAFF_ROLES } from "@/lib/auth/require-role";
import { fetchDaycareId } from "@/lib/data/children";
import { fetchPostsForDaycare } from "@/lib/data/posts";
import { createClient } from "@/utils/supabase/server";

// La página lee la sesión y la DB en el request, no puede prerendererse (SPEC 10/14).
export const instant = false;

export default async function FeedPage() {
  const user = await requireRole(STAFF_ROLES);
  const supabase = await createClient();
  const daycareId = await fetchDaycareId(supabase);

  const posts = daycareId ? await fetchPostsForDaycare(supabase, daycareId) : [];

  return <FeedBrowser displayName={getDisplayName(user)} posts={posts} />;
}
