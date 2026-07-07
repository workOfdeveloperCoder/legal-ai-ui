import { Sparkles, ChevronDown, Bell, Search } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-background/80 px-8 backdrop-blur-xl">

      {/* Left */}
      <div className="flex items-center gap-4">
        {/* <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow to-yellow shadow-lg shadow-yellow"> */}
          {/* <Sparkles size={18} className="text-white" /> */}
        {/* </div> */}

        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Pakistan Legal AI
          </h1>

          <p className="text-xs text-slate-500">
            Research • Draft • Analyze
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-background transition hover:bg-slate-100">
          <Search size={18} className="text-slate-500" />
        </button>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-background transition hover:bg-slate-100">
          <Bell size={18} className="text-slate-500" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-yellow" />
        </button>

        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-background px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100">
          GPT-5
          <ChevronDown size={16} />
        </button>

      </div>

    </header>
  );
}