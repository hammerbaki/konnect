import { useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Sparkles,
  Target,
  FileText,
  CheckCircle2,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Brain,
  ChevronDown,
  Star,
  GraduationCap,
  Briefcase,
  BookOpen,
  Mic,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Landing() {
  const [, setLocation] = useLocation();
  usePageTitle("Konnect — 꿈을 잇다", "너와 나의 꿈이 만나는 곳. AI 기반 맞춤형 진로 분석, 학과 탐색, 목표 관리 플랫폼.");
  const { isAuthenticated, isLoading } = useAuth();
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      window.location.href = `/api/sso/kjobs?token=${encodeURIComponent(token)}`;
      return;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Skeleton className="h-16 w-16 rounded-[22px] mx-auto mb-6" />
          <Skeleton className="h-9 w-32 mx-auto mb-2" />
          <Skeleton className="h-5 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Brain,
      title: "AI 커리어 분석",
      description: "당신의 경험, 관심사, 강점을 분석하여 최적의 진로를 추천합니다. 시장 경쟁력과 성공 확률까지 한눈에 파악하세요.",
      color: "dream",
    },
    {
      icon: Target,
      title: "Kompass - AI 목표관리",
      description: "프로필과 커리어 분석 결과를 바탕으로 장기·중기·단기 목표를 체계적으로 관리합니다. AI가 단계별 목표를 자동으로 생성해드립니다.",
      color: "coral",
    },
    {
      icon: FileText,
      title: "AI 자기소개서",
      description: "입시, 취업, 이직에 맞는 완벽한 자기소개서를 AI가 작성합니다. 수정 요청도 무제한으로 가능합니다.",
      color: "gold",
    },
  ];

  const stats = [
    { number: "50,000+", label: "분석 완료", icon: TrendingUp },
    { number: "4.9", label: "사용자 평점", icon: Star },
    { number: "3분", label: "평균 분석 시간", icon: Zap },
    { number: "98%", label: "만족도", icon: Users },
  ];

  const testimonials = [
    {
      name: "김서연",
      role: "고등학생",
      avatar: "👩‍🎓",
      content: "막연하게 의대를 생각했는데, AI 분석 결과 생명공학 연구원이 저한테 더 맞다는 걸 알게 됐어요. 덕분에 진로 방향을 확실히 잡았습니다!",
      rating: 5,
    },
    {
      name: "이준혁",
      role: "대학생 취준생",
      avatar: "👨‍💼",
      content: "자소서 쓰는 게 너무 막막했는데, AI가 제 경험을 바탕으로 초안을 만들어줘서 시간이 엄청 절약됐어요. 수정도 바로바로 되고요.",
      rating: 5,
    },
    {
      name: "박민지",
      role: "직장인 3년차",
      avatar: "👩‍💻",
      content: "이직 준비하면서 Kompass로 목표를 세웠더니 뭘 해야 할지 명확해졌어요. 연봉 협상 전략까지 분석해줘서 실제로 도움이 많이 됐습니다.",
      rating: 5,
    },
  ];

  const targetAudiences = [
    { icon: BookOpen, label: "초·중·고등학생", desc: "진로 탐색" },
    { icon: GraduationCap, label: "대학생", desc: "취업 준비" },
    { icon: Briefcase, label: "직장인", desc: "이직·승진" },
  ];

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-background/80 backdrop-blur-md border-b border-border">
        <Link href="/" data-testid="link-nav-logo">
          <img src="/konnect-logo.png" alt="Konnect" className="h-7 w-auto cursor-pointer" />
        </Link>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground text-sm font-medium rounded-lg"
            onClick={scrollToFeatures}
            data-testid="button-nav-features"
          >
            기능 소개
          </Button>
          <Button
            className="h-9 px-5 text-sm rounded-lg text-white font-semibold bg-dream hover:bg-dream/90 shadow-sm transition-all"
            onClick={() => setLocation("/login")}
            data-testid="button-nav-login"
          >
            시작하기
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, #320e9d22 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #ea6a6422 0%, transparent 70%)" }} />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full blur-3xl opacity-15" style={{ background: "radial-gradient(circle, #c79e4118 0%, transparent 70%)" }} />

        {/* Floating accent shapes */}
        <motion.div
          className="absolute top-24 left-[12%] w-14 h-14 rounded-2xl shadow-lg opacity-70"
          style={{ background: "linear-gradient(135deg, #320e9d, #4a16e0)" }}
          animate={{ y: [0, -18, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-36 right-[18%] w-10 h-10 rounded-xl shadow-lg opacity-60"
          style={{ background: "linear-gradient(135deg, #ea6a64, #f0857f)" }}
          animate={{ y: [0, 14, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-36 right-[22%] w-8 h-8 rounded-lg shadow-lg opacity-60"
          style={{ background: "linear-gradient(135deg, #c79e41, #d4ae55)" }}
          animate={{ y: [0, -14, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <div className="inline-block p-4 bg-card rounded-2xl border border-border shadow-[0_0_40px_rgba(50,14,157,0.12)]">
                <img
                  src="/konnect-logo.png"
                  alt="Konnect"
                  className="h-12 md:h-16 w-auto mx-auto"
                  data-testid="logo-konnect"
                />
              </div>
            </motion.div>

            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-dream/10 rounded-full border border-dream/20 mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-dream">
                가입 시 <span className="font-bold">1,000P</span> 무료 지급
              </span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
              너와 나의 꿈이
              <br />
              <span style={{ background: "linear-gradient(135deg, #320e9d, #ea6a64)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                만나는 곳.
              </span>
            </h1>

            {/* Sub tagline */}
            <motion.p
              className="text-base md:text-lg font-medium text-dream mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              꿈을 잇다.
            </motion.p>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              빠르고 정밀한 맞춤형 커리어 분석
              <span className="hidden md:inline"> · </span>
              <br className="md:hidden" />
              AI 목표 설정
              <span className="hidden md:inline"> · </span>
              <br className="md:hidden" />
              자기소개서 자동 생성
            </p>

            {/* Target Audience Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {targetAudiences.map((audience, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                >
                  <audience.icon className="w-4 h-4 text-dream" />
                  <span className="text-sm font-medium text-foreground">{audience.label}</span>
                  <span className="text-xs text-muted-foreground">{audience.desc}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                className="w-full sm:w-auto h-12 px-8 text-base rounded-xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_rgba(50,14,157,0.3)]"
                style={{ background: "linear-gradient(135deg, #320e9d, #4a16e0)" }}
                onClick={() => setLocation("/login")}
                data-testid="button-login-hero"
              >
                무료로 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 text-base rounded-xl border border-border bg-card hover:bg-secondary text-foreground transition-all"
                onClick={scrollToFeatures}
                data-testid="button-learn-more"
              >
                더 알아보기
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>가입 즉시 사용 가능</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>개인정보 안전 보호</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>분석 3분 완료</span>
              </div>
            </motion.div>

            {/* Community indicator */}
            <motion.div
              className="mt-8 pt-6 border-t border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <p className="text-sm text-muted-foreground">
                — 같은 꿈을 꾸는{" "}
                <span className="text-dream font-semibold">50,000+명</span>이 오늘도 함께하고 있어요
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                대한민국 AI 고용·취업 대표기업{" "}
                <a
                  href="https://kjobs.co.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dream font-semibold hover:underline"
                >
                  케이잡스
                </a>
                가 만들었습니다
              </p>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8 text-muted-foreground/40" />
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              이런 고민, 혼자 하고 계신가요?
            </h2>
            <p className="text-muted-foreground mb-10">끊어진 줄 알았던 꿈을, 다시 이어가는 사람들</p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { emoji: "😰", text: "내 적성에 맞는 직업이 뭔지 모르겠어요" },
                { emoji: "📝", text: "자기소개서 쓰는 게 너무 막막해요" },
                { emoji: "🎯", text: "목표는 있는데 어디서부터 시작해야 할지..." },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="p-6 bg-background rounded-2xl border border-border shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="text-4xl mb-4">{item.emoji}</div>
                  <p className="text-foreground font-medium">{item.text}</p>
                </motion.div>
              ))}
            </div>
            <motion.p
              className="mt-10 text-xl font-semibold"
              style={{ background: "linear-gradient(135deg, #320e9d, #ea6a64)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Konnect AI가 그 꿈을 다시 잇습니다 ✨
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs uppercase tracking-widest font-semibold text-dream mb-3">꿈을 위한 도구</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              핵심 기능
            </h2>
            <p className="text-lg text-muted-foreground">
              AI가 당신의 커리어 전문 컨설턴트가 됩니다
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const borderColor = feature.color === "dream" ? "#320e9d" : feature.color === "coral" ? "#ea6a64" : "#c79e41";
              const bgColor = feature.color === "dream" ? "#320e9d" : feature.color === "coral" ? "#ea6a64" : "#c79e41";
              return (
                <motion.div
                  key={idx}
                  className="relative p-7 rounded-2xl bg-card border border-border hover:border-dream/30 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div
                    className="inline-flex p-3.5 rounded-xl shadow-lg mb-5"
                    style={{ background: `linear-gradient(135deg, ${bgColor}ee, ${bgColor}aa)` }}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border" style={{ background: "linear-gradient(135deg, #320e9d, #4a16e0)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                className="text-center text-white"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <stat.icon className="w-7 h-7 mx-auto mb-3 opacity-70" />
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs uppercase tracking-widest font-semibold text-coral mb-3">시작</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              시작은 간단합니다
            </h2>
            <p className="text-lg text-muted-foreground">
              3단계로 나만의 커리어 로드맵을 받아보세요
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "프로필 작성",
                desc: "5분이면 충분해요. 관심사, 경험, 목표를 입력하세요.",
                color: "#320e9d",
              },
              {
                step: "02",
                title: "AI 분석",
                desc: "Claude AI가 당신의 강점과 적합한 진로를 분석합니다.",
                color: "#ea6a64",
              },
              {
                step: "03",
                title: "목표 실행",
                desc: "맞춤형 목표와 자기소개서로 바로 실행하세요.",
                color: "#c79e41",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
              >
                <div className="bg-background p-7 rounded-2xl border border-border shadow-sm h-full">
                  <div
                    className="text-5xl font-bold mb-4"
                    style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}88)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                  >
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-border z-10">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs uppercase tracking-widest font-semibold text-gold mb-3">같은 꿈을 꾸는 사람들</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              실제 사용자 후기
            </h2>
            <p className="text-lg text-muted-foreground">
              Konnect와 함께 커리어를 설계한 분들의 이야기
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                className="bg-card p-7 rounded-2xl border border-border shadow-sm"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gold fill-current" />
                  ))}
                </div>
                <p className="text-foreground/80 text-sm mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-card border-t border-border">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-widest font-semibold text-dream mb-4">꿈의 시작</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              꿈을 다시 선언할 준비가
              <br />
              되셨나요?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              꿈이 바뀌어도, 같은 꿈을 다시 선언해도 — 그 모든 과정이 Konnect와 함께합니다.
              <br />
              다시 시작하는 것은 용기입니다.
            </p>
            <Button
              className="h-12 px-10 text-base rounded-xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_rgba(50,14,157,0.3)]"
              style={{ background: "linear-gradient(135deg, #320e9d, #4a16e0)" }}
              onClick={() => setLocation("/login")}
              data-testid="button-cta-final"
            >
              지금 무료로 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              가입 시 <span className="text-dream font-semibold">1,000P</span> 무료 지급 · 신용카드 불필요
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 bg-background">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/konnect-logo.png" alt="Konnect" className="h-6 w-auto opacity-70" />
            <p className="text-xs text-muted-foreground">
              © 2026 Konnect — 꿈을 잇다. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-dream transition-colors ink-link">
              개인정보 처리방침
            </Link>
            <Link href="/terms" className="hover:text-dream transition-colors ink-link">
              이용약관
            </Link>
            <a
              href="https://kjobs.co.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-dream transition-colors ink-link"
            >
              케이잡스
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
