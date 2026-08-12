/**
 * Shared HTTP client for the Legal Chatbot API (`legal-chatbot`).
 *
 * Auth: Bearer access token + refresh rotation via POST /auth/refresh.
 * Base URL: `VITE_API_ORIGIN` + `/api/v1`, or `VITE_API_BASE_URL` (default `/api/v1`).
 */

const ACCESS_TOKEN_KEY = "legal_ai_access_token";
const REFRESH_TOKEN_KEY = "legal_ai_refresh_token";
const USER_KEY = "legal_ai_user";

export class ApiError extends Error {
  constructor(message, { status, detail } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function getApiBaseUrl() {
  const origin = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, "");
  if (origin) {
    return `${origin}/api/v1`;
  }
  const base = import.meta.env.VITE_API_BASE_URL || "/api/v1";
  return base.replace(/\/$/, "");
}

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession({ user, tokens }) {
  if (tokens?.access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  }
  if (tokens?.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new Event("legal-ai:auth-changed"));
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("legal-ai:auth-changed"));
}

function formatDetail(detail) {
  if (!detail) return "Request failed";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || JSON.stringify(item))
      .join(", ");
  }
  return String(detail);
}

async function parseError(response) {
  let detail;
  try {
    const body = await response.json();
    detail = body?.detail ?? body;
  } catch {
    detail = response.statusText;
  }
  return new ApiError(formatDetail(detail), {
    status: response.status,
    detail,
  });
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    clearAuthSession();
    throw new ApiError("Session expired. Please sign in again.", {
      status: 401,
    });
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        clearAuthSession();
        throw await parseError(response);
      }

      const data = await response.json();
      setAuthSession({ tokens: data.tokens, user: getStoredUser() });
      return data.tokens.access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/**
 * @param {string} path - Path under the API base, e.g. `/chat`
 * @param {RequestInit & { auth?: boolean, skipRefresh?: boolean, raw?: boolean }} [options]
 */
export async function apiRequest(path, options = {}) {
  const {
    auth = true,
    skipRefresh = false,
    raw = false,
    headers: customHeaders,
    ...fetchOptions
  } = options;

  const headers = new Headers(customHeaders || {});

  if (
    fetchOptions.body &&
    !(fetchOptions.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getStoredAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const url = path.startsWith("http")
    ? path
    : `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 && auth && !skipRefresh) {
    try {
      const newToken = await refreshAccessToken();
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(url, {
        ...fetchOptions,
        headers,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      clearAuthSession();
      throw new ApiError("Session expired. Please sign in again.", {
        status: 401,
      });
    }
  }

  if (raw) {
    return response;
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 201 || response.headers.get("content-type")?.includes("application/json")) {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  }

  return response.json();
}
