import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { authService } from "./authService";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const AUTH_TOKEN_KEY = "auth_token";

export interface ApiRequestOptions
  extends Omit<AxiosRequestConfig, "data" | "url"> {
  withAuth?: boolean;
  body?: BodyInit | null;
}

interface ApiAxiosRequestConfig extends InternalAxiosRequestConfig {
  withAuth?: boolean;
  _retry?: boolean;
}

const unwrapData = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};

export const getAuthToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

const isFormDataPayload = (payload: unknown): payload is FormData =>
  typeof FormData !== "undefined" && payload instanceof FormData;

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});


// =========================
// REQUEST INTERCEPTOR
// =========================

axiosClient.interceptors.request.use((config: ApiAxiosRequestConfig) => {
  const headers = AxiosHeaders.from(config.headers);

  const token = getAuthToken();

  if (!isFormDataPayload(config.data) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && config.withAuth !== false) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  config.headers = headers;

  return config;
});


// =========================
// RESPONSE INTERCEPTOR
// =========================

axiosClient.interceptors.response.use(
  (response) => unwrapData(response.data),

  async (error: AxiosError<{ message?: unknown }>) => {
    const originalRequest = error.config as
      | ApiAxiosRequestConfig
      | undefined;

    // prevent infinite loop
    const isRefreshRequest =
      originalRequest?.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      // originalRequest._retry = true;

      try {
        // CALL YOUR SERVICE
        const response = await authService.refresh();

        console.log(response , "response from refresh");
        const newAccessToken = response.accessToken;

        setAuthToken(newAccessToken);

        originalRequest.headers.set(
          "Authorization",
          `Bearer ${newAccessToken}`,
        );

        // retry original request
        return axiosClient(originalRequest);

      } catch (refreshError) {
        setAuthToken(null);
        toast.success("Session expired. Please login again.");
        // window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    const message =
      error.response?.data && typeof error.response.data === "object"
        ? error.response.data.message
        : null;

    return Promise.reject(
      new Error(message ? String(message) : error.message || "Request failed"),
    );
  },
);

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const { body, withCredentials = false, ...config } = options;

  return axiosClient.request<unknown, T>({
    ...config,
    url: path,
    data: body,
    withCredentials,
  });
};