// Enlaces inertes (comentarios y editar) hasta que existan sus rutas (SPEC 01).
import { CommentIcon, HeartIcon } from "@/components/ui/icons";

type PostActionsProps = {
  likes: number;
  comments: number;
};

export function PostActions({ likes, comments }: PostActionsProps) {
  return (
    <div className="mt-[16px] flex items-center gap-[18px] border-t border-line-faint pt-[14px]">
      <span className="flex items-center gap-[7px] text-[14px] font-bold text-liked">
        <HeartIcon filled size={19} />
        {likes}
      </span>
      <a
        href="#"
        className="flex items-center gap-[7px] text-[14px] font-bold text-muted-strong"
      >
        <CommentIcon size={18} />
        {comments}
      </a>
      <span className="flex-1" />
      <a href="#" className="text-[14px] font-extrabold text-edit-link">
        Editar
      </a>
    </div>
  );
}
