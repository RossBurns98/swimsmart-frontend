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
