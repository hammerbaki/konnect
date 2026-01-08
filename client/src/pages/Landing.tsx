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
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1117]">
        <div className="text-center">
          <Skeleton className="h-16 w-16 rounded-[22px] mx-auto mb-6 bg-white/10" />
          <Skeleton className="h-9 w-32 mx-auto mb-2 bg-white/10" />
          <Skeleton className="h-5 w-48 mx-auto bg-white/10" />
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Brain,
      title: "AI 커리어 분석",
      description:
        "당신의 경험, 관심사, 강점을 분석하여 최적의 진로를 추천합니다. 시장 경쟁력과 성공 확률까지 한눈에 파악하세요.",
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      icon: Target,
      title: "Kompass 목표 관리",
      description:
        "연간 비전부터 일일 할 일까지 체계적으로 관리하세요. AI가 실현 가능한 단계별 목표를 자동으로 생성해드립니다.",
      gradient: "from-violet-500 to-purple-400",
    },
    {
      icon: FileText,
      title: "AI 자기소개서",
      description:
        "입시, 취업, 이직에 맞는 완벽한 자기소개서를 AI가 작성합니다. 수정 요청도 무제한으로 가능합니다.",
      gradient: "from-orange-500 to-amber-400",
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
      content:
        "막연하게 의대를 생각했는데, AI 분석 결과 생명공학 연구원이 저한테 더 맞다는 걸 알게 됐어요. 덕분에 진로 방향을 확실히 잡았습니다!",
      rating: 5,
    },
    {
      name: "이준혁",
      role: "대학생 취준생",
      avatar: "👨‍💼",
      content:
        "자소서 쓰는 게 너무 막막했는데, AI가 제 경험을 바탕으로 초안을 만들어줘서 시간이 엄청 절약됐어요. 수정도 바로바로 되고요.",
      rating: 5,
    },
    {
      name: "박민지",
      role: "직장인 3년차",
      avatar: "👩‍💻",
      content:
        "이직 준비하면서 Kompass로 목표를 세웠더니 뭘 해야 할지 명확해졌어요. 연봉 협상 전략까지 분석해줘서 실제로 도움이 많이 됐습니다.",
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
    <div className="min-h-screen bg-[#0D1117] font-sans overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117]" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-[#3182F6]/20 to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-violet-600/20 to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />

        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-[15%] w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl shadow-lg shadow-blue-500/40 opacity-80"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-[20%] w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-400 rounded-xl shadow-lg shadow-violet-500/40 opacity-80"
          animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute bottom-32 right-[25%] w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-lg shadow-lg shadow-orange-500/40 opacity-80"
          animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Konnect Logo */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <div className="inline-block p-4 backdrop-blur-md rounded-2xl border border-white/20 shadow-[0_0_40px_rgba(49,130,246,0.3)] bg-[#ffffff0d]">
                <img
                  src="/konnect-logo.png"
                  alt="Konnect"
                  className="h-14 md:h-18 w-auto mx-auto brightness-110"
                  data-testid="logo-konnect"
                />
              </div>
            </motion.div>

            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white/80">
                가입 시 <span className="text-amber-400 font-bold">1,000P</span>{" "}
                무료 지급
              </span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              진로 고민,
              <br />
              <span className="bg-gradient-to-r from-[#3182F6] via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                AI가 대신 고민합니다
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
              빠르고 정밀한 맞춤형 커리어 분석
              <br className="md:hidden" />
              <span className="hidden md:inline"> · </span>
              AI 목표 설정<span className="hidden md:inline"> · </span>
              <br className="md:hidden" />
              자기소개서 자동 생성
            </p>

            {/* Target Audience Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {targetAudiences.map((audience, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                >
                  <audience.icon className="w-4 h-4 text-[#3182F6]" />
                  <span className="text-sm font-medium text-white/80">
                    {audience.label}
                  </span>
                  <span className="text-xs text-white/50">{audience.desc}</span>
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
                className="w-full sm:w-auto h-14 px-8 text-lg rounded-2xl bg-gradient-to-r from-[#3182F6] to-blue-500 hover:from-[#2b72d7] hover:to-blue-600 shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/40 text-white font-semibold"
                onClick={() => setLocation("/login")}
                data-testid="button-login-hero"
              >
                무료로 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 text-lg rounded-2xl border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white transition-all"
                onClick={scrollToFeatures}
                data-testid="button-learn-more"
              >
                더 알아보기
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap justify-center items-center gap-6 text-sm text-white/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>가입 즉시 사용 가능</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>개인정보 안전 보호</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>분석 3분 완료</span>
              </div>
            </motion.div>

            {/* Company Credit */}
            <motion.div
              className="mt-10 pt-8 border-t border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <p className="text-sm text-white/40">
                대한민국 AI 고용·취업 대표기업{" "}
                <a
                  href="https://kjobs.co.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 font-semibold hover:text-[#3182F6] transition-colors underline underline-offset-2"
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
            <ChevronDown className="w-8 h-8 text-white/30" />
          </motion.div>
        </div>
      </section>
      {/* Problem Agitation Section */}
      <section className="py-20 bg-[#161B22]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              이런 고민, 혼자 하고 계신가요?
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mt-10">
              {[
                { emoji: "😰", text: "내 적성에 맞는 직업이 뭔지 모르겠어요" },
                { emoji: "📝", text: "자기소개서 쓰는 게 너무 막막해요" },
                {
                  emoji: "🎯",
                  text: "목표는 있는데 어디서부터 시작해야 할지...",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="text-4xl mb-4">{item.emoji}</div>
                  <p className="text-white/80 font-medium">{item.text}</p>
                </motion.div>
              ))}
            </div>
            <motion.p
              className="mt-10 text-xl font-semibold bg-gradient-to-r from-[#3182F6] to-cyan-400 bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Konnect AI가 모두 해결해 드립니다 ✨
            </motion.p>
          </motion.div>
        </div>
      </section>
      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-[#0D1117]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              핵심 기능
            </h2>
            <p className="text-lg text-white/50">
              AI가 당신의 커리어 전문 컨설턴트가 됩니다
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                className="relative p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg mb-6`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-[#3182F6] to-blue-600">
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
                <stat.icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works */}
      <section className="py-24 bg-[#161B22]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              시작은 간단합니다
            </h2>
            <p className="text-lg text-white/50">
              3단계로 나만의 커리어 로드맵을 받아보세요
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "프로필 작성",
                desc: "5분이면 충분해요. 관심사, 경험, 목표를 입력하세요.",
                color: "blue",
              },
              {
                step: "02",
                title: "AI 분석",
                desc: "Claude AI가 당신의 강점과 적합한 진로를 분석합니다.",
                color: "violet",
              },
              {
                step: "03",
                title: "목표 실행",
                desc: "맞춤형 목표와 자기소개서로 바로 실행하세요.",
                color: "green",
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
                <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 h-full">
                  <div
                    className={`text-5xl font-bold bg-gradient-to-r ${
                      item.color === "blue"
                        ? "from-blue-400 to-cyan-400"
                        : item.color === "violet"
                          ? "from-violet-400 to-purple-400"
                          : "from-emerald-400 to-green-400"
                    } bg-clip-text text-transparent mb-4`}
                  >
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-white/60">{item.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-white/30">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Testimonials */}
      <section className="py-24 bg-[#0D1117]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              실제 사용자 후기
            </h2>
            <p className="text-lg text-white/50">
              Konnect와 함께 커리어를 설계한 분들의 이야기
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-white/70 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-white/50">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#161B22] to-[#0D1117] relative overflow-hidden">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#3182F6]/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-600/30 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white/90">
                지금 가입하면 1,000P 무료 지급
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              당신의 커리어,
              <br />
              지금 바로 시작하세요
            </h2>

            <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
              더 이상 혼자 고민하지 마세요.
              <br />
              AI 커리어 컨설턴트가 24시간 함께합니다.
            </p>

            <Button
              className="h-16 px-10 text-xl rounded-2xl bg-gradient-to-r from-[#3182F6] to-blue-500 hover:from-[#2b72d7] hover:to-blue-600 text-white font-semibold shadow-2xl shadow-blue-500/30 transition-all hover:scale-[1.02]"
              onClick={() => setLocation("/login")}
              data-testid="button-login-cta"
            >
              무료로 시작하기
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </motion.div>
        </div>
      </section>
      {/* Footer */}
      <footer className="py-12 bg-[#0D1117] border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/konnect-logo.png"
                alt="Konnect"
                className="h-8 w-auto brightness-0 invert opacity-80"
              />
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link
                href="/privacy"
                className="hover:text-white/60 transition-colors"
                data-testid="link-privacy"
              >
                개인정보처리방침
              </Link>
              <Link
                href="/terms"
                className="hover:text-white/60 transition-colors"
                data-testid="link-terms"
              >
                이용약관
              </Link>
              <a
                href="https://kjobs.co.kr/qna"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/60 transition-colors"
                data-testid="link-support"
              >
                고객센터
              </a>
            </div>
            <p className="text-sm text-white/30">
              &copy; 2025 Konnect.careers. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
