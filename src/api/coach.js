import api from "./client";

export async function getSwimmers() {
  const { data } = await api.get("/coach/swimmers");
  return data; // [{ id, email, username, ... }]
}

export async function getSwimmerSessions(swimmerId, { limit = 100, pace_per_m = 100 } = {}) {
  const { data } = await api.get(`/coach/swimmers/${swimmerId}/sessions`, {
    params: { limit, pace_per_m },
  });
  return data;
}
