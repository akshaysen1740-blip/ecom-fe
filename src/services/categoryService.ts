import { apiRequest } from "./axiosClient";
import type { Category } from "./types";

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export const categoryService = {
  list: () => apiRequest<Category[]>("/categories"),
  create: (body: CreateCategoryDto) =>
    apiRequest<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
