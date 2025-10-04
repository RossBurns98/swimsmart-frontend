import api from "./client";

export async function loginRequest(identifier, password) {
  const { data } = await api.post("/auth/login", { identifier, password });
  return data; // { access_token, token_type, user }
}
