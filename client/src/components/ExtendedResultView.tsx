import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, Info } from "lucide-react";
import { ExtendedResult } from "@/lib/extendedDiagnosis";
import { RIASEC_LABELS, RIASEC_DESCRIPTIONS, TEMPERAMENT_LABELS } from "@/constants/extendedDiagnosisMap";

interface ExtendedResultViewProps {
  data: ExtendedResult;
}

type TabType = "riasec" | "workStyle" | "temperament";

export function ExtendedResultView({ data }: ExtendedResultViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("riasec");

  const tabs: { key: TabType; label: string }[] = [
    { key: "riasec", label: "직무성향" },
    { key: "workStyle", label: "업무성향 4축" },
    { key: "temperament", label: "직무기질" },
  ];

  return (
    <div className="mt-6 border rounded-lg bg-white shadow-sm" data-testid="extended-result-view">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        data-testid="extended-result-toggle"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">추가 분석 결과</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">선택 보기</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {!isExpanded && (
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <SummaryCard
            title="직무성향 코드"
            content={data.riasec.code}
            subtext={data.riasec.narrative}
          />
          <SummaryCard
            title="업무성향 요약"
            content={[data.workStyle4.axis1.verdict, data.workStyle4.axis2.verdict].join(" · ")}
            subtext={[data.workStyle4.axis3.verdict, data.workStyle4.axis4.verdict].join(" · ")}
          />
          <SummaryCard
            title="직무기질 요약"
            content={`${TEMPERAMENT_LABELS.novelty}: ${data.temperament4.novelty}점`}
            subtext={data.temperament4.narrative}
          />
        </div>
      )}

      {isExpanded && (
        <div className="border-t">
          <div className="flex border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
                data-testid={`tab-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === "riasec" && <RIASECTab data={data.riasec} />}
            {activeTab === "workStyle" && <WorkStyleTab data={data.workStyle4} />}
            {activeTab === "temperament" && <TemperamentTab data={data.temperament4} />}
          </div>

          {data.quality.warnings.length > 0 && (
            <div className="px-4 pb-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">참고사항</p>
                    <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                      {data.quality.warnings.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="px-4 pb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-500 mt-0.5" />
                <p className="text-xs text-gray-600">{data.evidence.caution}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, content, subtext }: { title: string; content: string; subtext: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="font-semibold text-gray-800 text-sm">{content}</p>
      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{subtext}</p>
    </div>
  );
}

function RIASECTab({ data }: { data: ExtendedResult["riasec"] }) {
  const scores = [
    { key: "R", score: data.R },
    { key: "I", score: data.I },
    { key: "A", score: data.A },
    { key: "S", score: data.S },
    { key: "E", score: data.E },
    { key: "C", score: data.C },
  ];

  const colors = {
    R: "bg-red-500",
    I: "bg-blue-500",
    A: "bg-purple-500",
    S: "bg-green-500",
    E: "bg-orange-500",
    C: "bg-cyan-500",
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600 mb-1">나의 직무성향 코드</p>
        <p className="text-2xl font-bold text-blue-600">{data.code}</p>
        <p className="text-xs text-gray-500 mt-2">{data.narrative}</p>
      </div>

      <div className="space-y-3">
        {scores.map(({ key, score }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">
                {key} - {RIASEC_LABELS[key]}
              </span>
              <span className="text-gray-600">{score}점</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors[key as keyof typeof colors]} transition-all duration-500`}
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{RIASEC_DESCRIPTIONS[key]}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">상위 3개 유형</p>
        <div className="flex gap-2">
          {data.top3.map((type, index) => (
            <span
              key={type}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                index === 0
                  ? "bg-blue-100 text-blue-700"
                  : index === 1
                  ? "bg-blue-50 text-blue-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {index + 1}. {type} ({RIASEC_LABELS[type].split(" ")[0]})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkStyleTab({ data }: { data: ExtendedResult["workStyle4"] }) {
  const axes = [
    { key: "axis1", data: data.axis1 },
    { key: "axis2", data: data.axis2 },
    { key: "axis3", data: data.axis3 },
    { key: "axis4", data: data.axis4 },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{data.narrative}</p>

      <div className="space-y-6">
        {axes.map(({ key, data: axisData }) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span>{axisData.leftLabel}</span>
              <span className="text-blue-600">{axisData.verdict}</span>
              <span>{axisData.rightLabel}</span>
            </div>
            <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-end pr-2"
                  style={{ width: `${axisData.left}%` }}
                >
                  <span className="text-xs text-white font-medium">{axisData.left}</span>
                </div>
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center pl-2"
                  style={{ width: `${axisData.right}%` }}
                >
                  <span className="text-xs text-white font-medium">{axisData.right}</span>
                </div>
              </div>
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/50" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mt-4">
        <p className="text-xs text-gray-600">
          * 양쪽 점수 차이가 12점 미만이면 "균형형"으로 표시됩니다.
        </p>
      </div>
    </div>
  );
}

function TemperamentTab({ data }: { data: ExtendedResult["temperament4"] }) {
  const items = [
    { key: "novelty", label: TEMPERAMENT_LABELS.novelty, score: data.novelty, color: "bg-orange-500", desc: "새로운 자극과 변화를 추구하는 성향" },
    { key: "stability", label: TEMPERAMENT_LABELS.stability, score: data.stability, color: "bg-green-500", desc: "안정적이고 예측 가능한 환경을 선호하는 성향" },
    { key: "persistence", label: TEMPERAMENT_LABELS.persistence, score: data.persistence, color: "bg-blue-500", desc: "목표를 향해 꾸준히 노력하는 성향" },
    { key: "sensitivity", label: TEMPERAMENT_LABELS.sensitivity, score: data.sensitivity, color: "bg-purple-500", desc: "타인의 감정과 반응에 민감한 성향" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{data.narrative}</p>

      <div className="space-y-4">
        {items.map(({ key, label, score, color, desc }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{label}</span>
              <span className="text-gray-600">{score}점</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} transition-all duration-500`}
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mt-4 grid grid-cols-2 gap-3">
        {items.map(({ label, score }) => (
          <div key={label} className="text-center">
            <p className="text-lg font-bold text-gray-800">{score}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
