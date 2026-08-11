import { Scale } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-yellow shadow-xl">
        <Scale size={36} className="text-slate-900" />
      </div>

      <h1 className="mt-8 text-4xl font-bold text-slate-900">
        Pakistan Legal AI
      </h1>

      <p className="mt-3 max-w-xl text-center text-slate-500">
        Ask about Pakistani laws, draft petitions, summarize judgments, or
        continue a matter-linked conversation.
      </p>
    </div>
  );
}
