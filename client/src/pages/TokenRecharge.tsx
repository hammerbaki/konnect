import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard, History, ChevronRight, CheckCircle2 } from "lucide-react";
import { useTokens } from "@/lib/TokenContext";
import { useToast } from "@/hooks/use-toast";

export default function TokenRecharge() {
    const { credits, addCredits } = useTokens();
    const { toast } = useToast();

    const handleRecharge = (amount: number, price: string) => {
        // Mock payment process
        toast({
            title: "결제 성공",
            description: `${amount} 토큰이 충전되었습니다.`,
        });
        addCredits(amount);
    };

    const packages = [
        { tokens: 10, price: "5,000원", bonus: 0, popular: false },
        { tokens: 50, price: "20,000원", bonus: 5, popular: true }, // 20% discount logic approx
        { tokens: 100, price: "35,000원", bonus: 15, popular: false },
        { tokens: 300, price: "99,000원", bonus: 50, popular: false },
    ];

    return (
        <Layout>
            <div className="max-w-2xl mx-auto pb-20">
                <h2 className="text-[28px] font-bold text-[#191F28] mb-6">토큰 충전</h2>

                {/* Current Balance */}
                <Card className="bg-[#3182F6] text-white border-none mb-8 shadow-lg shadow-blue-500/30">
                    <CardContent className="p-6 flex justify-between items-center">
                        <div>
                            <p className="text-blue-100 font-medium mb-1">현재 보유 토큰</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">{credits}</span>
                                <span className="text-xl font-medium text-blue-100">Tokens</span>
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
                    {packages.map((pkg, idx) => (
                        <Card 
                            key={idx} 
                            className={`toss-card cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${pkg.popular ? 'border-[#3182F6] ring-1 ring-[#3182F6]' : ''}`}
                            onClick={() => handleRecharge(pkg.tokens + pkg.bonus, pkg.price)}
                        >
                            <CardContent className="p-5 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xl font-bold text-[#191F28]">{pkg.tokens} 토큰</span>
                                        {pkg.bonus > 0 && (
                                            <Badge className="bg-green-100 text-green-600 border-none hover:bg-green-100">
                                                +{pkg.bonus} 보너스
                                            </Badge>
                                        )}
                                        {pkg.popular && (
                                            <Badge className="bg-[#3182F6] text-white border-none hover:bg-[#3182F6]">
                                                인기
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-[#8B95A1] text-sm">AI 커리어 분석 {Math.floor((pkg.tokens + pkg.bonus) / 2)}회 가능</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold text-[#333D4B]">{pkg.price}</span>
                                    <Button className={`rounded-full h-10 px-5 font-bold ${pkg.popular ? 'bg-[#3182F6] hover:bg-[#2b72d7]' : 'bg-[#F2F4F6] text-[#3182F6] hover:bg-[#E5E8EB]'}`}>
                                        구매
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Transaction History */}
                <h3 className="text-lg font-bold text-[#191F28] mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-[#8B95A1]" /> 최근 내역
                </h3>
                <Card className="toss-card divide-y divide-[#F2F4F6]">
                    <CardContent className="p-0">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-5 flex justify-between items-center hover:bg-[#F9FAFB] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-[#E8F3FF] flex items-center justify-center">
                                        <Coins className="h-5 w-5 text-[#3182F6]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#333D4B]">토큰 충전</p>
                                        <p className="text-sm text-[#8B95A1]">2024.05.{20-i}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-[#3182F6]">+50 Tokens</p>
                                    <p className="text-sm text-[#8B95A1]">20,000원</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
