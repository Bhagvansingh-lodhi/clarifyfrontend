import axios from "axios";
import { useAuthStore } from "../store/authStore";

// 🔥 Use environment variable so future change easy ho
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://clarifybackend.onrender.com/api",
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
