import { apiRequest } from "./axiosClient";

export const variantService = {
  create: (productId: string, body: unknown) =>
    apiRequest<unknown>(
      `/products/${encodeURIComponent(productId)}/variants`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
  delete: (variantId: string) =>
    apiRequest<void>(`/api/variants/${encodeURIComponent(variantId)}`, {
      method: "DELETE",
    }),
};
