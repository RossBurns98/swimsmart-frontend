import api from "./client";

export async function loginRequest(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data; // { access_token, token_type, user }
}