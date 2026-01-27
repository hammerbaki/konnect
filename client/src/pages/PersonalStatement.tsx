import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getAuthHeaders } from "@/lib/queryClient";
import {
    Send,
    Sparkles,
    Bot,
    Copy,
    FileText,
    ChevronLeft,
    Quote,
    School,
    GraduationCap,
    Briefcase,
    ArrowRight,
    AlertCircle,
    History,
    Plus,
    MessageSquare,
    FolderOpen,
    Trash2,
    Loader2,
    User,
    Building2,
    Link2,
    Search,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAIJob } from "@/hooks/useAIJob";
import { useTokens } from "@/lib/TokenContext";
import type { Profile, PersonalEssay } from "@shared/schema";
import { Link } from "wouter";

const ESSAY_CREDIT_COST = 100;
const REVISION_CREDIT_COST = 30;

// Profile type mappings for categories
const profileTypeToCategoryId: Record<string, CategoryId> = {
    high: "high",
    university: "univ",
    general: "general",
};

// Field names to user-friendly Korean labels mapping
const FIELD_LABELS: Record<string, string> = {
    // High school fields
    high_hopeUniversity: "희망 대학",
    high_careerHope: "진로 희망",
    high_favoriteSubject: "좋아하는 과목",
    high_activityStatus: "활동 내역",
    high_dreamJob: "희망 직업",
    high_studyStyle: "학습 스타일",
    // University fields
    univ_majorName: "전공 (학과명)",
    univ_majorCategory: "전공 계열",
    univ_skillsToDevelop: "개발하고 싶은 스킬",
    univ_desiredIndustry: "희망 산업",
    univ_desiredRole: "희망 직무",
    univ_studyAndCareer: "학습 및 취업 준비",
    // General fields
    gen_desiredIndustry: "희망 산업 분야",
    gen_desiredRole: "희망 직무",
    gen_skills: "보유 핵심 스킬",
    gen_workExperience: "주요 경력 사항",
    gen_reasonForChange: "이직/구직 사유",
    gen_careerGoal: "커리어 목표",
};

// Minimum required fields for meaningful essay generation by profile type
const MINIMUM_REQUIRED_FIELDS: Record<string, { fields: string[]; description: string }> = {
    high: {
        fields: ["high_hopeUniversity", "high_careerHope"],
        description: "희망 대학과 진로 희망을 입력해야 자기소개서를 생성할 수 있습니다.",
    },
    university: {
        fields: ["univ_majorName", "univ_desiredIndustry"],
        description: "전공과 희망 산업을 입력해야 자기소개서를 생성할 수 있습니다.",
    },
    general: {
        fields: ["gen_desiredIndustry", "gen_desiredRole"],
        description: "희망 산업과 희망 직무를 입력해야 자기소개서를 생성할 수 있습니다.",
    },
};

// Validate if profile has minimum required fields for essay generation
function validateProfileForEssay(profileType: string, profileData: any): { 
    isValid: boolean; 
    missingFields: { key: string; label: string }[];
    message: string;
} {
    const requirements = MINIMUM_REQUIRED_FIELDS[profileType];
    if (!requirements) {
        return { isValid: true, missingFields: [], message: "" };
    }
    
    const missingFields: { key: string; label: string }[] = [];
    
    for (const field of requirements.fields) {
        const value = profileData?.[field];
        const isEmpty = value === undefined || value === null || value === "" || 
            (Array.isArray(value) && value.length === 0);
        
        if (isEmpty) {
            missingFields.push({
                key: field,
                label: FIELD_LABELS[field] || field,
            });
        }
    }
    
    return {
        isValid: missingFields.length === 0,
        missingFields,
        message: missingFields.length > 0 ? requirements.description : "",
    };
}

// Get Korean label for a field key
function getFieldLabel(fieldKey: string): string {
    return FIELD_LABELS[fieldKey] || fieldKey;
}

// --- Types ---
type CategoryId = "high" | "univ" | "general";
type AgentId = string;

interface Agent {
    id: AgentId;
    label: string;
    desc: string;
    promptTemplate: string;
    requiredFields: string[]; // Fields to check in MOCK_PROFILE_DB
}

interface Category {
    id: CategoryId;
    label: string;
    subLabel: string;
    icon: any;
    colorClass: string;
    agents: Agent[];
}

interface ChatSession {
    id: string;
    title: string;
    categoryId: CategoryId;
    agentId: AgentId;
    lastModified: Date;
    messages: any[]; // Using any[] for simplicity in mockup
}

// --- Configuration ---
const CATEGORIES: Category[] = [
    {
        id: "high",
        label: "고등학생 (대입)",
        subLabel: "생활기록부 기반 대입 자소서",
        icon: School,
        colorClass:
            "text-pink-500 bg-pink-50 border-pink-100 hover:border-pink-300 hover:bg-pink-100",
        agents: [
            {
                id: "high_motive",
                label: "대입 지원동기",
                desc: "희망 대학/학과에 지원하게 된 구체적인 계기 작성",
                promptTemplate:
                    "학생의 희망 대학({high_hopeUniversity})과 진로 희망({high_careerHope})을 연결하여 지원 동기를 작성해줘.",
                requiredFields: ["high_hopeUniversity", "high_careerHope"],
            },
            {
                id: "high_growth",
                label: "학업 기울인 노력",
                desc: "학업 역량을 키우기 위해 노력한 과정 서술",
                promptTemplate:
                    "가장 좋아했던 과목({high_favoriteSubject})과 관련하여 학업에 기울인 노력을 구체적으로 서술해줘.",
                requiredFields: ["high_favoriteSubject"],
            },
            {
                id: "high_activity",
                label: "의미 있는 교내 활동",
                desc: "동아리, 봉사 등 학교 생활 중 가장 의미 있었던 활동",
                promptTemplate:
                    "다음 활동 내역을 바탕으로 배우고 느낀 점을 중심으로 작성해줘: {high_activityStatus}",
                requiredFields: ["high_activityStatus"],
            },
        ],
    },
    {
        id: "univ",
        label: "대학생 (취업/인턴)",
        subLabel: "인턴, 신입 채용 맞춤형 자소서",
        icon: GraduationCap,
        colorClass:
            "text-blue-500 bg-blue-50 border-blue-100 hover:border-blue-300 hover:bg-blue-100",
        agents: [
            {
                id: "univ_growth",
                label: "성장과정",
                desc: "가치관이 형성된 계기와 성장 배경 작성",
                promptTemplate:
                    "대학 생활 중 성장하게 된 계기와 가치관을 중심으로 작성해줘.",
                requiredFields: ["univ_majorName"],
            },
            {
                id: "univ_competence",
                label: "직무 핵심 역량",
                desc: "지원 직무에 필요한 핵심 역량과 강점 어필",
                promptTemplate:
                    "보유한 스킬({univ_skillsToDevelop})을 활용하여 직무 역량을 강조하는 내용을 작성해줘.",
                requiredFields: ["univ_skillsToDevelop"],
            },
            {
                id: "univ_motive",
                label: "지원동기 및 포부",
                desc: "회사 선택 기준과 입사 후 목표",
                promptTemplate:
                    "전공({univ_majorName})과 연관지어 지원 동기와 입사 후 포부를 작성해줘.",
                requiredFields: ["univ_majorName"],
            },
        ],
    },
    {
        id: "general",
        label: "일반 구직자 (경력)",
        subLabel: "이직, 경력 기술서 및 경험 정리",
        icon: Briefcase,
        colorClass:
            "text-green-500 bg-green-50 border-green-100 hover:border-green-300 hover:bg-green-100",
        agents: [
            {
                id: "gen_change",
                label: "이직/구직 사유",
                desc: "이직을 결심한 이유와 새로운 도전에 대한 설명",
                promptTemplate:
                    "현재 이직 사유({gen_reasonForChange})를 긍정적인 방향(성장, 도전)으로 풀어내어 작성해줘.",
                requiredFields: ["gen_reasonForChange"],
            },
            {
                id: "gen_exp",
                label: "경력 기술 (핵심 성과)",
                desc: "주요 경력 사항과 성과를 STAR 기법으로 정리",
                promptTemplate:
                    "다음 경력 사항을 바탕으로 핵심 성과 위주로 기술해줘: {gen_workExperience}",
                requiredFields: ["gen_workExperience"],
            },
            {
                id: "gen_fit",
                label: "직무 적합성 & 비전",
                desc: "보유 경험이 희망 직무에 어떻게 기여할 수 있는지",
                promptTemplate:
                    "희망 산업({gen_desiredIndustry})의 {gen_desiredRole}로서 기여할 수 있는 점을 보유 스킬({gen_skills})과 연결하여 작성해줘.",
                requiredFields: [
                    "gen_desiredIndustry",
                    "gen_desiredRole",
                    "gen_skills",
                ],
            },
        ],
    },
];

// Convert essay to chat session for display
function essayToSession(essay: PersonalEssay): ChatSession {
    return {
        id: essay.id,
        title: essay.title || `${essay.topic} 자소서`,
        categoryId: (essay.category as CategoryId) || "general",
        agentId: "",
        lastModified: essay.createdAt ? new Date(essay.createdAt) : new Date(),
        messages: [
            {
                id: `${essay.id}-draft`,
                sender: "ai",
                type: "draft",
                content: essay.content || "",
                topic: essay.topic,
                version: essay.draftVersion || 1,
                timestamp: essay.createdAt ? new Date(essay.createdAt) : new Date(),
            },
        ],
    };
}

export default function PersonalStatement() {
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const { deductCredit, restoreCredits, refreshCredits } = useTokens();

    // API Queries
    const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery<Profile[]>({
        queryKey: ["/api/profiles"],
        staleTime: 5 * 60 * 1000, // 5 minutes - reduce API load
    });

    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

    // Get eligible profiles (high, university, general only - essay categories)
    const eligibleProfiles = profiles.filter(p => 
        ["high", "university", "general"].includes(p.type)
    );

    // Set initial active profile
    useEffect(() => {
        if (eligibleProfiles.length > 0 && !activeProfileId) {
            setActiveProfileId(eligibleProfiles[0].id);
        }
    }, [eligibleProfiles, activeProfileId]);

    const activeProfile = profiles.find(p => p.id === activeProfileId);

    // Fetch essays for active profile
    const { data: essays = [], isLoading: isLoadingEssays } = useQuery<PersonalEssay[]>({
        queryKey: ["/api/profiles", activeProfileId, "essays"],
        queryFn: async () => {
            if (!activeProfileId) return [];
            const res = await apiRequest("GET", `/api/profiles/${activeProfileId}/essays`);
            return res.json();
        },
        enabled: !!activeProfileId,
    });

    // Track optimistic credit deductions for safe restoration
    const essayCreditsDeductedRef = useRef(false);
    const revisionCreditsDeductedRef = useRef(false);

    // AI Job integration for essay generation
    const aiJob = useAIJob({
        onSuccess: async (result: any, jobId: string) => {
            essayCreditsDeductedRef.current = false; // Clear flag on success
            // Save the completed essay to database
            try {
                const res = await apiRequest("POST", `/api/ai/jobs/${jobId}/complete-essay`);
                if (res.ok) {
                    const savedEssay = await res.json();
                    queryClient.invalidateQueries({ queryKey: ["/api/profiles", activeProfileId, "essays"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                    
                    // Update current session with saved essay
                    if (savedEssay) {
                        const newSession = essayToSession(savedEssay);
                        setMessages(newSession.messages);
                        setCurrentSessionId(savedEssay.id);
                    }
                    
                    toast({ description: "자기소개서가 생성되었습니다!" });
                }
            } catch (error) {
                console.error("Failed to save essay:", error);
                toast({ variant: "destructive", description: "저장 중 오류가 발생했습니다." });
            }
        },
        onError: (error: string) => {
            // Only restore if we actually deducted
            if (essayCreditsDeductedRef.current) {
                restoreCredits(ESSAY_CREDIT_COST);
                essayCreditsDeductedRef.current = false;
            }
            toast({ variant: "destructive", description: error || "생성 중 오류가 발생했습니다." });
        },
    });

    // AI Job integration for essay revision (30 credits)
    // Note: We use a ref (currentSessionRef defined below) to track the current session for the callback
    const revisionJob = useAIJob({
        onSuccess: async (result: any, jobId: string) => {
            revisionCreditsDeductedRef.current = false; // Clear flag on success
            try {
                const res = await apiRequest("POST", `/api/ai/jobs/${jobId}/complete-essay-revision`);
                if (res.ok) {
                    const updatedEssay = await res.json();
                    queryClient.invalidateQueries({ queryKey: ["/api/profiles", activeProfileId, "essays"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                    
                    // Update messages if user is still viewing this essay
                    if (updatedEssay && updatedEssay.id === currentSessionRef.current) {
                        setMessages(prev => [
                            ...prev,
                            {
                                id: `${updatedEssay.id}-revised-${Date.now()}`,
                                sender: "ai",
                                type: "draft",
                                content: updatedEssay.content || "",
                                topic: updatedEssay.topic,
                                version: updatedEssay.draftVersion || 1,
                                timestamp: new Date(),
                            }
                        ]);
                    }
                    
                    toast({ description: "자기소개서가 수정되었습니다! (30 포인트 사용)" });
                }
            } catch (error) {
                console.error("Failed to save revised essay:", error);
                toast({ variant: "destructive", description: "수정 저장 중 오류가 발생했습니다." });
            }
        },
        onError: (error: string) => {
            // Only restore if we actually deducted
            if (revisionCreditsDeductedRef.current) {
                restoreCredits(REVISION_CREDIT_COST);
                revisionCreditsDeductedRef.current = false;
            }
            toast({ variant: "destructive", description: error || "수정 중 오류가 발생했습니다." });
        },
    });

    // Convert essays to history sessions
    const history: ChatSession[] = essays.map(essayToSession);

    // State
    const [step, setStep] = useState<"category" | "agent" | "chat">("category");
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
        null,
    );
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(
        null,
    );

    // Ref to track current session ID for revision callback (avoids stale closure)
    const currentSessionRef = useRef<string | null>(null);
    useEffect(() => {
        currentSessionRef.current = currentSessionId;
    }, [currentSessionId]);

    // History sidebar state
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Target company/school info state
    const [targetName, setTargetName] = useState("");
    const [targetUrl, setTargetUrl] = useState("");
    const [targetPosition, setTargetPosition] = useState("");
    const [isFetchingCompanyInfo, setIsFetchingCompanyInfo] = useState(false);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [companyFetchError, setCompanyFetchError] = useState<string | null>(null);
    // Target info section is always visible (mandatory)

    // Chat State
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    
    // Use aiJob.isLoading or revisionJob.isLoading for generation state
    const isGenerating = aiJob.isLoading || revisionJob.isLoading;
    const isRevising = revisionJob.isLoading;

    // --- Handlers ---

    const handleNewChat = () => {
        setStep("category");
        setSelectedCategory(null);
        setSelectedAgent(null);
        setCurrentSessionId(null);
        setMessages([]);
        setIsHistoryOpen(false);
        // Reset target info
        setTargetName("");
        setTargetUrl("");
        setTargetPosition("");
        setCompanyInfo(null);
        setCompanyFetchError(null);
        aiJob.reset();
        revisionJob.reset();
    };

    // Fetch company info from URL
    const handleFetchCompanyInfo = async () => {
        if (!targetUrl.trim()) {
            setCompanyFetchError("URL을 입력해주세요.");
            return;
        }
        
        setIsFetchingCompanyInfo(true);
        setCompanyFetchError(null);
        setCompanyInfo(null);
        
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch("/api/fetch-company-info", {
                method: "POST",
                headers: {
                    ...authHeaders,
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ url: targetUrl }),
            });
            
            const data = await res.json();
            
            if (!res.ok || !data.success) {
                setCompanyFetchError(data.message || "정보를 가져올 수 없습니다.");
                return;
            }
            
            setCompanyInfo(data.info);
            // Auto-fill company name if found
            if (data.info?.name && !targetName.trim()) {
                setTargetName(data.info.name);
            }
            
            toast({ description: "기관 정보를 성공적으로 가져왔습니다!" });
        } catch (error: any) {
            console.error("Error fetching company info:", error);
            setCompanyFetchError("웹페이지 분석 중 오류가 발생했습니다.");
        } finally {
            setIsFetchingCompanyInfo(false);
        }
    };

    const handleLoadSession = (session: ChatSession) => {
        // Reset any pending revision job when switching sessions
        revisionJob.reset();

        const category = CATEGORIES.find((c) => c.id === session.categoryId);

        if (category) {
            setSelectedCategory(category);
            setSelectedAgent(null);
            setMessages(session.messages);
            setCurrentSessionId(session.id);
            setStep("chat");
            setIsHistoryOpen(false);
        } else {
            // Load without category match
            setMessages(session.messages);
            setCurrentSessionId(session.id);
            setStep("chat");
            setIsHistoryOpen(false);
        }
    };

    // Track which essay is being deleted for spinner display
    const [deletingEssayId, setDeletingEssayId] = useState<string | null>(null);

    // Delete essay from database with optimistic UI update
    const deleteEssayMutation = useMutation({
        mutationFn: async (essayId: string) => {
            const res = await apiRequest("DELETE", `/api/essays/${essayId}`);
            if (!res.ok) throw new Error("삭제 실패");
        },
        onMutate: async (essayId: string) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["/api/profiles", activeProfileId, "essays"] });
            
            // Snapshot previous value for rollback
            const previousEssays = queryClient.getQueryData(["/api/profiles", activeProfileId, "essays"]);
            
            // Optimistically remove from cache immediately
            queryClient.setQueryData(
                ["/api/profiles", activeProfileId, "essays"],
                (old: any[] | undefined) => old?.filter(e => e.id !== essayId) ?? []
            );
            
            toast({ description: "기록이 삭제되었습니다." });
            setDeletingEssayId(null);
            
            return { previousEssays };
        },
        onError: (_err, _essayId, context) => {
            // Rollback on error
            if (context?.previousEssays) {
                queryClient.setQueryData(
                    ["/api/profiles", activeProfileId, "essays"],
                    context.previousEssays
                );
            }
            toast({ variant: "destructive", description: "삭제 중 오류가 발생했습니다. 다시 시도해주세요." });
        },
        onSettled: () => {
            // Sync with server data
            queryClient.invalidateQueries({ queryKey: ["/api/profiles", activeProfileId, "essays"] });
        },
    });

    const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (deletingEssayId) return; // Prevent double-click
        setDeletingEssayId(sessionId);
        deleteEssayMutation.mutate(sessionId);
        if (currentSessionId === sessionId) {
            handleNewChat();
        }
    };

    const handleCategorySelect = (category: Category) => {
        setSelectedCategory(category);
        setStep("agent");
    };

    const handleAgentSelect = async (agent: Agent) => {
        if (!selectedCategory || !activeProfileId || !activeProfile) {
            toast({ variant: "destructive", description: "프로필을 먼저 선택해주세요." });
            return;
        }

        // Validate profile has minimum required fields
        const profileValidation = validateProfileForEssay(activeProfile.type, activeProfile.profileData);
        if (!profileValidation.isValid) {
            toast({ 
                variant: "destructive", 
                title: "프로필 정보 부족",
                description: `다음 필드를 먼저 입력해주세요: ${profileValidation.missingFields.map(f => f.label).join(", ")}` 
            });
            return;
        }

        // Validate target company/school name (mandatory)
        if (!targetName.trim()) {
            toast({ 
                variant: "destructive", 
                title: "지원 대상 정보 필요",
                description: "자기소개서 생성을 위해 지원하는 회사/학교명을 입력해주세요." 
            });
            return;
        }

        // Initialize session
        setSelectedAgent(agent);
        setStep("chat");
        setCurrentSessionId(null);

        // Build target info message
        const targetInfoText = `\n\n🎯 지원 대상: ${targetName}${targetPosition ? ` (${targetPosition})` : ""}${companyInfo ? "\n✅ 기관 정보 분석 완료" : ""}`;

        const initialMsg = {
            id: "system-welcome",
            sender: "ai",
            type: "text",
            content: `안녕하세요! [${selectedCategory.label}] - [${agent.label}] 에이전트입니다.\n\n프로필 정보를 바탕으로 자기소개서 초안 작성을 시작합니다.${targetInfoText}`,
            timestamp: new Date(),
        };

        setMessages([initialMsg]);

        // Optimistically deduct credits immediately (100 credits for essay)
        const deducted = deductCredit(ESSAY_CREDIT_COST);
        if (!deducted) {
            toast({ variant: "destructive", description: "포인트이 부족합니다. 자소서 생성에 100 포인트이 필요합니다." });
            return;
        }
        essayCreditsDeductedRef.current = true; // Track deduction for safe restoration

        // Build target info for AI (always include since targetName is now mandatory)
        const targetInfoPayload = {
            targetName: targetName.trim(),
            targetUrl: targetUrl.trim() || undefined,
            targetPosition: targetPosition.trim() || undefined,
            companyInfo: companyInfo || undefined,
        };

        // Submit job to queue for AI generation
        try {
            await aiJob.submitJob("essay", activeProfileId, {
                profileType: activeProfile.type,
                category: selectedCategory.id,
                topic: agent.label,
                context: agent.promptTemplate,
                profileData: activeProfile.profileData,
                targetInfo: targetInfoPayload,
            });
        } catch (error) {
            console.error("Failed to submit essay job:", error);
            // onError in useAIJob will handle restoring credits using the ref flag
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        if (!currentSessionId) {
            toast({ variant: "destructive", description: "수정할 자기소개서가 없습니다. 먼저 자소서를 생성해주세요." });
            return;
        }
        if (revisionJob.isLoading) {
            toast({ description: "수정 중입니다. 잠시만 기다려주세요." });
            return;
        }

        // Get the LATEST essay content from messages (most recent draft)
        const draftMessages = messages.filter(m => m.type === "draft");
        const draftMessage = draftMessages[draftMessages.length - 1];
        if (!draftMessage) {
            toast({ variant: "destructive", description: "수정할 자소서 내용을 찾을 수 없습니다." });
            return;
        }

        // Add user message to chat
        const userMsg = {
            id: Date.now().toString(),
            sender: "user",
            type: "text",
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        const revisionRequest = input;
        setInput("");

        // Optimistically deduct credits immediately (30 credits for revision)
        const deducted = deductCredit(REVISION_CREDIT_COST);
        if (!deducted) {
            toast({ variant: "destructive", description: "포인트이 부족합니다. 수정을 위해 30 포인트이 필요합니다." });
            return;
        }
        revisionCreditsDeductedRef.current = true; // Track deduction for safe restoration

        // Submit essay_revision job
        try {
            await revisionJob.submitJob("essay_revision", activeProfileId, {
                essayId: currentSessionId,
                originalTitle: draftMessage.topic || "자기소개서",
                originalContent: draftMessage.content,
                revisionRequest: revisionRequest,
            });
        } catch (error: any) {
            console.error("Failed to submit revision job:", error);
            // onError in useAIJob will handle restoring credits using the ref flag
        }
    };

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isGenerating]);

    // --- Render History List Component ---
    const HistoryList = () => (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-[#E5E8EB]">
                <Button
                    onClick={handleNewChat}
                    className="w-full justify-start gap-2 bg-[#3182F6] hover:bg-[#2b72d7] text-white"
                >
                    <Plus className="h-4 w-4" />새 자소서 작성
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {history.length === 0 ? (
                    <div className="text-center py-10 text-[#8B95A1] text-sm">
                        작성된 기록이 없습니다.
                    </div>
                ) : (
                    history.map((session) => (
                        <div
                            key={session.id}
                            onClick={() => handleLoadSession(session)}
                            className={cn(
                                "group flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer hover:bg-[#F2F4F6]",
                                currentSessionId === session.id
                                    ? "bg-[#E8F3FF] text-[#3182F6]"
                                    : "text-[#4E5968]",
                            )}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <MessageSquare
                                    className={cn(
                                        "h-4 w-4 shrink-0",
                                        currentSessionId === session.id
                                            ? "text-[#3182F6]"
                                            : "text-[#B0B8C1]",
                                    )}
                                />
                                <div className="truncate">
                                    <p className="text-sm font-bold truncate">
                                        {session.title}
                                    </p>
                                    <p className="text-[11px] opacity-70 truncate">
                                        {new Date(
                                            session.lastModified,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[#B0B8C1] hover:text-[#FF5252] hover:bg-red-50 disabled:opacity-100"
                                onClick={(e) =>
                                    handleDeleteSession(e, session.id)
                                }
                                disabled={deletingEssayId === session.id}
                            >
                                {deletingEssayId === session.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Trash2 className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // Loading state
    if (isLoadingProfiles) {
        return (
            <>
                <div className="max-w-6xl mx-auto h-[calc(100vh-40px)] md:h-[calc(100vh-80px)] flex md:rounded-2xl md:shadow-sm md:border border-[#E5E8EB] overflow-hidden bg-white">
                    <div className="hidden md:flex w-[260px] border-r border-[#E5E8EB] bg-white flex-col">
                        <div className="p-4 border-b border-[#E5E8EB] flex items-center gap-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <div className="p-3 space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-3 rounded-xl border border-[#E5E8EB]">
                                    <Skeleton className="h-4 w-3/4 mb-2" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                        <div className="px-6 py-4 border-b border-[#F2F4F6]">
                            <Skeleton className="h-8 w-48" />
                        </div>
                        <div className="flex-1 p-6 space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <Skeleton className="h-6 w-24 mt-4" />
                            <Skeleton className="h-48 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // No eligible profiles state
    if (eligibleProfiles.length === 0) {
        return (
            <>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
                    <User className="h-16 w-16 text-[#B0B8C1]" />
                    <h3 className="text-lg font-bold text-[#191F28]">자기소개서 작성을 위한 프로필이 필요합니다</h3>
                    <p className="text-sm text-[#8B95A1] text-center max-w-md">
                        고등학생, 대학생, 또는 일반 구직자 프로필을 먼저 만들어주세요.
                    </p>
                    <Link href="/profile">
                        <Button className="bg-[#3182F6]">
                            <Plus className="h-4 w-4 mr-2" /> 프로필 만들기
                        </Button>
                    </Link>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="max-w-6xl mx-auto h-[calc(100vh-40px)] md:h-[calc(100vh-80px)] flex md:rounded-2xl md:shadow-sm md:border border-[#E5E8EB] overflow-hidden bg-white relative">
                {/* Desktop Sidebar */}
                <div className="hidden md:flex w-[260px] border-r border-[#E5E8EB] bg-white flex-col">
                    <div className="p-4 border-b border-[#E5E8EB] flex items-center gap-2 text-[#191F28] font-bold">
                        <History className="h-4 w-4 text-[#8B95A1]" />
                        작성 기록
                    </div>
                    <HistoryList />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col h-full relative">
                    {/* Header */}
                    <div className="flex items-center px-4 md:px-6 py-4 border-b border-[#F2F4F6] bg-white z-10 min-h-[68px] justify-between">
                        <div className="flex items-center gap-2">
                            {/* Mobile Menu Trigger */}
                            <Sheet
                                open={isHistoryOpen}
                                onOpenChange={setIsHistoryOpen}
                            >
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden -ml-2"
                                    >
                                        <FolderOpen className="h-5 w-5 text-[#4E5968]" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="left"
                                    className="w-[280px] p-0"
                                >
                                    <div className="p-4 border-b border-[#E5E8EB] flex items-center gap-2 text-[#191F28] font-bold">
                                        <History className="h-4 w-4 text-[#8B95A1]" />
                                        작성 기록
                                    </div>
                                    <HistoryList />
                                </SheetContent>
                            </Sheet>
                            <div>
                                <h2 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-[#3182F6]" />
                                    AI 자소서 코치
                                </h2>
                                {selectedCategory && (
                                    <p className="text-xs text-[#8B95A1] font-medium mt-0.5 hidden md:block">
                                        {selectedCategory.label}{" "}
                                        {selectedAgent &&
                                            `> ${selectedAgent.label}`}
                                    </p>
                                )}
                            </div>
                        </div>
                        {selectedAgent && (
                            <Badge
                                variant="outline"
                                className="text-[#3182F6] bg-blue-50 border-blue-100 hidden md:flex"
                            >
                                {selectedAgent.label} 작성 중
                            </Badge>
                        )}
                    </div>

                    {/* Content Area */}
                    <div
                        className="flex-1 overflow-y-auto bg-[#F9FAFB] p-4 md:p-8 relative"
                        ref={scrollRef}
                    >
                        {/* STEP 1: Category Selection */}
                        {step === "category" && (
                            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center space-y-2 mb-8 pt-10">
                                    <h3 className="text-2xl font-bold text-[#191F28]">
                                        어떤 자소서를 작성하시나요?
                                    </h3>
                                    <p className="text-[#8B95A1]">
                                        작성하려는 목적에 맞는 AI 에이전트를
                                        선택해주세요.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    {CATEGORIES.map((cat) => {
                                        const Icon = cat.icon;
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() =>
                                                    handleCategorySelect(cat)
                                                }
                                                className={`
                                                    flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg bg-white
                                                    ${cat.colorClass}
                                                `}
                                            >
                                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                                                    <Icon className="h-8 w-8" />
                                                </div>
                                                <h4 className="text-lg font-bold text-[#191F28] mb-1">
                                                    {cat.label}
                                                </h4>
                                                <p className="text-xs text-[#8B95A1]">
                                                    {cat.subLabel}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Agent Selection */}
                        {step === "agent" && selectedCategory && (
                            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-2 mb-6">
                                    <Badge className="bg-[#191F28] text-white hover:bg-[#191F28]">
                                        {selectedCategory.label}
                                    </Badge>
                                    <span className="text-[#8B95A1] text-sm">
                                        전문 에이전트 선택
                                    </span>
                                </div>

                                {/* Profile Validation Warning */}
                                {activeProfile && (() => {
                                    const validation = validateProfileForEssay(activeProfile.type, activeProfile.profileData);
                                    if (!validation.isValid) {
                                        return (
                                            <Alert className="bg-amber-50 border-amber-200">
                                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                                <AlertTitle className="text-amber-800">프로필 정보가 부족합니다</AlertTitle>
                                                <AlertDescription className="text-amber-700">
                                                    <p className="mb-2">{validation.message}</p>
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {validation.missingFields.map((field) => (
                                                            <span key={field.key} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                                                                {field.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <Link href="/profile">
                                                        <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                                                            프로필 작성하기
                                                        </Button>
                                                    </Link>
                                                </AlertDescription>
                                            </Alert>
                                        );
                                    }
                                    return null;
                                })()}

                                {/* Target Company/School Info Section - MANDATORY */}
                                <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-[#3182F6] overflow-hidden shadow-sm">
                                    <div className="p-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-lg bg-[#3182F6]">
                                                <Building2 className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#191F28] flex items-center gap-2">
                                                    지원 대상 정보 입력
                                                    <Badge className="text-xs bg-red-500 text-white border-none">
                                                        필수
                                                    </Badge>
                                                </h4>
                                                <p className="text-xs text-[#4E5968] mt-0.5">
                                                    지원하는 회사/학교 정보를 입력해야 자기소개서를 생성할 수 있습니다
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="targetName" className="text-sm font-medium text-[#4E5968]">
                                                        회사/학교명 <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="targetName"
                                                        placeholder="예: 삼성전자, 서울대학교"
                                                        value={targetName}
                                                        onChange={(e) => setTargetName(e.target.value)}
                                                        className={cn(
                                                            "border-[#E5E8EB] focus:border-[#3182F6]",
                                                            !targetName.trim() && "border-red-200 bg-red-50/30"
                                                        )}
                                                        data-testid="input-target-name"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="targetPosition" className="text-sm font-medium text-[#4E5968]">
                                                        지원 직무/학과
                                                    </Label>
                                                    <Input
                                                        id="targetPosition"
                                                        placeholder="예: 소프트웨어 개발, 경영학과"
                                                        value={targetPosition}
                                                        onChange={(e) => setTargetPosition(e.target.value)}
                                                        className="border-[#E5E8EB] focus:border-[#3182F6]"
                                                        data-testid="input-target-position"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2 opacity-80">
                                                <Label htmlFor="targetUrl" className="text-sm font-medium text-[#8B95A1]">
                                                    회사/학교 웹사이트 URL <span className="text-[#B0B8C1]">(선택사항 - 입력 안해도 됨)</span>
                                                </Label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0B8C1]" />
                                                        <Input
                                                            id="targetUrl"
                                                            placeholder="https://company.com/about"
                                                            value={targetUrl}
                                                            onChange={(e) => {
                                                                setTargetUrl(e.target.value);
                                                                setCompanyFetchError(null);
                                                            }}
                                                            className="pl-9 border-[#E5E8EB] focus:border-[#3182F6] bg-gray-50/50"
                                                            data-testid="input-target-url"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={handleFetchCompanyInfo}
                                                        disabled={isFetchingCompanyInfo || !targetUrl.trim()}
                                                        variant="outline"
                                                        className="shrink-0 border-[#E5E8EB]"
                                                        data-testid="button-fetch-company-info"
                                                    >
                                                        {isFetchingCompanyInfo ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Search className="h-4 w-4" />
                                                        )}
                                                        <span className="ml-2 hidden md:inline">분석</span>
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-[#B0B8C1]">
                                                    URL을 입력하면 AI가 기관 정보를 추가 분석합니다 (선택사항)
                                                </p>
                                            </div>

                                            {companyFetchError && (
                                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                                                    <XCircle className="h-4 w-4 shrink-0" />
                                                    {companyFetchError}
                                                </div>
                                            )}

                                            {companyInfo && (
                                                <div className="p-4 bg-green-50 border border-green-100 rounded-lg space-y-2">
                                                    <div className="flex items-center gap-2 text-green-700 font-medium">
                                                        <CheckCircle className="h-4 w-4" />
                                                        기관 정보 분석 완료
                                                    </div>
                                                    {companyInfo.name && (
                                                        <p className="text-sm text-green-600">
                                                            <span className="font-medium">기관명:</span> {companyInfo.name}
                                                        </p>
                                                    )}
                                                    {companyInfo.description && (
                                                        <p className="text-sm text-green-600 line-clamp-2">
                                                            <span className="font-medium">소개:</span> {companyInfo.description}
                                                        </p>
                                                    )}
                                                    {companyInfo.values && companyInfo.values.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {companyInfo.values.slice(0, 4).map((value: string, i: number) => (
                                                                <span key={i} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                                    {value}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {companyInfo.industryKeywords && companyInfo.industryKeywords.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {companyInfo.industryKeywords.slice(0, 6).map((kw: string, i: number) => (
                                                                <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                                                                    #{kw}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>

                                <div className="grid gap-4">
                                    {selectedCategory.agents.map((agent) => (
                                        <div
                                            key={agent.id}
                                            onClick={() =>
                                                handleAgentSelect(agent)
                                            }
                                            className="group bg-white p-5 rounded-2xl border border-[#E5E8EB] hover:border-[#3182F6] hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-xl bg-[#F2F4F6] group-hover:bg-blue-50 transition-colors">
                                                    <Bot className="h-6 w-6 text-[#8B95A1] group-hover:text-[#3182F6]" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-[#191F28] text-lg group-hover:text-[#3182F6] transition-colors">
                                                        {agent.label}
                                                    </h4>
                                                    <p className="text-[#8B95A1] text-sm mt-1">
                                                        {agent.desc}
                                                    </p>

                                                    {/* Required Fields Tag - using Korean labels */}
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {agent.requiredFields.map(
                                                            (field) => (
                                                                <span
                                                                    key={field}
                                                                    className="text-[10px] px-2 py-1 rounded-md bg-[#F9FAFB] text-[#8B95A1] border border-[#E5E8EB]"
                                                                >
                                                                    필요:{" "}
                                                                    {getFieldLabel(field)}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-[#E5E8EB] group-hover:text-[#3182F6] transition-colors" />
                                        </div>
                                    ))}
                                </div>

                                <Alert className="bg-blue-50 border-blue-100 text-[#3182F6]">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Tip</AlertTitle>
                                    <AlertDescription>
                                        각 에이전트는 프로필에 저장된 데이터를
                                        기반으로 글을 작성합니다.
                                        <br />
                                        프로필 정보가 부족할 경우 이용이 제한될
                                        수 있습니다.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}

                        {/* STEP 3: Chat Interface */}
                        {step === "chat" && (
                            <div className="space-y-6 pb-20 max-w-4xl mx-auto">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2",
                                            msg.sender === "user"
                                                ? "justify-end"
                                                : "justify-start",
                                        )}
                                    >
                                        {msg.sender === "ai" && (
                                            <Avatar className="h-8 w-8 mt-1 shadow-sm border border-white shrink-0">
                                                <div className="bg-gradient-to-br from-[#3182F6] to-[#1B64DA] w-full h-full flex items-center justify-center">
                                                    <Bot className="h-5 w-5 text-white" />
                                                </div>
                                            </Avatar>
                                        )}
                                        <div
                                            className={cn(
                                                "flex flex-col gap-1 max-w-[85%] md:max-w-[80%]",
                                                msg.sender === "user"
                                                    ? "items-end"
                                                    : "items-start",
                                            )}
                                        >
                                            {msg.type === "text" ? (
                                                <div
                                                    className={cn(
                                                        "px-4 py-3 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm",
                                                        msg.sender === "user"
                                                            ? "bg-[#3182F6] text-white rounded-tr-none"
                                                            : "bg-white text-[#333D4B] border border-[#E5E8EB] rounded-tl-none",
                                                    )}
                                                >
                                                    {msg.content}
                                                </div>
                                            ) : (
                                                <div className="w-full min-w-[280px] md:min-w-[500px]">
                                                    <div className="flex items-center justify-between mb-2 px-1">
                                                        <span className="text-xs font-bold text-[#3182F6] flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
                                                            <FileText className="h-3 w-3" />
                                                            {msg.topic} Ver.
                                                            {msg.version}
                                                        </span>
                                                        <span className="text-[11px] text-[#8B95A1]">
                                                            {new Date(
                                                                msg.timestamp,
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                    <Card className="border-[#E5E8EB] shadow-sm overflow-hidden bg-white">
                                                        <CardContent className="p-6 bg-white relative">
                                                            <Quote className="absolute top-4 left-4 h-8 w-8 text-gray-100 -z-10" />
                                                            <div className="text-[15px] leading-[1.9] text-[#191F28] whitespace-pre-wrap font-normal">
                                                                {msg.content}
                                                            </div>
                                                        </CardContent>
                                                        <div className="bg-[#F9FAFB] px-4 py-3 border-t border-[#F2F4F6] flex justify-between items-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 text-xs text-[#4E5968] hover:bg-white hover:text-[#3182F6]"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(
                                                                        msg.content,
                                                                    );
                                                                    toast({
                                                                        description:
                                                                            "복사되었습니다.",
                                                                    });
                                                                }}
                                                            >
                                                                <Copy className="h-3.5 w-3.5 mr-1.5" />{" "}
                                                                복사
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* ChatGPT-like Thinking Animation */}
                                {isGenerating && (
                                    <div className="flex w-full gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <Avatar className="h-9 w-9 mt-0.5 shadow-sm ring-2 ring-white">
                                            <div className="bg-gradient-to-br from-[#3182F6] to-[#1e6cd6] w-full h-full flex items-center justify-center">
                                                <Bot className="h-5 w-5 text-white" />
                                            </div>
                                        </Avatar>
                                        <div className="flex flex-col gap-1 max-w-[85%]">
                                            <span className="text-xs font-medium text-[#4E5968]">AI 어시스턴트</span>
                                            <div className="bg-white border border-[#E5E8EB] px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <span 
                                                            className="w-2 h-2 bg-[#3182F6] rounded-full"
                                                            style={{
                                                                animation: 'thinking-pulse 1.4s ease-in-out infinite',
                                                                animationDelay: '0s'
                                                            }}
                                                        />
                                                        <span 
                                                            className="w-2 h-2 bg-[#3182F6] rounded-full"
                                                            style={{
                                                                animation: 'thinking-pulse 1.4s ease-in-out infinite',
                                                                animationDelay: '0.2s'
                                                            }}
                                                        />
                                                        <span 
                                                            className="w-2 h-2 bg-[#3182F6] rounded-full"
                                                            style={{
                                                                animation: 'thinking-pulse 1.4s ease-in-out infinite',
                                                                animationDelay: '0.4s'
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-[#4E5968] ml-1">
                                                        {isRevising ? "수정하고 있어요" : "작성하고 있어요"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <style>{`
                                    @keyframes thinking-pulse {
                                        0%, 100% { opacity: 0.4; transform: scale(0.8); }
                                        50% { opacity: 1; transform: scale(1); }
                                    }
                                `}</style>
                            </div>
                        )}
                    </div>

                    {/* STEP 3 Input Area (Only visible in chat mode) */}
                    {step === "chat" && (
                        <div className="bg-white border-t border-[#E5E8EB] p-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-20">
                            <div className="max-w-4xl mx-auto relative flex items-end gap-2">
                                <div className="relative flex-1 bg-[#F2F4F6] rounded-[24px] px-4 py-3 focus-within:bg-white transition-all border border-transparent focus-within:border-[#3182F6] focus-within:shadow-[0_0_0_2px_rgba(49,130,246,0.1)]">
                                    <Textarea
                                        value={input}
                                        onChange={(e) =>
                                            setInput(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" &&
                                                !e.shiftKey
                                            ) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="수정하고 싶은 내용을 적어주세요..."
                                        className="min-h-[24px] max-h-[150px] w-full bg-transparent border-none p-0 resize-none focus-visible:ring-0 placeholder:text-[#B0B8C1] text-[15px] leading-relaxed shadow-none focus:ring-0 focus:outline-none"
                                        disabled={isGenerating}
                                    />
                                </div>
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!input.trim() || isGenerating}
                                    className={cn(
                                        "h-12 w-12 rounded-full flex-shrink-0 shadow-sm transition-all duration-200",
                                        input.trim()
                                            ? "bg-[#3182F6] hover:bg-[#2b72d7] text-white"
                                            : "bg-[#F2F4F6] text-[#B0B8C1] hover:bg-[#E5E8EB]",
                                    )}
                                >
                                    <Send className="h-5 w-5 ml-0.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
