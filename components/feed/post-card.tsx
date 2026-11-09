import { Avatar } from "@/components/ui/avatar";
import { BadgeChip } from "@/components/ui/badge-chip";
import { MegaphoneIcon } from "@/components/ui/icons";
import { PhotoPlaceholder } from "@/components/feed/photo-placeholder";
import { PostActions } from "@/components/feed/post-actions";
import { POST_VARIANT_STYLES, type FeedPost } from "@/lib/feed";

export function PostCard({ post }: { post: FeedPost }) {
  const styles = POST_VARIANT_STYLES[post.variant];

  return (
    <article className="rounded-[20px] border border-line bg-surface px-[22px] py-[20px] shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-[14px] flex items-center gap-[12px]">
        <Avatar size="lg" bgColor={styles.avatarBg} textColor={styles.avatarText}>
          {styles.iconAvatar ? <MegaphoneIcon size={20} /> : post.title.charAt(0)}
        </Avatar>
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.title}
          </div>
          <div className="text-[12.5px] text-muted">
            {post.time} · {post.authorLabel}
          </div>
        </div>
        <BadgeChip
          bgColor={styles.chipBg}
          dotColor={styles.chipDot}
          textColor={styles.chipText}
        >
          {styles.badgeLabel}
        </BadgeChip>
      </div>

      <div className="mb-[10px] text-[12.5px] text-muted">Para: {post.audience}</div>
      <p className="text-[15.5px] leading-[1.55] text-ink-body">{post.body}</p>

      {post.photoPlaceholder && (
        <PhotoPlaceholder caption={post.photoPlaceholder} />
      )}

      <PostActions likes={post.likes} comments={post.comments} />
    </article>
  );
}
