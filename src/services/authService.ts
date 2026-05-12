import { apiRequest } from "./axiosClient";
import type { ApiUser } from "./types";

export const authService = {
  me: () => apiRequest<{ user: ApiUser | null }>("/auth/me"),

  login: (email: string, password: string) =>
    apiRequest<{ user: ApiUser; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      withAuth: false,
      withCredentials: true,
    }),


  signup: (email: string, password: string) =>
    apiRequest<{ user?: ApiUser; token?: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      withAuth: false,
    }),

  logout: () =>
    apiRequest<void>("/auth/logout", {
      method: "POST",
      withCredentials: true,
    }),

  refresh: () => {
    return apiRequest<{ success: string; accessToken: string }>(
      "/auth/refresh",
      {
        method: "POST",
        withAuth: false,
        withCredentials: true,
      },
    );
  },
};
