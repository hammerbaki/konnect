/*
 * Design: Inkwell — Editorial Ink & Paper
 * Academies page — 지역구 학원 리뷰 & 비교
 * - Region filter (시/도 → 구/군)
 * - Subject filter
 * - Academy cards with ratings, price range
 * - Community review feed
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  MapPin,
  Star,
  Filter,
  Heart,
  MessageSquare,
  Eye,
  Users,
  Phone,
  Clock,
  DollarSign,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const regions: Record<string, string[]> = {
  "서울": ["전체", "강남구", "서초구", "송파구", "양천구", "노원구", "마포구", "중구", "강서구"],
  "경기": ["전체", "성남시", "수원시", "용인시", "고양시", "안양시", "부천시", "화성시"],
  "인천": ["전체", "남동구", "부평구", "연수구"],
  "부산": ["전체", "해운대구", "수영구", "남구"],
  "대구": ["전체", "수성구", "달서구", "중구"],
  "대전": ["전체", "유성구", "서구", "중구"],
  "광주": ["전체", "북구", "남구", "서구"],
};

const subjects = ["전체", "국어", "수학", "영어", "과학", "논술", "종합"];

const academies = [
  { id: 1, name: "시대인재 대치캠퍼스", region: "서울", district: "강남구", subject: "종합", rating: 4.8, reviews: 342, priceRange: "50~80만원/월", students: 1200, phone: "02-1234-5678", hours: "09:00~22:00", features: ["자습실 완비", "1:1 상담", "모의고사 매주"], desc: "대치동 대표 종합학원. 체계적인 커리큘럼과 자습 관리로 유명." },
  { id: 2, name: "청솔학원 대치점", region: "서울", district: "강남구", subject: "종합", rating: 4.7, reviews: 289, priceRange: "60~90만원/월", students: 800, phone: "02-2345-6789", hours: "08:00~23:00", features: ["기숙학원", "재수종합반", "관리형"], desc: "재수생 전문 종합학원. 기숙형 관리로 높은 합격률." },
  { id: 3, name: "이강수학 목동점", region: "서울", district: "양천구", subject: "수학", rating: 4.9, reviews: 198, priceRange: "40~60만원/월", students: 350, phone: "02-3456-7890", hours: "14:00~22:00", features: ["소수정예", "레벨별 반편성", "주간테스트"], desc: "목동 수학 전문학원. 소수정예 수업으로 개인 맞춤 관리." },
  { id: 4, name: "강남대성학원", region: "서울", district: "서초구", subject: "종합", rating: 4.6, reviews: 456, priceRange: "55~85만원/월", students: 1500, phone: "02-4567-8901", hours: "07:00~22:00", features: ["재수종합반", "자습실", "상담실"], desc: "서초 대표 재수학원. 오랜 전통과 높은 합격률." },
  { id: 5, name: "정상어학원 분당점", region: "경기", district: "성남시", subject: "영어", rating: 4.7, reviews: 167, priceRange: "35~55만원/월", students: 420, phone: "031-1234-5678", hours: "14:00~21:00", features: ["원어민 수업", "레벨테스트", "소수정예"], desc: "분당 영어 전문학원. 원어민 수업과 체계적 레벨 관리." },
  { id: 6, name: "메가스터디학원 노원점", region: "서울", district: "노원구", subject: "종합", rating: 4.5, reviews: 234, priceRange: "45~70만원/월", students: 600, phone: "02-5678-9012", hours: "09:00~22:00", features: ["인강 연계", "자습실", "모의고사"], desc: "노원 종합학원. 메가스터디 인강과 연계한 하이브리드 수업." },
  { id: 7, name: "대치국어 논술학원", region: "서울", district: "강남구", subject: "논술", rating: 4.8, reviews: 145, priceRange: "30~50만원/월", students: 200, phone: "02-6789-0123", hours: "15:00~21:00", features: ["대학별 논술", "첨삭 무제한", "소수정예"], desc: "대치동 논술 전문학원. 대학별 맞춤 논술 지도." },
  { id: 8, name: "수원 과학전문학원", region: "경기", district: "수원시", subject: "과학", rating: 4.6, reviews: 123, priceRange: "35~50만원/월", students: 280, phone: "031-2345-6789", hours: "14:00~22:00", features: ["실험 수업", "과학탐구 전문", "내신+수능"], desc: "수원 과학 전문학원. 실험 수업과 탐구 영역 전문 지도." },
];

const communityReviews = [
  { id: 301, title: "대치동 수학학원 TOP 5 비교 (2026 최신)", author: "대치러", region: "서울 강남", likes: 523, comments: 112, views: 4200, time: "1시간 전", excerpt: "대치동에서 직접 다녀본 수학학원 5곳을 비교합니다. 가격, 관리, 수업 스타일 모두 포함." },
  { id: 302, title: "목동 국어학원 추천, 직접 다녀본 3곳 후기", author: "목동고3", region: "서울 양천", likes: 287, comments: 56, views: 2800, time: "3시간 전", excerpt: "목동에서 국어학원 3곳을 다녀봤습니다. 비문학 중심 vs 문학 중심 차이가 큽니다." },
  { id: 303, title: "분당 영어학원 가성비 순위 (월 수강료 포함)", author: "분당맘", region: "경기 성남", likes: 198, comments: 43, views: 2100, time: "5시간 전", excerpt: "분당 영어학원 월 수강료와 수업 퀄리티를 비교했습니다." },
  { id: 304, title: "노원 종합학원 vs 대치 종합학원, 차이가 있을까?", author: "노원고3", region: "서울 노원", likes: 345, comments: 78, views: 3400, time: "7시간 전", excerpt: "거리 때문에 노원에서 다니는데, 대치까지 가야 할까 고민입니다." },
  { id: 305, title: "재수학원 선택 기준 총정리 (기숙 vs 통학)", author: "재수생", region: "서울 서초", likes: 412, comments: 95, views: 5100, time: "12시간 전", excerpt: "기숙학원과 통학학원의 장단점을 정리했습니다. 자기관리 능력에 따라 선택하세요." },
];

export default function Academies() {
  const [activeRegion, setActiveRegion] = useState("서울");
  const [activeDistrict, setActiveDistrict] = useState("전체");
  const [activeSubject, setActiveSubject] = useState("전체");
  const [sortBy, setSortBy] = useState<"popular" | "rating">("popular");

  const districts = regions[activeRegion] || ["전체"];

  const filtered = academies
    .filter((a) => a.region === activeRegion)
    .filter((a) => activeDistrict === "전체" || a.district === activeDistrict)
    .filter((a) => activeSubject === "전체" || a.subject === activeSubject)
    .sort((a, b) => {
      if (sortBy === "popular") return b.reviews - a.reviews;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <MapPin size={20} className="text-gold" />
        <h1 className="editorial-heading text-2xl">학원 리뷰</h1>
        <span className="ink-tag-filled bg-gold/10 text-gold text-[10px]">지역구</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        우리 동네 어떤 학원을 다닐지 고민이라면? 지역별 실제 수강 후기로 나에게 맞는 학원을 찾으세요.
      </p>

      {/* 꿈 맥락 연동 배너 */}
      <div className="dream-card p-4 mb-4 flex items-center gap-3">
        <Sparkles size={18} className="text-dream shrink-0" />
        <div className="flex-1">
          <p className="text-sm">
            나의 꿈 <span className="font-bold text-dream">"서울대 의대"</span>를 위한 지역 학원 정보
          </p>
          <p className="text-[10px] text-muted-foreground">같은 꿈을 꾸는 동료들이 다니는 학원을 확인하세요</p>
        </div>
        <Link href="/explore">
          <span className="text-xs text-dream font-semibold whitespace-nowrap">동료 학원 →</span>
        </Link>
      </div>
      <hr className="editorial-divider-thick mt-0" />

      {/* Region Filter */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <MapPin size={14} className="text-gold shrink-0" />
          {Object.keys(regions).map((r) => (
            <button
              key={r}
              onClick={() => { setActiveRegion(r); setActiveDistrict("전체"); }}
              className={`shrink-0 px-3 py-1 text-xs transition-all ${
                activeRegion === r
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* District Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
          {districts.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDistrict(d)}
              className={`shrink-0 text-xs transition-all ${
                activeDistrict === d ? "text-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Subject + Sort */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter size={14} className="text-muted-foreground shrink-0" />
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSubject(s)}
                className={`shrink-0 text-xs transition-all ${
                  activeSubject === s ? "text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy("popular")}
              className={`flex items-center gap-1 text-xs ${sortBy === "popular" ? "text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              <Users size={12} /> 리뷰순
            </button>
            <button
              onClick={() => setSortBy("rating")}
              className={`flex items-center gap-1 text-xs ${sortBy === "rating" ? "text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              <Star size={12} /> 평점순
            </button>
          </div>
        </div>
      </div>

      {/* Academy Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <MapPin size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">해당 지역에 등록된 학원이 없습니다.</p>
          <p className="text-xs text-muted-foreground mt-1">다른 지역을 선택하거나, 학원 정보를 등록해주세요.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {filtered.map((academy, i) => (
            <motion.div
              key={academy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <div
                className="ink-card p-4 h-full flex flex-col cursor-pointer"
                onClick={() => toast.info("학원 상세 페이지는 준비 중입니다")}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="ink-tag-filled bg-gold/10 text-gold text-[10px] flex items-center gap-0.5">
                    <MapPin size={8} /> {academy.region} {academy.district}
                  </span>
                  <span className="ink-tag text-[10px]">{academy.subject}</span>
                </div>
                <h3 className="font-serif font-bold text-base leading-snug mb-1">{academy.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{academy.desc}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {academy.features.map((f) => (
                    <span key={f} className="ink-tag-filled bg-secondary text-[10px] text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>

                {/* Info */}
                <div className="space-y-1.5 mb-3 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <DollarSign size={12} className="text-gold shrink-0" />
                    <span>{academy.priceRange}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} className="shrink-0" />
                    <span>{academy.hours}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone size={12} className="shrink-0" />
                    <span>{academy.phone}</span>
                  </div>
                </div>

                {/* Rating & Reviews */}
                <div className="flex items-center justify-between border-t border-border pt-2 mt-auto">
                  <div className="flex items-center gap-2">
                    <Star size={12} className="text-gold fill-gold" />
                    <span className="text-xs font-semibold">{academy.rating}</span>
                    <span className="text-[10px] text-muted-foreground">({academy.reviews})</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Users size={10} /> {academy.students.toLocaleString()}명 수강
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Community Reviews */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} />
          <h2 className="editorial-heading text-lg">학원 후기 & 비교 글</h2>
        </div>
        <Link href="/community">
          <span className="text-xs text-muted-foreground hover:text-foreground ink-link">
            전체보기 →
          </span>
        </Link>
      </div>
      <hr className="editorial-divider-thick mt-0 mb-0" />
      <div className="divide-y divide-border">
        {communityReviews.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 * i }}
          >
            <Link href={`/community/${review.id}`}>
              <article className="py-4 group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="ink-tag-filled bg-gold/10 text-gold text-[10px] flex items-center gap-0.5">
                    <MapPin size={8} /> {review.region}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{review.time}</span>
                </div>
                <h3 className="font-serif font-bold text-sm group-hover:text-gold transition-colors">
                  {review.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{review.excerpt}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span>{review.author}</span>
                  <span className="flex items-center gap-0.5"><Heart size={10} /> {review.likes}</span>
                  <span className="flex items-center gap-0.5"><MessageSquare size={10} /> {review.comments}</span>
                  <span className="flex items-center gap-0.5"><Eye size={10} /> {review.views}</span>
                </div>
              </article>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
