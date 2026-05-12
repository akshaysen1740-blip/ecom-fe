import { apiRequest } from "./axiosClient";

export const engagementService = {
  counts: (productId: string) =>
    apiRequest<{
      likeCount?: number;
      shareCount?: number;
      isLiked?: boolean;
    }>(`/api/products/${encodeURIComponent(productId)}/engagement`),
  like: (productId: string, userSession: string | null) =>
    apiRequest<void>(`/api/products/${encodeURIComponent(productId)}/likes`, {
      method: "POST",
      body: JSON.stringify({ userSession }),
    }),
  unlike: (productId: string, userSession: string | null) =>
    apiRequest<void>(`/api/products/${encodeURIComponent(productId)}/likes`, {
      method: "DELETE",
      body: JSON.stringify({ userSession }),
    }),
  share: (productId: string, shareType: string, userSession: string | null) =>
    apiRequest<void>(`/api/products/${encodeURIComponent(productId)}/shares`, {
      method: "POST",
      body: JSON.stringify({ shareType, userSession }),
    }),
};
