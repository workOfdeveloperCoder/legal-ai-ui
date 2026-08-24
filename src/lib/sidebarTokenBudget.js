import {
  getCachedConversation,
  listCachedConversations,
} from "./conversationStore";
import {
  formatTokenCount,
  formatUsagePercent,
  getContextUsageLevel,
} from "./tokenBudget";

export function conversationIdFromPath(pathname) {
  const match = String(pathname || "").match(/\/conversation\/([^/?#]+)/);
  return match?.[1] || null;
}

/**
 * Sidebar meter source of truth:
 * - On a chat route, only that conversation's last BE token_usage.
 * - Elsewhere, the first cached conversation that has tokenBudget.
 */
export function selectSidebarTokenBudget({
  pathname,
  conversationList = [],
  getDetail,
}) {
  const read = (id) => {
    if (id == null || !getDetail) return null;
    return getDetail(id) || getDetail(String(id)) || null;
  };

  const openId = conversationIdFromPath(pathname);
  if (openId) {
    return read(openId)?.tokenBudget ?? null;
  }

  for (const meta of conversationList) {
    const budget = read(meta?.id)?.tokenBudget;
    if (budget) return budget;
  }

  return null;
}

export function budgetFromConversationCache(pathname, userId) {
  return selectSidebarTokenBudget({
    pathname,
    conversationList: listCachedConversations(userId) || [],
    getDetail: (id) => getCachedConversation(userId, id),
  });
}

export function formatSidebarMeter(budget) {
  if (!budget) {
    return {
      percent: 0,
      used: "—",
      limit: "—",
      line: "No usage yet",
      level: "hidden",
    };
  }

  const percent = formatUsagePercent(budget.usagePercent) ?? 0;
  const used = formatTokenCount(budget.totalBudgetUsed);
  const limit = formatTokenCount(budget.contextLimit);

  return {
    percent,
    used,
    limit,
    line: `${used} / ${limit}`,
    level: getContextUsageLevel(budget.usagePercent),
  };
}
