import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [role, setRole] = useState(() => localStorage.getItem("role"));

    function login(newToken, newRole) {
        setToken(newToken);
        setRole(newRole);
        if (newToken) localStorage.setItem("token", newToken);
        if (newRole) localStorage.setItem("role", newRole);
    }

    function logout() {
        setToken(null);
        setRole(null);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login";
    }

    const value = useMemo(() => ({ token, role, login, logout }), [token, role,]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used with <AuthProvider>");
    }
    return ctx;
}