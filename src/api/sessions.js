import api from "./client";

// Swimmer-only: your own sessions
export async function listMySessions({ limit = 50, pace_per_m = 100 } = {}) {
  const { data } = await api.get(`/me/sessions`, { params: { limit, pace_per_m } });
  return data;
}

// (keep these if you still need them elsewhere)
export async function listSessions({ limit = 50, pace_per_m = 100 } = {}) {
  const { data } = await api.get(`/sessions`, { params: { limit, pace_per_m } });
  return data;
}

export async function getSession(id) {
  const { data } = await api.get(`/sessions/${id}`);
  return data;
}

export async function getSessionAnalytics(id, pace_per_m = 100) {
  const { data } = await api.get(`/sessions/${id}/analytics`, { params: { pace_per_m } });
  return data;
}

export async function getMySessions(params = {}) {
  const qs = new URLSearchParams();
  if (params.limit) qs.append("limit", String(params.limit));
  if (params.pace_per_m) qs.append("pace_per_m", String(params.pace_per_m));
  const url = qs.toString() ? `/me/sessions?${qs.toString()}` : `/me/sessions`;
  const { data } = await api.get(url);
  return data;
}

// Create a session for self
export async function createMySession(payload) {
  // payload: { date: "YYYY-MM-DD", notes?: string }
  const { data } = await api.post(`/me/sessions`, payload);
  return data; // { id, date, ... }
}

// Add set to my session
export async function addSetToMySession(sessionId, setPayload) {
  const { data } = await api.post(`/me/sessions/${sessionId}/sets`, setPayload);
  return data;
}