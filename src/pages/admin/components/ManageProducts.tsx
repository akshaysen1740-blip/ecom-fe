import { useState } from "react";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminCategoryOptions } from "@/components/admin/admin-config";

// We duplicate this here or import it from the parent. Better to import the shared type, but for now we define it.
// Assuming the parent imports it too or we can just define it inline since it's a prop type.
export interface ProductVariant {
  id?: string;
  name: string;
  value: string;
  image_url: string;
  media_type?: "image" | "video";
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  thumbnail_url?: string | null;
  shipping_type?: "free" | "flat" | "calculated";
  shipping_amount?: number | null;
  vendor_id?: string | null;
  variants: ProductVariant[];
  created_at: string;
}

interface ManageProductsProps {
  products: Product[];
  loading: boolean;
  onViewProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export function ManageProducts({
  products,
  loading,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
}: ManageProductsProps) {
  const [filterCategory, setFilterCategory] = useState("all");

  const filteredProducts = products.filter((product) => {
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    return matchesCategory;
  });

  const columns: ColumnDef<Product>[] = [
    {
      header: "Product",
      className: "w-[45%] max-w-[380px]",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 overflow-hidden">
          {row.thumbnail_url ? (
            <img
              src={row.thumbnail_url}
              alt={row.name}
              className="h-10 w-10 rounded-lg object-cover border bg-muted shrink-0"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.style.display = "none";
                (t.nextElementSibling as HTMLElement | null)?.removeAttribute("hidden");
              }}
            />
          ) : null}
          <div className="overflow-hidden">
            <div className="font-medium truncate" title={row.name}>{row.name}</div>
            <div className="truncate text-sm text-muted-foreground" title={row.description}>
              {row.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      className: "w-[15%]",
      cell: ({ row }) => <span className="font-semibold">Rs. {row.price}</span>,
    },
    {
      header: "Category",
      className: "w-[20%]",
      accessorKey: "category",
      cell: ({ row }) => row.category || "-",
    },
    {
      header: "Variants",
      className: "w-[10%]",
      cell: ({ row }) => row.variants.length,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {adminCategoryOptions.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        searchKey="name"
        searchPlaceholder="Search products by name..."
        onView={onViewProduct}
        onEdit={onEditProduct}
        onDelete={(row) => onDeleteProduct(row.id)}
      />
    </div>
  );
}
