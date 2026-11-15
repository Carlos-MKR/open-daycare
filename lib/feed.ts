import type { ComponentType } from "react";
import {
  BellIcon,
  ChildrenIcon,
  HomeIcon,
  UserIcon,
  type IconProps,
} from "@/components/ui/icons";

// Estilos de variantes visuales del feed. Los datos vienen de la DB
// (lib/data/posts.ts); el mock FEED_POSTS se retiró con SPEC 14.
export type PostVariant = "achievement" | "activity" | "announcement";

export type NavItemId = "feed" | "children" | "announcements" | "account";

export type NavItem = {
  id: NavItemId;
  href: string;
  label: string;
  icon: ComponentType<IconProps>;
};

// Compartido por la sidebar (desktop) y la tab bar (móvil). SPEC 02.
// La lógica de estado activo vive en components/feed/nav-styles.ts.
export const NAV_ITEMS: NavItem[] = [
  { id: "feed", label: "Feed", href: "/", icon: HomeIcon },
  { id: "children", label: "Niños", href: "/kids", icon: ChildrenIcon },
  { id: "announcements", label: "Avisos", href: "#", icon: BellIcon },
  { id: "account", label: "Mi cuenta", href: "#", icon: UserIcon },
];

// Contenido en español por diseño (texto visible); el código se nombra en inglés.
type PostVariantStyles = {
  chipBg: string;
  chipDot: string;
  chipText: string;
  avatarBg: string;
  avatarText: string;
  iconAvatar?: boolean;
};

export const POST_VARIANT_STYLES: Record<PostVariant, PostVariantStyles> = {
  achievement: {
    chipBg: "bg-success-soft",
    chipDot: "bg-success",
    chipText: "text-success",
    avatarBg: "bg-avatar-sky",
    avatarText: "text-avatar-sky-text",
  },
  activity: {
    chipBg: "bg-activity-soft",
    chipDot: "bg-activity",
    chipText: "text-activity",
    avatarBg: "bg-avatar-sky",
    avatarText: "text-avatar-sky-text",
  },
  announcement: {
    chipBg: "bg-announcement-soft",
    chipDot: "bg-announcement",
    chipText: "text-announcement",
    avatarBg: "bg-announcement-soft",
    avatarText: "text-announcement",
    iconAvatar: true,
  },
};
