import { apiRequest } from "./axiosClient";

export const mediaService = {
  upload: (
    file: File,
    productId: string,
    variantName: string,
    mediaType: string,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId);
    formData.append("variantName", variantName);
    formData.append("mediaType", mediaType);

    return apiRequest<{ url: string }>("/api/media/upload", {
      method: "POST",
      body: formData,
    });
  },
};
