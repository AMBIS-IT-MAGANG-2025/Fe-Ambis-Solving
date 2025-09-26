import axios from "axios";

// Base Axios instance for API requests
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor to add authorization token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const s = err?.response?.status;
    const url = err?.config?.url;
    console.error("API error:", s, url, err?.response?.data || err.message);
    if (s === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      if (location.pathname !== "/login") location.href = "/login";
    }
    return Promise.reject(err);
  }
);