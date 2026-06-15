import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '';
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } else if (status === 403 && message.includes('חסום')) {
      window.location.href = "/blocked";
    }
    return Promise.reject(error);
  }
);

export default api;