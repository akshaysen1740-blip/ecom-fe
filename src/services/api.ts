export {
  apiRequest,
  axiosClient,
  getAuthToken,
  setAuthToken,
} from "./axiosClient";
export type { ApiRequestOptions } from "./axiosClient";
export type { ApiUser, Category, Subcategory, Vendor } from "./types";

export { authService } from "./authService";
export { categoryService } from "./categoryService";
export { engagementService } from "./engagementService";
export { mediaService } from "./mediaService";
export { productService } from "./productService";
export { subcategoryService } from "./subcategoryService";
export { variantService } from "./variantService";
export { vendorService } from "./vendorService";

import { authService } from "./authService";
import { categoryService } from "./categoryService";
import { engagementService } from "./engagementService";
import { mediaService } from "./mediaService";
import { productService } from "./productService";
import { subcategoryService } from "./subcategoryService";
import { variantService } from "./variantService";
import { vendorService } from "./vendorService";

export const api = {
  auth: authService,
  categories: categoryService,
  subcategories: subcategoryService,
  products: productService,
  variants: variantService,
  vendors: vendorService,
  media: mediaService,
  engagement: engagementService,
};
