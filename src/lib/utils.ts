import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateProductSlug(productName: string, productId: string): string {
  const slugName = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end

  // Use a short part of the product ID to ensure uniqueness
  const shortId = productId.substring(0, 8); 

  return `${slugName}-${shortId}`;
}
