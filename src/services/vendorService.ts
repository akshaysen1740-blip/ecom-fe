import { apiRequest } from "./axiosClient";
import type { Vendor } from "./types";

export const vendorService = {
  list: (ids?: string[]) => {
    const query = ids?.length ? `?ids=${encodeURIComponent(ids.join(","))}` : "";
    return apiRequest<Vendor[]>(`/api/vendors${query}`);
  },
  create: (name: string) =>
    apiRequest<Vendor>("/api/vendors", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
};
