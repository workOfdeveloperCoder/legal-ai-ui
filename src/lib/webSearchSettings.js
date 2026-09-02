import { apiRequest } from "./apiClient";

let cached = null;
let inflight = null;
 
/**
 * @returns {Promise<{ enabled: boolean, provider: string|null }>}
 */
export async function getWebSearchSettings({ refresh = false } = {}) {
  if (!refresh && cached) return cached;
  if (!refresh && inflight) return inflight;

  inflight = (async () => {
    try {
      const data = await apiRequest("/chat/quick-actions", { method: "GET" });
      const flagged = data?.webSearchEnabled ?? data?.web_search_enabled;
      // Show the Web toggle whenever the chat API is reachable.
      // Only hide it if the backend explicitly disables web search.
      cached = {
        enabled: flagged === undefined || flagged === null ? true : Boolean(flagged),
        provider:
          data?.webSearchProvider ?? data?.web_search_provider ?? null,
      };
    } catch {
      // Still show the toggle; chat send will include web_search if the user enables it.
      cached = { enabled: true, provider: null };
    } finally {
      inflight = null;
    }
    return cached;
  })();

  return inflight;
}

export function resetWebSearchSettingsCache() {
  cached = null;
  inflight = null;
}
