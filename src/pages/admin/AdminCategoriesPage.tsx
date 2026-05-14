import { useEffect, useState } from "react";
import { Layers3, Package2, Plus, RefreshCcw, Shapes } from "lucide-react";
import { api } from "@/services/api";
import type { Category } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";


const normalizeCategories = (categoryData: Category[] | undefined) =>
  (categoryData || []).filter(
    (category) => Boolean(category.is_active) && Boolean(category.name?.trim()),
  );

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.categories.list();
      const rawData = (res as any)?.data || res;
      const arr: any[] = Array.isArray(rawData) ? rawData : [];
      setCategories(normalizeCategories(arr));
    } catch (error) {
      console.error("Failed to load category data", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateCategory = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!categoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    setCreating(true);
    try {
      await api.categories.create({
        name: categoryName.trim(),
        description: categoryDescription.trim() || undefined,
      });

      toast.success("Category created successfully");
      setCategoryName("");
      setCategoryDescription("");
      void loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create category");
    } finally {
      setCreating(false);
    }
  };

  const catalogCategories = categories;
  const totalMappedProducts = categories.reduce((sum, c) => sum + (((c as any).product_count) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, system-ui" }}>
          Categories
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Create categories manually and review your top-level catalog structure.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Visible categories</p>
              <p className="text-2xl font-bold">{catalogCategories.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-success/10 p-2.5 text-success">
              <Package2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Products mapped</p>
              <p className="text-2xl font-bold">{totalMappedProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-warning/10 p-2.5 text-warning-foreground">
              <Shapes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Unmapped products</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="border-border/60 shadow-md">
          <CardHeader>
            <CardTitle>Create Category</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add a new parent category to organize products and subcategories.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCategory} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <Textarea
                  id="category-description"
                  value={categoryDescription}
                  onChange={(event) => setCategoryDescription(event.target.value)}
                  placeholder="Enter category description"
                  className="min-h-[120px]"
                />
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={creating}>
                <Plus className="mr-2 h-4 w-4" />
                {creating ? "Creating Category..." : "Create Category"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-md">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Category Catalog</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review the active categories used in your storefront and admin flows.
              </p>
            </div>
            <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { header: "Category", accessorKey: "name", className: "font-medium" },
                {
                  header: "Description",
                  cell: ({ row }) => (
                    <span className="max-w-md text-sm text-muted-foreground">
                      {row.description || "-"}
                    </span>
                  ),
                },
                {
                  header: "Status",
                  cell: () => <Badge variant="secondary">Active</Badge>,
                },
                {
                  header: "Products",
                  cell: ({ row }) =>
                    (row as any).product_count ?? "-",
                },
              ]}
              data={catalogCategories}
              searchKey="name"
              searchPlaceholder="Search categories..."
              emptyMessage="No categories found"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
