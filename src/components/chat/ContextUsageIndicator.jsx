import { useEffect, useId, useRef, useState } from "react";
import {
  buildBreakdownRows,
  formatTokenCount,
  formatUsagePercent,
  getContextStatusLabel,
  getContextUsageLevel,
} from "../../lib/tokenBudget";

const LEVEL_STYLES = {
  normal: "text-slate-500 hover:text-slate-700",
  warning: "text-amber-700 hover:text-amber-800",
  critical: "text-orange-700 hover:text-orange-800",
  limit: "text-red-700 hover:text-red-800",
};

/**
 * Subtle context usage chip near the composer.
 * Renders nothing when tokenBudget is null/missing.
 */
export default function ContextUsageIndicator({ tokenBudget = null }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!tokenBudget) return null;

  const level = getContextUsageLevel(tokenBudget.usagePercent);
  if (level === "hidden") return null;

  const percent = formatUsagePercent(tokenBudget.usagePercent);
  const statusLabel = getContextStatusLabel(level);
  const rows = buildBreakdownRows(tokenBudget);
  const usedLabel = formatTokenCount(tokenBudget.totalBudgetUsed);
  const limitLabel = formatTokenCount(tokenBudget.contextLimit);

  return (
    <div ref={rootRef} className="relative inline-flex items-center">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        title="Context usage"
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
        className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium tracking-wide transition ${LEVEL_STYLES[level]}`}
      >
        Context {percent}%
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Context usage"
          onMouseLeave={() => setOpen(false)}
          className="absolute bottom-full left-0 z-20 mb-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Context usage
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {usedLabel} / {limitLabel} tokens
          </p>

          {statusLabel && (
            <p
              className={`mt-1 text-[12px] ${
                level === "limit"
                  ? "text-red-700"
                  : level === "critical"
                    ? "text-orange-700"
                    : "text-amber-700"
              }`}
            >
              {statusLabel}
            </p>
          )}

          {rows.length > 0 && (
            <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-2">
              {rows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3 text-[12px]"
                >
                  <dt className="text-slate-500">{row.label}</dt>
                  <dd className="font-medium text-slate-700">
                    {formatTokenCount(row.value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {tokenBudget.model && (
            <p className="mt-2 text-[10px] text-slate-400">
              Model · {tokenBudget.model}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
