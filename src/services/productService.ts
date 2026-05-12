import { apiRequest } from "./axiosClient";

export interface CreateProductDto {
  subcategoryId: number;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  comparePrice?: number;
  stock?: number;
  thumbnailUrl?: string;
}

export interface CreateProductResponse {
  id?: string | number;
  name?: string;
  message?: string;
  [key: string]: unknown;
}

export const productService = {
  list: (query = "") => apiRequest<unknown[]>(`products${query}`),
  getBySlug: (slug: string) =>
    apiRequest<unknown>(`products/${encodeURIComponent(slug)}`),
  create: (body: CreateProductDto) =>
    apiRequest<CreateProductResponse>("products", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: unknown) =>
    apiRequest<void>(`products/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    apiRequest<void>(`products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
