import { Scale } from "lucide-react";

export default function TypingIndicator({
    label = "Legal AI is researching...",
}){
    return (
        <div className="flex justify-start">
          <div className="flex w-full max-w-3xl items-start gap-3">
            {/* Law icon avatar — matches sidebar / EmptyState */}
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#23232F] shadow-sm">
              <Scale size={15} className="text-yellow" />
            </div>
            {/* Typing bubble */}
            <div className="rounded-3xl bg-[#F7F8FC] px-5 py-4 shadow-sm ring-1 ring-slate-200/60">
              <div className="flex items-center gap-1.5">
                <span className="typing-dot" />
                <span className="typing-dot [animation-delay:0.15s]" />
                <span className="typing-dot [animation-delay:0.3s]" />
              </div>
              {label && (
                <p className="mt-2 text-[11px] font-medium tracking-wide text-slate-400">
                  {label}
                </p>
              )}
            </div>
          </div>
        </div>
      );
}