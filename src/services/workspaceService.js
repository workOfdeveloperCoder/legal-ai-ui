import { apiRequest } from "../lib/apiClient";

export const workspaceService = {
  search(q) { return apiRequest(`/search?q=${encodeURIComponent(q)}`); },
  notifications() { return apiRequest("/notifications"); },
  workItems(kind) { return apiRequest(`/work-items${kind ? `?kind=${kind}` : ""}`); },
  updateWorkItem(id, payload) { return apiRequest(`/work-items/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); },
  deleteWorkItem(id) { return apiRequest(`/work-items/${id}`, { method: "DELETE" }); },
  createWorkItem(payload) { return apiRequest("/work-items", { method: "POST", body: JSON.stringify(payload) }); },
  dashboardSummary() { return apiRequest("/dashboard/summary"); },
};
