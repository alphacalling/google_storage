import axios from "axios";
import { store } from "../store/store";
import { logout } from "../store/slices/authSlice";
import { clearUser } from "../store/slices/userSlice";
import { toast } from "sonner";
import { API_BASE_URL } from "../config/env";

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`, // 🔹 change to your backend URL and move it to .env file
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    // ✅ Success toast only if backend sends a `message`
    if (response.data?.message) {
      toast.success(response.data.message);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh"); // backend sets new tokens
        processQueue(null);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        store.dispatch(logout());
        store.dispatch(clearUser());
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
