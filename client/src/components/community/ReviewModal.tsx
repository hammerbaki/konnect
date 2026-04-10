/**
 * Structured review writing modal for 인강 / 문제집 / 학원
 * Industry-best practice: guided form with preset tags + dimension ratings
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, X, PenLine, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/queryClient";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ReviewType = "lecture" | "workbook" | "academy";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  type: ReviewType;
  defaultSubject?: string;
  /** Pre-fill target name (e.g., when user clicks on a specific card) */
  defaultTarget?: { name: string; instructor?: string; platform?: string; publisher?: string; region?: string; district?: string };
}

// ── Preset tag definitions per type ────────────────────────────────
const PROS_TAGS: Record<ReviewType, string[]> = {
  lecture: ["설명이 명확해요", "개념이 탄탄해요", "문제풀이가 뛰어나요", "강의 속도가 적당해요", "핵심만 짚어줘요", "동기부여가 돼요", "실전 적용이 잘 돼요"],
  workbook: ["설명이 친절해요", "문제 퀄리티가 높아요", "난이도가 적절해요", "다양한 유형이 있어요", "가격 대비 만족해요", "반복학습에 좋아요", "기출 분석이 잘 돼요"],
  academy: ["수업이 체계적이에요", "관리가 잘 돼요", "선생님이 친절해요", "시설이 좋아요", "자습실이 편해요", "성적이 올랐어요", "소수정예예요"],
};
const CONS_TAGS: Record<ReviewType, string[]> = {
  lecture: ["설명이 너무 빨라요", "내용이 너무 어려워요", "너무 기초적이에요", "강의가 너무 길어요", "가격이 비싸요", "판서가 지저분해요"],
  workbook: ["설명이 부족해요", "오탈자가 많아요", "난이도 편차가 커요", "가격이 비싸요", "문제 수가 적어요", "해설이 불친절해요"],
  academy: ["관리가 부족해요", "선생님이 자주 바뀌어요", "시설이 낡았어요", "가격이 비싸요", "이동이 불편해요", "수업이 지루해요"],
};
const GRADE_LEVELS = ["중학생", "고1", "고2", "고3", "N수생", "기타"];
const GRADES = ["1등급", "2등급", "3등급", "4등급", "5등급", "6등급", "미응시"];
const DURATIONS: Record<ReviewType, string[]> = {
  lecture: ["1개월 미만", "1~3개월", "3~6개월", "6개월~1년", "1년 이상"],
  workbook: ["1회독", "2회독", "3회독 이상", "일부만 풀었어요"],
  academy: ["1개월 미만", "1~3개월", "3~6개월", "6개월~1년", "1년 이상"],
};

// ── Star rating component ──────────────────────────────────────────
function StarRating({ value, onChange, size = 28 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star size={size}
            className={cn("transition-colors", (hovered || value) >= n ? "fill-gold text-gold" : "text-border")}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

// ── Tiny inline star (for dimension ratings) ───────────────────────
function DimRating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground w-28">{label}</span>
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} onMouseEnter={() => setHovered(n)}>
            <Star size={14} className={cn((hovered || value) >= n ? "fill-gold text-gold" : "text-border")} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </div>
  );
}

const LABEL: Record<ReviewType, { name: string; nameLabel: string; extra: string[]; dim1: string; dim2: string; dim3?: string }> = {
  lecture: { name: "인강", nameLabel: "강의명", extra: ["강사명", "플랫폼"], dim1: "내용 충실도", dim2: "가성비" },
  workbook: { name: "문제집", nameLabel: "문제집명", extra: ["저자/출판사"], dim1: "내용 퀄리티", dim2: "가성비" },
  academy: { name: "학원", nameLabel: "학원명", extra: ["지역 (시/도)", "구/군"], dim1: "수업 품질", dim2: "가성비", dim3: "시설·관리" },
};

const OVERALL_LABELS = ["", "별로예요", "아쉬워요", "보통이에요", "좋아요", "최고예요!"];

export function ReviewModal({ open, onClose, type, defaultSubject = "전체", defaultTarget }: ReviewModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lbl = LABEL[type];

  const [overallRating, setOverallRating] = useState(0);
  const [ratingContent, setRatingContent] = useState(0);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingManage, setRatingManage] = useState(0);
  const [targetName, setTargetName] = useState(defaultTarget?.name ?? "");
  const [extra1, setExtra1] = useState(defaultTarget?.instructor ?? defaultTarget?.publisher ?? defaultTarget?.region ?? "");
  const [extra2, setExtra2] = useState(defaultTarget?.platform ?? defaultTarget?.district ?? "");
  const [subject, setSubject] = useState(defaultSubject === "전체" ? "" : defaultSubject);
  const [gradeLevel, setGradeLevel] = useState("");
  const [gradeBefore, setGradeBefore] = useState("");
  const [gradeAfter, setGradeAfter] = useState("");
  const [studyDuration, setStudyDuration] = useState("");
  const [prosTags, setProsTags] = useState<string[]>([]);
  const [consTags, setConsTags] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: object) => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/community/reviews", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-reviews", type] });
      toast.success("리뷰가 등록되었습니다. 감사합니다!");
      onClose();
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = () => {
    setOverallRating(0); setRatingContent(0); setRatingValue(0); setRatingManage(0);
    setTargetName(""); setExtra1(""); setExtra2(""); setSubject("");
    setGradeLevel(""); setGradeBefore(""); setGradeAfter(""); setStudyDuration("");
    setProsTags([]); setConsTags([]); setTitle(""); setContent("");
  };

  const toggleTag = (tag: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag]);
  };

  const handleSubmit = () => {
    if (!overallRating) return toast.error("전체 별점을 선택해주세요.");
    if (!targetName.trim()) return toast.error(`${lbl.nameLabel}을 입력해주세요.`);
    if (!title.trim()) return toast.error("리뷰 제목을 입력해주세요.");
    if (content.trim().length < 20) return toast.error("리뷰 내용을 20자 이상 작성해주세요.");

    const body: Record<string, unknown> = {
      type,
      targetName: targetName.trim(),
      subject: subject || "기타",
      overallRating,
      ratingContent: ratingContent || null,
      ratingValue: ratingValue || null,
      ratingManage: ratingManage || null,
      title: title.trim(),
      content: content.trim(),
      prosTagIds: prosTags,
      consTagIds: consTags,
      gradeLevel: gradeLevel || null,
      gradeBefore: gradeBefore || null,
      gradeAfter: gradeAfter || null,
      studyDuration: studyDuration || null,
    };

    if (type === "lecture") {
      body.instructor = extra1 || null;
      body.platform = extra2 || null;
    } else if (type === "workbook") {
      body.publisher = extra1 || null;
    } else {
      body.region = extra1 || null;
      body.district = extra2 || null;
    }

    mutation.mutate(body);
  };

  const subjects = ["국어", "수학", "영어", "한국사", "사탐", "과탐", "논술", "기타"];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div>
            <DialogTitle className="editorial-heading text-lg">{lbl.name} 후기 남기기</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">솔직한 경험을 공유해 주세요</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-secondary text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* ── Section 1: Target info ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">1 · {lbl.name} 정보</h3>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">{lbl.nameLabel} <span className="text-destructive">*</span></Label>
              <Input value={targetName} onChange={(e) => setTargetName(e.target.value)}
                placeholder={`예: ${type === "lecture" ? "현우진 뉴런 수학1" : type === "workbook" ? "수학의 정석 (수학1+2)" : "시대인재 대치캠퍼스"}`}
                className="h-10 rounded-xl border-border/60 focus-visible:ring-dream" />
            </div>

            <div className={cn("grid gap-3", lbl.extra.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
              {lbl.extra.map((label, i) => (
                <div key={label}>
                  <Label className="text-xs font-semibold mb-1 block text-muted-foreground">{label}</Label>
                  <Input value={i === 0 ? extra1 : extra2} onChange={(e) => i === 0 ? setExtra1(e.target.value) : setExtra2(e.target.value)}
                    placeholder={label}
                    className="h-9 rounded-xl border-border/60 focus-visible:ring-dream text-sm" />
                </div>
              ))}
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground">과목</Label>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map(s => (
                  <button key={s} type="button" onClick={() => setSubject(s)}
                    className={cn("px-2.5 py-1 text-xs rounded-full border transition-all",
                      subject === s ? "border-dream bg-dream/10 text-dream font-semibold" : "border-border text-muted-foreground hover:border-dream/50"
                    )}>{s}</button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Section 2: Ratings ── */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2 · 평점</h3>
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground mb-2">전체 만족도 <span className="text-destructive">*</span></p>
              <div className="flex justify-center mb-1">
                <StarRating value={overallRating} onChange={setOverallRating} size={36} />
              </div>
              {overallRating > 0 && (
                <p className="text-sm font-semibold text-foreground">{OVERALL_LABELS[overallRating]}</p>
              )}
            </div>

            <div className="bg-secondary/40 rounded-xl px-4 py-3 space-y-2.5">
              <DimRating label={lbl.dim1} value={ratingContent} onChange={setRatingContent} />
              <DimRating label={lbl.dim2} value={ratingValue} onChange={setRatingValue} />
              {lbl.dim3 && <DimRating label={lbl.dim3} value={ratingManage} onChange={setRatingManage} />}
            </div>
          </section>

          {/* ── Section 3: Tags ── */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">3 · 장단점 태그</h3>
            <div>
              <p className="text-xs text-muted-foreground mb-2">좋았던 점 (복수 선택 가능)</p>
              <div className="flex flex-wrap gap-1.5">
                {PROS_TAGS[type].map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag, prosTags, setProsTags)}
                    className={cn("px-2.5 py-1 text-xs rounded-full border transition-all",
                      prosTags.includes(tag) ? "border-green-500 bg-green-50 text-green-700 font-semibold" : "border-border text-muted-foreground hover:border-green-400"
                    )}>{tag}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">아쉬웠던 점 (복수 선택 가능)</p>
              <div className="flex flex-wrap gap-1.5">
                {CONS_TAGS[type].map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag, consTags, setConsTags)}
                    className={cn("px-2.5 py-1 text-xs rounded-full border transition-all",
                      consTags.includes(tag) ? "border-red-400 bg-red-50 text-red-600 font-semibold" : "border-border text-muted-foreground hover:border-red-300"
                    )}>{tag}</button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Section 4: Context ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">4 · 나의 상황 (선택)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">학년</Label>
                <div className="flex flex-wrap gap-1">
                  {GRADE_LEVELS.map(g => (
                    <button key={g} type="button" onClick={() => setGradeLevel(g === gradeLevel ? "" : g)}
                      className={cn("px-2 py-0.5 text-xs rounded-full border transition-all",
                        gradeLevel === g ? "border-dream bg-dream/10 text-dream" : "border-border text-muted-foreground"
                      )}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">수강 기간</Label>
                <div className="flex flex-col gap-1">
                  {DURATIONS[type].map(d => (
                    <button key={d} type="button" onClick={() => setStudyDuration(d === studyDuration ? "" : d)}
                      className={cn("px-2 py-0.5 text-xs rounded-full border text-left transition-all",
                        studyDuration === d ? "border-dream bg-dream/10 text-dream" : "border-border text-muted-foreground"
                      )}>{d}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">수강 전 등급</Label>
                <div className="flex flex-wrap gap-1">
                  {GRADES.map(g => (
                    <button key={g} type="button" onClick={() => setGradeBefore(g === gradeBefore ? "" : g)}
                      className={cn("px-2 py-0.5 text-xs rounded-full border transition-all",
                        gradeBefore === g ? "border-dream bg-dream/10 text-dream" : "border-border text-muted-foreground"
                      )}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">수강 후 등급</Label>
                <div className="flex flex-wrap gap-1">
                  {GRADES.map(g => (
                    <button key={g} type="button" onClick={() => setGradeAfter(g === gradeAfter ? "" : g)}
                      className={cn("px-2 py-0.5 text-xs rounded-full border transition-all",
                        gradeAfter === g ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground"
                      )}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 5: Written review ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">5 · 리뷰 작성</h3>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">제목 <span className="text-destructive">*</span></Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 3개월 만에 3등급 → 1등급 달성한 비결"
                className="h-10 rounded-xl border-border/60 focus-visible:ring-dream" maxLength={100} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-sm font-semibold">상세 후기 <span className="text-destructive">*</span></Label>
                <span className={cn("text-xs", content.length < 20 ? "text-muted-foreground" : "text-green-600")}>
                  {content.length} / 최소 20자
                </span>
              </div>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="솔직한 경험을 자세히 써주세요. 강점과 약점, 어떤 학생에게 추천하는지 등을 포함하면 더 도움이 됩니다."
                className="min-h-[120px] rounded-xl border-border/60 focus-visible:ring-dream resize-none text-sm" maxLength={2000} />
            </div>
          </section>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="w-full h-12 bg-dream text-white font-bold rounded-xl text-sm hover:bg-dream/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? "등록 중..." : <><PenLine size={16} /> 리뷰 등록하기</>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
