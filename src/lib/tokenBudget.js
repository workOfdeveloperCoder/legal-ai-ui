/**
 * Display helpers for backend TokenBudgetManager metadata.
 * Frontend never counts or enforces tokens — only formats/presents values.
 */

const CONTEXT_LIMIT_ERROR_MESSAGE =
  "Your conversation has become too large. Earlier context could not be retained. Please start a new conversation or continue with the current matter.";

/**
 * Normalize token_budget from ChatResponse.
 * Accepts top-level `token_budget` or `retrieval_metadata.token_budget`.
 * Returns null when missing/invalid so the UI can hide the indicator.
 */
export function normalizeTokenBudget(payload) {
  if (!payload || typeof payload !== "object") return null;

  const raw =
    payload.token_budget ??
    payload.tokenBudget ??
    payload.retrieval_metadata?.token_budget ??
    payload.retrieval_metadata?.tokenBudget ??
    null;

  if (!raw || typeof raw !== "object") return null;

  const contextLimit = toNumber(raw.context_limit ?? raw.contextLimit);
  const usagePercent = toNumber(raw.usage_percent ?? raw.usagePercent);
  const totalBudgetUsed = toNumber(
    raw.total_budget_used ?? raw.totalBudgetUsed ?? raw.input_tokens ?? raw.inputTokens
  );

  // Without a usable percent or limit+used pair, hide indicator.
  if (
    usagePercent == null &&
    (contextLimit == null || totalBudgetUsed == null)
  ) {
    return null;
  }

  const computedPercent =
    usagePercent != null
      ? usagePercent
      : contextLimit > 0
        ? (totalBudgetUsed / contextLimit) * 100
        : null;

  if (computedPercent == null || Number.isNaN(computedPercent)) {
    return null;
  }

  return {
    model: raw.model ?? null,
    contextLimit,
    inputTokens: toNumber(raw.input_tokens ?? raw.inputTokens),
    outputReserved: toNumber(raw.output_reserved ?? raw.outputReserved),
    totalBudgetUsed,
    remainingTokens: toNumber(raw.remaining_tokens ?? raw.remainingTokens),
    usagePercent: clampPercent(computedPercent),
    trimmed: Boolean(raw.trimmed),
    conversationTokens: toNumber(
      raw.conversation_tokens ?? raw.conversationTokens
    ),
    evidenceTokens: toNumber(raw.evidence_tokens ?? raw.evidenceTokens),
    matterDocumentTokens: toNumber(
      raw.matter_document_tokens ??
        raw.matterDocumentTokens ??
        raw.matter_tokens ??
        raw.matterTokens ??
        raw.document_tokens ??
        raw.documentTokens
    ),
    systemPromptTokens: toNumber(
      raw.system_prompt_tokens ?? raw.systemPromptTokens
    ),
    raw,
  };
}

export function getContextUsageLevel(usagePercent) {
  if (usagePercent == null || Number.isNaN(usagePercent)) return "hidden";
  if (usagePercent >= 100) return "limit";
  if (usagePercent > 90) return "critical";
  if (usagePercent >= 70) return "warning";
  return "normal";
}

export function getContextStatusLabel(level) {
  switch (level) {
    case "warning":
      return "Context getting large";
    case "critical":
      return "Context nearly full";
    case "limit":
      return "Context limit reached";
    default:
      return null;
  }
}

export function formatTokenCount(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  if (n < 1000) return String(Math.round(n));
  const thousands = n / 1000;
  const rounded =
    thousands >= 100 ? Math.round(thousands) : Math.round(thousands * 10) / 10;
  return `${rounded}K`;
}

export function formatUsagePercent(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return Math.round(Number(value));
}

export function buildBreakdownRows(budget) {
  if (!budget) return [];
  return [
    { key: "conversation", label: "Conversation", value: budget.conversationTokens },
    { key: "evidence", label: "Legal evidence", value: budget.evidenceTokens },
    {
      key: "matter",
      label: "Matter documents",
      value: budget.matterDocumentTokens,
    },
    { key: "system", label: "System prompt", value: budget.systemPromptTokens },
    { key: "reserved", label: "Output reserved", value: budget.outputReserved },
  ].filter((row) => row.value != null);
}

/**
 * Detect backend context-limit / token-budget hard failures from API errors.
 */
export function isContextLimitError(error) {
  if (!error) return false;

  const detail = error.detail;
  const detailCode =
    typeof detail === "object" && detail
      ? String(detail.code || detail.error || detail.type || "").toLowerCase()
      : "";
  const detailText =
    typeof detail === "string"
      ? detail
      : typeof detail === "object" && detail
        ? JSON.stringify(detail)
        : "";

  const message = String(error.message || detailText || "").toLowerCase();
  const haystack = `${detailCode} ${message} ${detailText}`.toLowerCase();

  return (
    haystack.includes("context_limit") ||
    haystack.includes("context-limit") ||
    haystack.includes("token_budget") ||
    haystack.includes("token budget") ||
    haystack.includes("context window") ||
    haystack.includes("context limit") ||
    haystack.includes("maximum context") ||
    haystack.includes("prompt too long") ||
    (error.status === 413 && haystack.includes("token"))
  );
}

export function getContextLimitErrorMessage() {
  return CONTEXT_LIMIT_ERROR_MESSAGE;
}

function toNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clampPercent(value) {
  if (value == null) return null;
  return Math.max(0, Math.min(100, Number(value)));
}
