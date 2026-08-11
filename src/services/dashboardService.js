/**
 * Dashboard data is not part of legal-chatbot.
 * Optionally loads from a mock/json-server URL when configured.
 */

const MOCK_API = import.meta.env.VITE_MOCK_API_URL || "";

export const dashboardService = {
  async getDashboard() {
    if (!MOCK_API) {
      return null;
    }

    try {
      const response = await fetch(`${MOCK_API}/dashboard`);
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },
};
