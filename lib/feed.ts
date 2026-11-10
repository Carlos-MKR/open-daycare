import type { ComponentType } from "react";
import {
  BellIcon,
  ChildrenIcon,
  HomeIcon,
  UserIcon,
  type IconProps,
} from "@/components/ui/icons";

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
export type FeedPost = {
  id: string;
  title: string;
  time: string;
  authorLabel: string;
  variant: PostVariant;
  audience: string;
  body: string;
  photoPlaceholder?: string;
  likes: number;
  comments: number;
};

type PostVariantStyles = {
  badgeLabel: string;
  chipBg: string;
  chipDot: string;
  chipText: string;
  avatarBg: string;
  avatarText: string;
  iconAvatar?: boolean;
};

export const POST_VARIANT_STYLES: Record<PostVariant, PostVariantStyles> = {
  achievement: {
    badgeLabel: "LOGRO",
    chipBg: "bg-success-soft",
    chipDot: "bg-success",
    chipText: "text-success",
    avatarBg: "bg-avatar-sky",
    avatarText: "text-avatar-sky-text",
  },
  activity: {
    badgeLabel: "ACTIVIDAD",
    chipBg: "bg-activity-soft",
    chipDot: "bg-activity",
    chipText: "text-activity",
    avatarBg: "bg-avatar-sky",
    avatarText: "text-avatar-sky-text",
  },
  announcement: {
    badgeLabel: "ANUNCIO",
    chipBg: "bg-announcement-soft",
    chipDot: "bg-announcement",
    chipText: "text-announcement",
    avatarBg: "bg-announcement-soft",
    avatarText: "text-announcement",
    iconAvatar: true,
  },
};

export const FEED_POSTS: FeedPost[] = [
  {
    id: "achievement-1",
    title: "Mateo",
    time: "14:20",
    authorLabel: "publicado por vos",
    variant: "achievement",
    audience: "familia de Mateo",
    body: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "activity-1",
    title: "Mateo",
    time: "09:40",
    authorLabel: "publicado por vos",
    variant: "activity",
    audience: "familia de Mateo",
    body: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photoPlaceholder: "Foto · pintando con témperas",
    likes: 5,
    comments: 2,
  },
  {
    id: "announcement-1",
    title: "Anuncio general",
    time: "07:50",
    authorLabel: "publicado por vos",
    variant: "announcement",
    audience: "toda la sala",
    body: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];
