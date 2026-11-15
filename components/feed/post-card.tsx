import { Avatar } from "@/components/ui/avatar";
import { BadgeChip } from "@/components/ui/badge-chip";
import { MegaphoneIcon } from "@/components/ui/icons";
import { POST_VARIANT_STYLES } from "@/lib/feed";
import {
  POST_TYPE_LABELS,
  audienceLabel,
  postTitle,
  publishedLabel,
  type PostView,
} from "@/lib/posts";

// Tarjeta con datos reales (SPEC 14): el badge muestra la etiqueta del tipo
// real; los estilos del chip/avatar vienen del variante de diseño (SPEC 01).
// Likes, comentarios y "Editar" quedan ocultos hasta su spec (reacciones y
// edición fuera de alcance).
export function PostCard({ post }: { post: PostView }) {
  const styles = POST_VARIANT_STYLES[post.variant];
  const title = postTitle(post);

  return (
    <article className="rounded-[20px] border border-line bg-surface px-[22px] py-[20px] shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-[14px] flex items-center gap-[12px]">
        <Avatar size="lg" bgColor={styles.avatarBg} textColor={styles.avatarText}>
          {styles.iconAvatar ? <MegaphoneIcon size={20} /> : postTitle(post).charAt(0).toUpperCase()}
        </Avatar>
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {title}
          </div>
          <div className="text-[12.5px] text-muted">
            {publishedLabel(post.publishedAt)} · publicado por {post.authorName}
          </div>
        </div>
        <BadgeChip
          bgColor={styles.chipBg}
          dotColor={styles.chipDot}
          textColor={styles.chipText}
        >
          {POST_TYPE_LABELS[post.type].toUpperCase()}
        </BadgeChip>
      </div>

      <div className="mb-[10px] text-[12.5px] text-muted">Para: {audienceLabel(post)}</div>
      <p className="text-[15.5px] leading-[1.55] text-ink-body">{post.body}</p>
    </article>
  );
}
