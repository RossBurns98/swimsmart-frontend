// src/api/auth.js
import api from "./client";

// LOGIN (username OR email in "identifier")
export async function loginRequest(identifier, password) {
  const { data } = await api.post("/auth/login", { identifier, password });
  return data; // { access_token, token_type, user: { id, email, role, username } }
}

// SIGNUP (requires invite_code)
export async function signupRequest({ email, username, password, role, invite_code }) {
  const payload = {
    email,
    username: username || null,
    password,
    role,
    invite_code,
  };
  const { data } = await api.post("/auth/signup", payload);
  return data; // { message: "ok" }
}
