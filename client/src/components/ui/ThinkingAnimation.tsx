import { motion } from "framer-motion";
import { Bot } from "lucide-react";

interface ThinkingAnimationProps {
  message?: string;
}

export function ThinkingAnimation({ message = "생각하고 있어요..." }: ThinkingAnimationProps) {
  return (
    <div className="flex gap-3 p-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#3182F6] to-[#1e6cd6] flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-[#191F28]">AI 어시스턴트</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-[#4E5968]">{message}</span>
          <ThinkingDots />
        </div>
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#3182F6]"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface StreamingTextProps {
  text: string;
  isComplete: boolean;
}

export function StreamingText({ text, isComplete }: StreamingTextProps) {
  return (
    <div className="relative">
      <span className="text-[#191F28] whitespace-pre-wrap">{text}</span>
      {!isComplete && (
        <motion.span
          className="inline-block w-0.5 h-4 bg-[#3182F6] ml-0.5 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </div>
  );
}

interface InlinePulseDotsProps {
  className?: string;
}

export function InlinePulseDots({ className = "" }: InlinePulseDotsProps) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-1 h-1 rounded-full bg-current"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}
