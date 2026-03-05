import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  CreditCard,
  History,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
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
  const { credits, giftPoints, totalBalance, refreshCredits } = useTokens();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [tossLoaded, setTossLoaded] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PointPackage | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetLoading, setWidgetLoading] = useState(false);
  const widgetsRef = useRef<any>(null);
  const paymentMethodWidgetRef = useRef<any>(null);
  const agreementWidgetRef = useRef<any>(null);

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
  const displayPackages: PointPackage[] =
    packages.length > 0
      ? packages
      : [
          {
            id: "pkg_100",
            name: "스타터",
            points: 100,
            price: 5000,
            bonusPoints: 0,
            description: null,
          },
          {
            id: "pkg_300",
            name: "베이직",
            points: 300,
            price: 10000,
            bonusPoints: 30,
            description: "인기",
          },
          {
            id: "pkg_500",
            name: "스탠다드",
            points: 500,
            price: 15000,
            bonusPoints: 50,
            description: null,
          },
          {
            id: "pkg_1000",
            name: "프리미엄",
            points: 1000,
            price: 25000,
            bonusPoints: 150,
            description: null,
          },
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
    mutationFn: async ({
      paymentKey,
      orderId,
      amount,
    }: {
      paymentKey: string;
      orderId: string;
      amount: string;
    }) => {
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
        description: `${data.payment.pointsAdded.toLocaleString()} 학습권이 충전되었습니다.`,
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

  const handlePaymentConfirm = async (
    paymentKey: string,
    orderId: string,
    amount: string,
  ) => {
    setIsProcessing(true);
    try {
      await confirmPayment.mutateAsync({ paymentKey, orderId, amount });
    } finally {
      setIsProcessing(false);
    }
  };

  const initPayment = useMutation({
    mutationFn: async (pkg: PointPackage) => {
      const isDbPackage = packages.length > 0 && packages.some((p: PointPackage) => p.id === pkg.id);
      const res = await apiRequest("POST", "/api/payments/init", {
        packageId: isDbPackage ? pkg.id : null,
        amount: pkg.price,
        pointsToAdd: pkg.points + pkg.bonusPoints,
        orderName: `${pkg.name} - ${pkg.points + pkg.bonusPoints} 학습권`,
      });
      if (!res.ok) {
        throw new Error("결제 초기화 실패");
      }
      return res.json();
    },
  });

  useEffect(() => {
    return () => {
      if (paymentMethodWidgetRef.current) {
        try { paymentMethodWidgetRef.current.destroy(); } catch (e) {}
      }
      if (agreementWidgetRef.current) {
        try { agreementWidgetRef.current.destroy(); } catch (e) {}
      }
    };
  }, []);

  const destroyWidgets = useCallback(() => {
    if (paymentMethodWidgetRef.current) {
      try { paymentMethodWidgetRef.current.destroy(); } catch (e) {}
      paymentMethodWidgetRef.current = null;
    }
    if (agreementWidgetRef.current) {
      try { agreementWidgetRef.current.destroy(); } catch (e) {}
      agreementWidgetRef.current = null;
    }
    widgetsRef.current = null;
    setWidgetReady(false);
  }, []);

  const handleSelectPackage = async (pkg: PointPackage) => {
    if (!tossLoaded || !tossConfig?.clientKey) {
      toast({
        title: "결제 모듈 로딩 중",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      return;
    }

    destroyWidgets();
    setSelectedPackage(pkg);
    setWidgetLoading(true);

    try {
      const tossPayments = window.TossPayments(tossConfig.clientKey);
      const widgets = tossPayments.widgets({
        customerKey: `customer_${Date.now()}`,
      });
      widgetsRef.current = widgets;

      await widgets.setAmount({ currency: "KRW", value: pkg.price });

      await new Promise(resolve => setTimeout(resolve, 100));

      const paymentMethodWidget = await widgets.renderPaymentMethods({
        selector: "#payment-method",
      });
      paymentMethodWidgetRef.current = paymentMethodWidget;

      await widgets.renderAgreement({
        selector: "#agreement",
      });

      setWidgetReady(true);
    } catch (error: any) {
      console.error("Widget render error:", error);
      toast({
        title: "결제 위젯 로딩 실패",
        description: error.message || "결제 모듈을 불러올 수 없습니다.",
        variant: "destructive",
      });
      setSelectedPackage(null);
    } finally {
      setWidgetLoading(false);
    }
  };

  const handleCancelSelection = () => {
    destroyWidgets();
    setSelectedPackage(null);
  };

  const handleRequestPayment = async () => {
    if (!widgetsRef.current || !selectedPackage) return;

    setIsProcessing(true);
    try {
      const orderData = await initPayment.mutateAsync(selectedPackage);

      await widgetsRef.current.requestPayment({
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
      purchase: "학습권 충전",
      usage: "학습권 사용",
      admin_add: "관리자 지급",
      admin_deduct: "관리자 차감",
      refund: "환불",
      bonus: "보너스",
    };
    return labels[type] || type;
  };

  return (
    <>
      <div className="max-w-2xl mx-auto pb-20">
        <h2
          className="text-[28px] font-bold text-[#191F28] mb-6"
          data-testid="text-page-title"
        >
          진로분석 학습권
        </h2>

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
        <Card
          className="bg-gradient-to-r from-[#3182F6] to-[#5B9CF9] text-white border-none mb-8 shadow-lg shadow-blue-500/30"
          data-testid="card-balance"
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 font-medium mb-1">총 보유 진로분석 학습권</p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-4xl font-bold"
                    data-testid="text-balance"
                  >
                    {totalBalance.toLocaleString()}
                  </span>
                  <span className="text-xl font-medium text-blue-100">번</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Coins className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex gap-6 pt-3 border-t border-white/20">
              <div>
                <p className="text-xs text-blue-100 mb-0.5">선물 학습권</p>
                <span
                  className="text-lg font-bold text-emerald-300"
                  data-testid="text-gift-points"
                >
                  {giftPoints.toLocaleString()}번
                </span>
              </div>
              <div>
                <p className="text-xs text-blue-100 mb-0.5">유료 학습권</p>
                <span
                  className="text-lg font-bold text-amber-300"
                  data-testid="text-paid-credits"
                >
                  {credits.toLocaleString()}번
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recharge Packages */}
        {!selectedPackage ? (
          <>
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
                  const hasBadge = pkg.description && pkg.description.trim() !== "";
                  const isHighlighted = hasBadge || pkg.bonusPoints > 0;
                  return (
                    <Card
                      key={pkg.id}
                      className={`toss-card cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${isHighlighted ? "border-[#3182F6] ring-1 ring-[#3182F6]" : ""}`}
                      onClick={() => handleSelectPackage(pkg)}
                      data-testid={`card-package-${pkg.id}`}
                    >
                      <CardContent className="p-5 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-bold text-[#191F28]">
                              {pkg.points.toLocaleString()} 학습권
                            </span>
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
                          <p className="text-[#8B95A1] text-sm">
                            AI 커리어 분석{" "}
                            {Math.floor((pkg.points + pkg.bonusPoints) / 100)}회
                            가능
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-[#333D4B]">
                            {formatPrice(pkg.price)}
                          </span>
                          <Button
                            className={`rounded-full h-10 px-5 font-bold ${isHighlighted ? "bg-[#3182F6] hover:bg-[#2b72d7]" : "bg-[#F2F4F6] text-[#3182F6] hover:bg-[#E5E8EB]"}`}
                            disabled={isProcessing}
                            data-testid={`button-buy-${pkg.id}`}
                          >
                            구매
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="mb-8" data-testid="payment-widget-section">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelSelection}
                className="rounded-full h-9 w-9 p-0"
                data-testid="button-back-to-packages"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-lg font-bold text-[#191F28]">결제하기</h3>
            </div>

            <Card className="toss-card mb-4">
              <CardContent className="p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-[#8B95A1] mb-1">선택한 패키지</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-[#191F28]">
                        {selectedPackage.points.toLocaleString()} 학습권
                      </span>
                      {selectedPackage.bonusPoints > 0 && (
                        <Badge className="bg-green-100 text-green-600 border-none hover:bg-green-100">
                          +{selectedPackage.bonusPoints.toLocaleString()} 보너스
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-[#3182F6]">
                    {formatPrice(selectedPackage.price)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {widgetLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#3182F6]" />
              </div>
            )}

            <div id="payment-method" className="mb-4" />
            <div id="agreement" className="mb-6" />

            {widgetReady && (
              <Button
                onClick={handleRequestPayment}
                disabled={isProcessing}
                className="w-full h-14 text-lg font-bold bg-[#3182F6] hover:bg-[#2b72d7] text-white rounded-2xl"
                data-testid="button-confirm-payment"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : null}
                {isProcessing ? "결제 처리 중..." : `${formatPrice(selectedPackage.price)} 결제하기`}
              </Button>
            )}
          </div>
        )}

        {/* Policy & Terms */}
        <Card className="bg-[#F9FAFB] border-[#E5E8EB] mb-8">
          <CardContent className="p-5 space-y-4">
            <div>
              <h4 className="font-bold text-[#333D4B] mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#8B95A1]" />
                환불(환급) 안내
              </h4>
              <ul className="text-sm text-[#6B7684] space-y-1.5 ml-6 list-disc">
                <li>
                  환불은 원칙적으로 결제에 사용된{" "}
                  <span className="font-bold text-[#333D4B]">
                    동일 결제수단(동일 카드/동일 계좌)
                  </span>
                  으로만 처리됩니다. 다른 결제수단 또는 제3자 계좌로는 환불이
                  불가합니다.
                </li>
                <li>
                  환불 가능 금액은 고객이 실제 결제한{" "}
                  <span className="font-bold text-[#333D4B]">
                    유상 학습권(구매 학습권) 잔액 범위
                  </span>
                  에 한합니다.
                </li>
                <li>
                  보너스 학습권(이벤트/프로모션 등 무상 제공 학습권)은
                  환불(환급) 대상이 아닙니다.
                </li>
                <li>환불규정은 소비자보호법에 따릅니다.</li>
              </ul>
            </div>
            <div className="border-t border-[#E5E8EB] pt-4">
              <h4 className="font-bold text-[#333D4B] mb-2 flex items-center gap-2">
                <Coins className="h-4 w-4 text-[#8B95A1]" />
                학습권 유효기간 안내
              </h4>
              <ul className="text-sm text-[#6B7684] space-y-2 ml-6 list-disc">
                <li>
                  <span className="font-bold text-[#333D4B]">
                    유상 학습권(구매 학습권)
                  </span>
                  : 구매일(충전일)로부터{" "}
                  <span className="font-bold text-[#3182F6]">1년간</span> 사용
                  가능합니다. 사용 가능 기간이 경과한 경우에도 관련 법령 및
                  약관에 따라 구매일(충전일)로부터 1년 이내에는 잔액 환급을
                  청구할 수 있습니다.
                </li>
                <li>
                  <span className="font-bold text-[#333D4B]">
                    무상 학습권(보너스/이벤트 학습권)
                  </span>
                  : 지급일로부터{" "}
                  <span className="font-bold text-[#FF6B6B]">90일간</span> 사용
                  가능하며, 기간 경과 시 자동 소멸됩니다.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <h3 className="text-lg font-bold text-[#191F28] mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-[#8B95A1]" /> 학습권 내역
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
                <p>학습권 내역이 없습니다</p>
              </div>
            ) : (
              transactions.map((tx: PointTransaction) => (
                <div
                  key={tx.id}
                  className="p-5 flex justify-between items-center hover:bg-[#F9FAFB] transition-colors"
                  data-testid={`row-transaction-${tx.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? "bg-green-50" : "bg-red-50"}`}
                    >
                      {getTransactionIcon(tx.type, tx.amount)}
                    </div>
                    <div>
                      <p className="font-bold text-[#333D4B]">
                        {tx.description || getTransactionLabel(tx.type)}
                      </p>
                      <p className="text-sm text-[#8B95A1]">
                        {tx.createdAt
                          ? format(new Date(tx.createdAt), "yyyy.MM.dd HH:mm")
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount.toLocaleString()} 번
                    </p>
                    <p className="text-sm text-[#8B95A1]">
                      잔액 {tx.balanceAfter.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
