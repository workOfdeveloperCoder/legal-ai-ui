/**
 * Auth against legal-chatbot:
 * POST /api/v1/auth/register
 * POST /api/v1/auth/login
 * POST /api/v1/auth/refresh
 * POST /api/v1/auth/logout  (header: refresh-token)
 * GET  /api/v1/auth/me
 */

import {
  apiRequest,
  clearAuthSession,
  getStoredRefreshToken,
  getStoredUser,
  setAuthSession,
} from "../lib/apiClient";

function toUiUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.full_name || user.username || user.email,
    fullName: user.full_name,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    isVerified: user.is_verified,
    avatar: null,
  };
}

export function isAuthenticated() {
  return Boolean(getStoredUser() && localStorage.getItem("legal_ai_access_token"));
}

export function getCurrentUser() {
  return toUiUser(getStoredUser());
}

export async function login(email, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });

  setAuthSession({
    user: data.user,
    tokens: data.tokens,
  });

  return toUiUser(data.user);
}

export async function register({ fullName, username, email, password }) {
  await apiRequest("/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      full_name: fullName,
      username,
      email,
      password,
    }),
  });

  // Register does not return tokens — login immediately.
  return login(email, password);
}

export async function fetchCurrentUser() {
  const user = await apiRequest("/auth/me", { method: "GET" });
  setAuthSession({ user, tokens: null });
  return toUiUser(user);
}

export async function logout() {
  const refreshToken = getStoredRefreshToken();
  try {
    if (refreshToken) {
      await apiRequest("/auth/logout", {
        method: "POST",
        skipRefresh: true,
        headers: {
          "refresh-token": refreshToken,
        },
      });
    }
  } catch {
    // Always clear local session even if logout API fails.
  } finally {
    clearAuthSession();
  }
}

export function subscribeAuth(listener) {
  window.addEventListener("legal-ai:auth-changed", listener);
  return () => window.removeEventListener("legal-ai:auth-changed", listener);
}
