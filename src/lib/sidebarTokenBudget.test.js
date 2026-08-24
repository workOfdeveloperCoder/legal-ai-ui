import { describe, expect, it } from "vitest";
import { llmStatusToBudget } from "../services/llmService";
import { normalizeTokenBudget } from "./tokenBudget";
import {
  conversationIdFromPath,
  formatSidebarMeter,
  selectSidebarTokenBudget,
} from "./sidebarTokenBudget";

const CHAT_RESPONSE = {
  conversation_id: "conv-open",
  response: "Section 54-C can clog discretion.",
  token_usage: {
    model: "gpt-4o-mini",
    provider: "openai",
    context_window: 128000,
    input_tokens: 100000,
    output_tokens: 200,
    total_tokens: 100200,
    remaining_input_tokens: 10000,
    usage_percent: 78.28,
    warning: false,
    over_limit: false,
    budget_trimmed: false,
    breakdown: {
      system_tokens: 800,
      history_tokens: 6200,
      legal_evidence_tokens: 12800,
      matter_evidence_tokens: 3500,
    },
  },
};

function details(map) {
  return (id) => map[String(id)] || null;
}

describe("sidebar token meter", () => {
  it("reads the open conversation id from the chat route", () => {
    expect(conversationIdFromPath("/conversation/abc-123")).toBe("abc-123");
    expect(conversationIdFromPath("/dashboard")).toBeNull();
  });

  it("uses BE token_usage from the open chat, not another thread", () => {
    const openBudget = normalizeTokenBudget(CHAT_RESPONSE);
    const otherBudget = normalizeTokenBudget({
      token_usage: {
        ...CHAT_RESPONSE.token_usage,
        usage_percent: 12,
        total_tokens: 1500,
        context_window: 128000,
      },
    });

    const budget = selectSidebarTokenBudget({
      pathname: "/conversation/conv-open",
      conversationList: [{ id: "other" }, { id: "conv-open" }],
      getDetail: details({
        other: { tokenBudget: otherBudget },
        "conv-open": { tokenBudget: openBudget },
      }),
    });

    const meter = formatSidebarMeter(budget);
    expect(budget.usagePercent).toBeCloseTo(78.28);
    expect(budget.contextLimit).toBe(128000);
    expect(budget.totalBudgetUsed).toBe(100200);
    expect(meter.percent).toBe(78);
    expect(meter.line).toBe("100K / 128K");
    expect(meter.level).toBe("warning");
  });

  it("does not leak another chat's usage onto an open chat with no tokens yet", () => {
    const otherBudget = normalizeTokenBudget(CHAT_RESPONSE);
    const budget = selectSidebarTokenBudget({
      pathname: "/conversation/draft-1",
      conversationList: [{ id: "other" }],
      getDetail: details({
        other: { tokenBudget: otherBudget },
        "draft-1": { messages: [] },
      }),
    });
    expect(budget).toBeNull();
    expect(formatSidebarMeter(budget).line).toBe("No usage yet");
  });

  it("on dashboard, shows the first cached conversation that has BE usage", () => {
    const budget = selectSidebarTokenBudget({
      pathname: "/dashboard",
      conversationList: [{ id: "empty" }, { id: "used" }],
      getDetail: details({
        empty: { messages: [] },
        used: { tokenBudget: normalizeTokenBudget(CHAT_RESPONSE) },
      }),
    });
    expect(formatSidebarMeter(budget).percent).toBe(78);
  });

  it("maps GET /llm/status into a 0% window before any chat", () => {
    const budget = llmStatusToBudget({
      model: "gpt-4o-mini",
      provider: "openai",
      context_window: 128000,
      available_input_tokens: 122000,
      reserved_output_tokens: 4096,
    });
    const meter = formatSidebarMeter(budget);
    expect(budget.usagePercent).toBe(0);
    expect(meter.percent).toBe(0);
    expect(meter.line).toBe("0 / 128K");
    expect(meter.level).toBe("normal");
  });

  it("hides the meter when llm status is unusable", () => {
    expect(llmStatusToBudget(null)).toBeNull();
    expect(llmStatusToBudget({ context_window: 0 })).toBeNull();
  });
});
