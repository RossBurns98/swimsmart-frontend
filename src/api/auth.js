import api from "./client";

export async function loginRequest(identifier, password) {
  const { data } = await api.post("/auth/login", { identifier, password });
  return data; // { access_token, token_type, user: { id, email, role, username } }
}

export async function signupRequest({ email, password, role = "swimmer", username }) {
  const { data } = await api.post("/auth/signup", {
    email,
    password,
    role,
    username: username || null,
  });
  return data; // e.g. { id, email, role, username? }
}
