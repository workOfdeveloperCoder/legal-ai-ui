import { apiRequest } from "../lib/apiClient";

let cachedStatus = null;
let inFlight = null;
let cachedModels = null;
let modelsInFlight = null;

export function resetLlmStatusCache() {
  cachedStatus = null;
  inFlight = null;
  cachedModels = null;
  modelsInFlight = null;
}

export async function getLlmModels({ refresh = false } = {}) {
  if (!refresh && cachedModels) return cachedModels;
  if (!refresh && modelsInFlight) return modelsInFlight;

  modelsInFlight = apiRequest("/llm/models")
    .then((data) => {
      cachedModels = data;
      return data;
    })
    .finally(() => {
      modelsInFlight = null;
    });

  return modelsInFlight;
}

export async function getLlmStatus({ refresh = false } = {}) {
  if (!refresh && cachedStatus) return cachedStatus;
  if (!refresh && inFlight) return inFlight;

  inFlight = apiRequest("/llm/status")
    .then((data) => {
      cachedStatus = data;
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function llmStatusToBudget(status) {
  if (!status || typeof status !== "object") return null;
  const contextLimit = Number(status.context_window);
  if (!Number.isFinite(contextLimit) || contextLimit <= 0) return null;

  return {
    model: status.model || null,
    contextLimit,
    totalBudgetUsed: 0,
    usagePercent: 0,
    remainingTokens: Number(status.available_input_tokens) || contextLimit,
    outputReserved: Number(status.reserved_output_tokens) || null,
    warning: false,
    overLimit: false,
    trimmed: false,
  };
}
