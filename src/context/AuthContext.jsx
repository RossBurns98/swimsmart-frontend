import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(() => localStorage.getItem("role"));
  const [username, setUsername] = useState(() => localStorage.getItem("username"));

  function login(newToken, newRole, newUsername) {
    setToken(newToken);
    setRole(newRole);
    setUsername(newUsername || null);

    if (newToken) localStorage.setItem("token", newToken);
    else localStorage.removeItem("token");

    if (newRole) localStorage.setItem("role", newRole);
    else localStorage.removeItem("role");

    if (newUsername) localStorage.setItem("username", newUsername);
    else localStorage.removeItem("username");
  }

  function logout() {
    setToken(null);
    setRole(null);
    setUsername(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    window.location.href = "/login";
  }

  const value = useMemo(
    () => ({ token, role, username, login, logout }),
    [token, role, username]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used with <AuthProvider>");
  }
  return ctx;
}
