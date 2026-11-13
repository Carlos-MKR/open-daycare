import { KidsView } from "@/components/kids/kids-view";
import { getDisplayName, requireUser } from "@/lib/auth/require-user";

// La página lee la sesión en el request, no puede prerendererse (SPEC 10).
export const instant = false;

// Listado de niños (SPEC 03) detrás del guard de autenticación (SPEC 10).
export default async function KidsPage() {
  const user = await requireUser();

  return <KidsView displayName={getDisplayName(user)} />;
}
