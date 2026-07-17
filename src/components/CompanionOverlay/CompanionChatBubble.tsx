import { useEffect } from "react";

interface CompanionChatBubbleProps {
  text: string;
  isSpeaking: boolean;
  isListening: boolean;
  side: "left" | "right";
}

const CompanionChatBubble = ({
  text,
  isSpeaking,
  isListening,
  side,
}: CompanionChatBubbleProps) => {
  if (!text && !isListening) return null;

  return (
    <div
      className={`absolute -top-4 z-50 pointer-events-none ${
        side === "left" ? "left-0" : "right-0"
      }`}
      style={{
        transform: "translateY(-100%)",
        maxWidth: 280,
        minWidth: 140,
      }}
    >
      {/* listening indicator */}
      {isListening && !text && (
        <div className="bg-primary/90 backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-2xl border border-primary/40 text-sm font-medium text-center animate-pulse">
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-0.5 items-end">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-white rounded-full"
                  style={{
                    height: 6 + (i % 3) * 5,
                    animationDelay: `${i * 0.08}s`,
                    animation: "pulse 0.6s ease-in-out infinite alternate",
                  }}
                />
              ))}
            </div>
            <span>Tinglayapman...</span>
          </div>
        </div>
      )}

      {/* speech text */}
      {text && (
        <div className="relative">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl text-slate-800 dark:text-slate-100 px-4 py-3 rounded-2xl shadow-2xl border border-white/30 dark:border-slate-700/50 text-sm font-medium leading-relaxed">
            {text}

            {isSpeaking && (
              <span className="inline-block ml-1 w-1.5 h-4 bg-primary rounded-full animate-pulse" />
            )}
          </div>

          {/* bubble tail */}
          <div
            className={`absolute -bottom-1.5 ${
              side === "left" ? "left-6" : "right-6"
            } w-3 h-3 bg-white dark:bg-slate-800 rotate-45 border-r border-b border-white/30 dark:border-slate-700/50`}
          />
        </div>
      )}
    </div>
  );
};

export default CompanionChatBubble;
