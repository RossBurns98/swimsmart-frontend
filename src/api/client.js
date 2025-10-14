// src/api/client.js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";
console.info("[API] baseURL =", baseURL);

const api = axios.create({ baseURL });

// Attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 -> redirect to /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log details so "Network Error" isn’t opaque
    if (!error.response) {
      console.error("[API] Network error or CORS issue:", {
        message: error.message,
        config: { url: error.config?.url, baseURL: error.config?.baseURL, method: error.config?.method },
      });
    }
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
