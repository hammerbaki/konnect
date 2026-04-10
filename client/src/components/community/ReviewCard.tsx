/**
 * ReviewCard — displays a single community review
 * - Inline expand/collapse ("전체보기") with animation
 * - No avatar circle, no views counter
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Heart, Trash2, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAuthHeaders } from "@/lib/queryClient";
import type { CommunityReview } from "@shared/schema";
import { useAuth } from "@/lib/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const TRUNCATE_AT = 180;

interface ReviewCardProps {
  review: CommunityReview;
  isLiked: boolean;
  queryKey: unknown[];
}

function StarRow({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={10} className={cn(value >= n ? "fill-gold text-gold" : "text-border")} strokeWidth={1.5} />
      ))}
    </span>
  );
}

export function ReviewCard({ review, isLiked, queryKey }: ReviewCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/community/reviews/${review.id}/like`, {
        method: "POST",
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("실패");
      return res.json();
    },
    onSuccess: (data: { liked: boolean; likes: number }) => {
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        const likedIds: number[] = data.liked
          ? [...(old.likedIds ?? []), review.id]
          : (old.likedIds ?? []).filter((id: number) => id !== review.id);
        const reviews = (old.reviews ?? []).map((r: CommunityReview) =>
          r.id === review.id ? { ...r, likes: data.likes } : r
        );
        return { ...old, reviews, likedIds };
      });
    },
    onError: () => toast.error("잠시 후 다시 시도해 주세요."),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/community/reviews/${review.id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("삭제 실패");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("리뷰가 삭제되었습니다.");
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const handleDelete = () => {
    if (!confirm("이 리뷰를 삭제할까요?")) return;
    deleteMutation.mutate();
  };

  const isOwner = user?.id === review.userId;
  const isLong = review.content.length > TRUNCATE_AT;

  const timeAgo = review.createdAt
    ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: ko })
    : "";

  return (
    <article className="py-5 border-b border-border last:border-0 group">
      {/* Row 1: stars + grade change + delete */}
      <div className="flex items-center gap-2 mb-1.5">
        <StarRow value={review.overallRating} />
        <span className="text-xs font-bold">{review.overallRating}.0</span>
        {review.gradeLevel && (
          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">{review.gradeLevel}</span>
        )}
        {review.gradeBefore && review.gradeAfter && (
          <span className="text-[10px] flex items-center gap-1">
            <span className="text-muted-foreground">{review.gradeBefore}</span>
            <ArrowUp size={9} className="text-green-500" />
            <span className="text-green-600 font-semibold">{review.gradeAfter}</span>
          </span>
        )}
        {isOwner && (
          <button onClick={handleDelete} disabled={deleteMutation.isPending}
            className="ml-auto text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Row 2: target + tags */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span className="text-xs font-semibold text-foreground">{review.targetName}</span>
        {review.instructor && <span className="text-[10px] text-muted-foreground">· {review.instructor}</span>}
        {review.platform && <span className="ink-tag text-[10px]">{review.platform}</span>}
        {review.publisher && <span className="text-[10px] text-muted-foreground">· {review.publisher}</span>}
        {review.region && <span className="text-[10px] text-muted-foreground">{review.region} {review.district}</span>}
        {review.subject && review.subject !== "기타" && <span className="ink-tag text-[10px]">{review.subject}</span>}
      </div>

      {/* Row 3: title */}
      <h3 className="font-semibold text-sm leading-snug mb-1.5">{review.title}</h3>

      {/* Row 4: content with inline expand */}
      <div className="text-xs text-muted-foreground leading-relaxed mb-2">
        <span
          className={cn(
            "transition-all duration-300",
            !expanded && isLong ? "line-clamp-none" : ""
          )}
        >
          {!expanded && isLong ? (
            <>
              {review.content.slice(0, TRUNCATE_AT)}
              {"... "}
              <button
                onClick={() => setExpanded(true)}
                className="text-dream font-semibold hover:underline focus:outline-none"
              >
                전체보기
              </button>
            </>
          ) : (
            <>
              {review.content}
              {isLong && (
                <> {" "}
                  <button
                    onClick={() => setExpanded(false)}
                    className="text-dream font-semibold hover:underline focus:outline-none"
                  >
                    접기
                  </button>
                </>
              )}
            </>
          )}
        </span>
      </div>

      {/* Row 5: pros/cons tags */}
      {(review.prosTagIds?.length || review.consTagIds?.length) ? (
        <div className="flex flex-wrap gap-1 mb-2">
          {(review.prosTagIds ?? []).slice(0, 3).map((tag: string) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
              👍 {tag}
            </span>
          ))}
          {(review.consTagIds ?? []).slice(0, 2).map((tag: string) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
              👎 {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* Row 6: sub ratings */}
      {(review.ratingContent || review.ratingValue || review.ratingManage) ? (
        <div className="flex items-center gap-3 mb-2">
          {review.ratingContent ? <span className="text-[10px] text-muted-foreground flex items-center gap-1">내용 <StarRow value={review.ratingContent} /></span> : null}
          {review.ratingValue ? <span className="text-[10px] text-muted-foreground flex items-center gap-1">가성비 <StarRow value={review.ratingValue} /></span> : null}
          {review.ratingManage ? <span className="text-[10px] text-muted-foreground flex items-center gap-1">시설 <StarRow value={review.ratingManage} /></span> : null}
        </div>
      ) : null}

      {/* Row 7: footer meta + like */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>{timeAgo}</span>
        {review.studyDuration && (
          <span className="bg-secondary px-1.5 py-0.5 rounded-full">{review.studyDuration}</span>
        )}
        <button
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          data-testid={`button-like-review-${review.id}`}
          className={cn("flex items-center gap-1 transition-colors ml-auto", isLiked ? "text-red-500" : "hover:text-red-400")}
        >
          <Heart size={12} className={isLiked ? "fill-red-500" : ""} />
          <span>{review.likes ?? 0}</span>
        </button>
      </div>
    </article>
  );
}
