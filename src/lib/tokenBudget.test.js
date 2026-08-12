import { describe, expect, it } from "vitest";
import {
  buildBreakdownRows,
  formatTokenCount,
  formatUsagePercent,
  getContextLimitErrorMessage,
  getContextStatusLabel,
  getContextUsageLevel,
  isContextLimitError,
  normalizeTokenBudget,
} from "./tokenBudget";

const SAMPLE_BUDGET = {
  model: "deepseek-r1:32b",
  context_limit: 32000,
  input_tokens: 24500,
  output_reserved: 2000,
  total_budget_used: 24500,
  remaining_tokens: 7500,
  usage_percent: 76.5,
  trimmed: false,
  conversation_tokens: 6200,
  evidence_tokens: 12800,
  matter_document_tokens: 3500,
  system_prompt_tokens: 2000,
};

describe("normalizeTokenBudget", () => {
  it("maps a top-level token_budget (normal usage)", () => {
    const budget = normalizeTokenBudget({ token_budget: SAMPLE_BUDGET });
    expect(budget).not.toBeNull();
    expect(budget.usagePercent).toBeCloseTo(76.5);
    expect(budget.contextLimit).toBe(32000);
    expect(budget.conversationTokens).toBe(6200);
    expect(budget.evidenceTokens).toBe(12800);
    expect(budget.matterDocumentTokens).toBe(3500);
    expect(budget.trimmed).toBe(false);
    expect(getContextUsageLevel(budget.usagePercent)).toBe("warning");
    expect(getContextStatusLabel("warning")).toBe("Context getting large");
  });

  it("reads nested retrieval_metadata.token_budget for compatibility", () => {
    const budget = normalizeTokenBudget({
      retrieval_metadata: {
        token_budget: { ...SAMPLE_BUDGET, usage_percent: 42 },
      },
    });
    expect(budget?.usagePercent).toBe(42);
    expect(getContextUsageLevel(budget.usagePercent)).toBe("normal");
    expect(getContextStatusLabel("normal")).toBeNull();
  });

  it("marks high usage as critical above 90%", () => {
    const budget = normalizeTokenBudget({
      token_budget: { ...SAMPLE_BUDGET, usage_percent: 93 },
    });
    expect(getContextUsageLevel(budget.usagePercent)).toBe("critical");
    expect(getContextStatusLabel("critical")).toBe("Context nearly full");
  });

  it("marks near-limit usage at 100%", () => {
    const budget = normalizeTokenBudget({
      token_budget: { ...SAMPLE_BUDGET, usage_percent: 100 },
    });
    expect(getContextUsageLevel(budget.usagePercent)).toBe("limit");
    expect(getContextStatusLabel("limit")).toBe("Context limit reached");
  });

  it("preserves trimmed metadata for compression notice", () => {
    const budget = normalizeTokenBudget({
      token_budget: { ...SAMPLE_BUDGET, trimmed: true, usage_percent: 88 },
    });
    expect(budget.trimmed).toBe(true);
    expect(getContextUsageLevel(budget.usagePercent)).toBe("warning");
  });

  it("returns null when token_budget is missing", () => {
    expect(normalizeTokenBudget({})).toBeNull();
    expect(normalizeTokenBudget(null)).toBeNull();
    expect(normalizeTokenBudget({ token_budget: null })).toBeNull();
  });

  it("supports old API responses without token_budget", () => {
    const legacy = {
      conversation_id: "abc",
      response: "Hello",
      citations: [],
      retrieval_metadata: {
        legal_chunks: 3,
        total_selected: 3,
      },
    };
    expect(normalizeTokenBudget(legacy)).toBeNull();
  });

  it("derives usage percent from used/limit when percent is absent", () => {
    const budget = normalizeTokenBudget({
      token_budget: {
        context_limit: 10000,
        total_budget_used: 2500,
        conversation_tokens: 1000,
        evidence_tokens: 1500,
      },
    });
    expect(budget?.usagePercent).toBe(25);
    expect(getContextUsageLevel(budget.usagePercent)).toBe("normal");
  });
});

describe("format helpers", () => {
  it("formats token counts professionally", () => {
    expect(formatTokenCount(6200)).toBe("6.2K");
    expect(formatTokenCount(12800)).toBe("12.8K");
    expect(formatTokenCount(32000)).toBe("32K");
    expect(formatTokenCount(500)).toBe("500");
    expect(formatTokenCount(null)).toBe("—");
  });

  it("rounds usage percent for display", () => {
    expect(formatUsagePercent(76.5)).toBe(77);
    expect(formatUsagePercent(90)).toBe(90);
  });

  it("builds breakdown rows only for present values", () => {
    const rows = buildBreakdownRows(
      normalizeTokenBudget({ token_budget: SAMPLE_BUDGET })
    );
    expect(rows.map((row) => row.label)).toEqual([
      "Conversation",
      "Legal evidence",
      "Matter documents",
      "System prompt",
      "Output reserved",
    ]);
  });
});

describe("context limit errors", () => {
  it("detects backend context-limit failures", () => {
    expect(
      isContextLimitError({
        message: "context_limit exceeded",
        status: 400,
      })
    ).toBe(true);

    expect(
      isContextLimitError({
        message: "Token budget cannot fit prompt",
        detail: { code: "token_budget_exceeded" },
      })
    ).toBe(true);

    expect(
      isContextLimitError({
        message: "Network timeout",
        status: 504,
      })
    ).toBe(false);
  });

  it("returns a professional lawyer-facing message", () => {
    expect(getContextLimitErrorMessage()).toContain(
      "conversation has become too large"
    );
  });
});
