export interface ApiUser {
  id: string;
  email?: string | null;
  role?: string | null;
  [key: string]: unknown;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: number;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Vendor {
  id: string;
  name: string;
}
