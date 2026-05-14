import { apiRequest } from "./axiosClient";

export interface CreateSubcategoryDto {
  categoryId: number;
  name: string;
  description?: string;
}

export const subcategoryService = {
  list: (categoryId: string | number) =>
    apiRequest<unknown[]>(
      `/subcategories`,
    ),
  create: (body: CreateSubcategoryDto) =>
    apiRequest<unknown>("/subcategories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
