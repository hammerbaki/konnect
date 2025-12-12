import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard, History, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useTokens } from "@/lib/TokenContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useSearch } from "wouter";
import { format } from "date-fns";

declare global {
  interface Window {
    TossPayments: any;
  }
}

interface PointPackage {
  id: string;
  name: string;
  points: number;
  price: number;
  bonusPoints: number;
  description: string | null;
}

interface PointTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  type: string;
  description: string | null;
  createdAt: string;
}

export default function TokenRecharge() {
  const { credits, refreshCredits } = useTokens();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [tossLoaded, setTossLoaded] = useState(false);

  // Load Toss SDK
  useEffect(() => {
    if (window.TossPayments) {
      setTossLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v2/standard";
    script.async = true;
    script.onload = () => setTossLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Fetch Toss config
  const { data: tossConfig } = useQuery({
    queryKey: ["/api/payments/config"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/payments/config");
      return res.json();
    },
  });

  // Fetch packages from DB
  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ["/api/payments/packages"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/payments/packages");
      return res.json();
    },
  });

  // Fetch transaction history
  const { data: transactions = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/points/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/points/history?limit=10");
      return res.json();
    },
  });

  // Default packages if none in DB
  const displayPackages: PointPackage[] = packages.length > 0 ? packages : [
    { id: "pkg_100", name: "스타터", points: 100, price: 5000, bonusPoints: 0, description: null },
    { id: "pkg_300", name: "베이직", points: 300, price: 10000, bonusPoints: 30, description: "인기" },
    { id: "pkg_500", name: "스탠다드", points: 500, price: 15000, bonusPoints: 50, description: null },
    { id: "pkg_1000", name: "프리미엄", points: 1000, price: 25000, bonusPoints: 150, description: null },
  ];

  // Handle payment success callback
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = params.get("amount");

    if (paymentKey && orderId && amount) {
      handlePaymentConfirm(paymentKey, orderId, amount);
    }
  }, [searchString]);

  // Confirm payment mutation
  const confirmPayment = useMutation({
    mutationFn: async ({ paymentKey, orderId, amount }: { paymentKey: string; orderId: string; amount: string }) => {
      const res = await apiRequest("POST", "/api/payments/confirm", {
        paymentKey,
        orderId,
        amount,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "결제 승인 실패");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "결제 완료",
        description: `${data.payment.pointsAdded.toLocaleString()} 포인트가 충전되었습니다.`,
      });
      refreshCredits();
      queryClient.invalidateQueries({ queryKey: ["/api/points/history"] });
      // Clear URL params
      setLocation("/recharge", { replace: true });
    },
    onError: (error: Error) => {
      toast({
        title: "결제 실패",
        description: error.message,
        variant: "destructive",
      });
      setLocation("/recharge", { replace: true });
    },
  });

  const handlePaymentConfirm = async (paymentKey: string, orderId: string, amount: string) => {
    setIsProcessing(true);
    try {
      await confirmPayment.mutateAsync({ paymentKey, orderId, amount });
    } finally {
      setIsProcessing(false);
    }
  };

  // Initialize payment
  const initPayment = useMutation({
    mutationFn: async (pkg: PointPackage) => {
      const res = await apiRequest("POST", "/api/payments/init", {
        packageId: pkg.id,
        amount: pkg.price,
        pointsToAdd: pkg.points + pkg.bonusPoints,
        orderName: `${pkg.name} - ${pkg.points + pkg.bonusPoints} 포인트`,
      });
      if (!res.ok) {
        throw new Error("결제 초기화 실패");
      }
      return res.json();
    },
  });

  const handleRecharge = async (pkg: PointPackage) => {
    if (!tossLoaded || !tossConfig?.clientKey) {
      toast({
        title: "결제 모듈 로딩 중",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create order in backend
      const orderData = await initPayment.mutateAsync(pkg);

      // 2. Initialize Toss Payment
      const tossPayments = window.TossPayments(tossConfig.clientKey);
      const payment = tossPayments.payment({ customerKey: `customer_${Date.now()}` });

      // 3. Request payment
      await payment.requestPayment({
        method: "CARD",
        amount: {
          value: orderData.amount,
          currency: "KRW",
        },
        orderId: orderData.orderId,
        orderName: orderData.orderName,
        successUrl: `${window.location.origin}/recharge`,
        failUrl: `${window.location.origin}/recharge?error=true`,
      });
    } catch (error: any) {
      console.error("Payment error:", error);
      if (error.code !== "USER_CANCEL") {
        toast({
          title: "결제 오류",
          description: error.message || "결제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-400" />;
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: "포인트 충전",
      usage: "포인트 사용",
      admin_add: "관리자 지급",
      admin_deduct: "관리자 차감",
      refund: "환불",
      bonus: "보너스",
    };
    return labels[type] || type;
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-20">
        <h2 className="text-[28px] font-bold text-[#191F28] mb-6" data-testid="text-page-title">포인트 충전</h2>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="p-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#3182F6]" />
                <p className="text-lg font-medium">결제 처리 중...</p>
              </div>
            </Card>
          </div>
        )}

        {/* Current Balance */}
        <Card className="bg-[#3182F6] text-white border-none mb-8 shadow-lg shadow-blue-500/30" data-testid="card-balance">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-blue-100 font-medium mb-1">현재 보유 포인트</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold" data-testid="text-balance">{credits.toLocaleString()}</span>
                <span className="text-xl font-medium text-blue-100">P</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Coins className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Recharge Packages */}
        <h3 className="text-lg font-bold text-[#191F28] mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#3182F6]" /> 충전 패키지
        </h3>
        <div className="grid gap-4 mb-8">
          {packagesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#3182F6]" />
            </div>
          ) : (
            displayPackages.map((pkg) => {
              const hasBadge = pkg.description && pkg.description.trim() !== '';
              const isHighlighted = hasBadge || pkg.bonusPoints > 0;
              return (
                <Card 
                  key={pkg.id} 
                  className={`toss-card cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${isHighlighted ? 'border-[#3182F6] ring-1 ring-[#3182F6]' : ''}`}
                  onClick={() => handleRecharge(pkg)}
                  data-testid={`card-package-${pkg.id}`}
                >
                  <CardContent className="p-5 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-bold text-[#191F28]">{pkg.points.toLocaleString()} 포인트</span>
                        {pkg.bonusPoints > 0 && (
                          <Badge className="bg-green-100 text-green-600 border-none hover:bg-green-100">
                            +{pkg.bonusPoints.toLocaleString()} 보너스
                          </Badge>
                        )}
                        {hasBadge && (
                          <Badge className="bg-[#3182F6] text-white border-none hover:bg-[#3182F6]">
                            {pkg.description}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[#8B95A1] text-sm">AI 커리어 분석 {Math.floor((pkg.points + pkg.bonusPoints) / 100)}회 가능</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-[#333D4B]">{formatPrice(pkg.price)}</span>
                      <Button 
                        className={`rounded-full h-10 px-5 font-bold ${isHighlighted ? 'bg-[#3182F6] hover:bg-[#2b72d7]' : 'bg-[#F2F4F6] text-[#3182F6] hover:bg-[#E5E8EB]'}`}
                        disabled={isProcessing}
                        data-testid={`button-buy-${pkg.id}`}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "구매"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Test Mode Notice */}
        <Card className="bg-amber-50 border-amber-200 mb-8">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">테스트 모드</p>
              <p className="text-sm text-amber-700">
                현재 Toss Payments 테스트 환경에서 실행 중입니다. 실제 결제가 이루어지지 않습니다.
                테스트 카드번호: 1111-2222-3333-4444
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <h3 className="text-lg font-bold text-[#191F28] mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-[#8B95A1]" /> 포인트 내역
        </h3>
        <Card className="toss-card divide-y divide-[#F2F4F6]">
          <CardContent className="p-0">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#8B95A1]" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-[#8B95A1]">
                <Coins className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>포인트 내역이 없습니다</p>
              </div>
            ) : (
              transactions.map((tx: PointTransaction) => (
                <div 
                  key={tx.id} 
                  className="p-5 flex justify-between items-center hover:bg-[#F9FAFB] transition-colors"
                  data-testid={`row-transaction-${tx.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      {getTransactionIcon(tx.type, tx.amount)}
                    </div>
                    <div>
                      <p className="font-bold text-[#333D4B]">{tx.description || getTransactionLabel(tx.type)}</p>
                      <p className="text-sm text-[#8B95A1]">
                        {tx.createdAt ? format(new Date(tx.createdAt), "yyyy.MM.dd HH:mm") : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} P
                    </p>
                    <p className="text-sm text-[#8B95A1]">잔액 {tx.balanceAfter.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
