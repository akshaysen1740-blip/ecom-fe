import {
  Boxes,
  FolderKanban,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

export const adminCategoryOptions = [
  "Earrings",
  "Clothing",
  "Home & Garden",
  "Sports & Fitness",
  "Beauty & Health",
  "Automotive",
  "Books & Media",
  "Toys & Games",
  "Food & Beverage",
  "Other",
] as const;

export interface AdminNavItem {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
}

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Category",
    description: "Organize top-level catalog groups",
    to: "/admin/category",
    icon: LayoutGrid,
  },
  {
    title: "Subcategory",
    description: "Plan deeper catalog structure",
    to: "/admin/subcategory",
    icon: FolderKanban,
  },
  {
    title: "Product",
    description: "Create and manage sellable items",
    to: "/admin/product",
    icon: Boxes,
  },
];
