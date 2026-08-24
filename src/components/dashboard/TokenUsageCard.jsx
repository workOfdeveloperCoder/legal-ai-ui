import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getStoredUser } from "../../lib/apiClient";
import { subscribeConversations } from "../../lib/conversationStore";
import {
  budgetFromConversationCache,
  formatSidebarMeter,
} from "../../lib/sidebarTokenBudget";
import { getLlmStatus, llmStatusToBudget } from "../../services/llmService";

const RING = {
  card: { size: 132, stroke: 10 },
  sidebar: { size: 44, stroke: 5 },
};

const LEVEL_COLORS = {
  normal: "#FFC853",
  warning: "#F59E0B",
  critical: "#EA580C",
  limit: "#DC2626",
  hidden: "#64748B",
};

function latestTokenBudget(pathname) {
  const userId = getStoredUser()?.id || "anonymous";
  return budgetFromConversationCache(pathname, userId);
}

function UsageRing({ percent, color, size, stroke, track, labelClass }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <p className={labelClass}>{percent}%</p>
      </div>
    </div>
  );
}

export default function TokenUsageCard({ variant = "card" }) {
  const { pathname } = useLocation();
  const [budget, setBudget] = useState(() => latestTokenBudget(pathname));

  useEffect(() => {
    const sync = () => {
      const cached = latestTokenBudget(pathname);
      if (cached) {
        setBudget(cached);
        return;
      }
      getLlmStatus()
        .then((status) => {
          if (!latestTokenBudget(pathname)) {
            setBudget(llmStatusToBudget(status));
          }
        })
        .catch(() => setBudget(null));
    };

    sync();
    return subscribeConversations(sync);
  }, [pathname]);

  const meter = formatSidebarMeter(budget);
  const color = LEVEL_COLORS[meter.level] || LEVEL_COLORS.hidden;
  const ring = RING[variant] || RING.card;
  const hasUsage = Boolean(budget && budget.totalBudgetUsed);

  if (variant === "sidebar") {
    return (
      <div
        className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3"
        title={
          budget
            ? `Context ${meter.percent}% · ${meter.used} / ${meter.limit} tokens`
            : "Send a chat to see context usage"
        }
      >
        <UsageRing
          percent={meter.percent}
          color={color}
          size={ring.size}
          stroke={ring.stroke}
          track="rgba(255,255,255,0.12)"
          labelClass="text-[10px] font-semibold text-white"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">Token Usage</p>
          <p className="truncate text-xs text-gray-400">{meter.line}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <UsageRing
        percent={meter.percent}
        color={color}
        size={ring.size}
        stroke={ring.stroke}
        track="#F1F5F9"
        labelClass="text-2xl font-bold text-slate-900"
      />
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900">Token usage</h3>
        <p className="mt-1 text-sm text-slate-500">
          {budget ? `${meter.used} / ${meter.limit} tokens` : meter.line}
        </p>
        {budget?.model && (
          <p className="mt-2 truncate text-xs text-slate-400">
            Model · {budget.model}
          </p>
        )}
        {!hasUsage && budget?.contextLimit ? (
          <p className="mt-1 text-xs text-slate-400">No prompt usage yet.</p>
        ) : null}
      </div>
    </div>
  );
}
