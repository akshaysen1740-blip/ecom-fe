import { useEffect, useMemo, useState } from "react";
import { FolderTree, GitBranch, Layers3, Plus, RefreshCcw } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ── Interfaces matching the exact API response ────────────────────────────────

interface ApiCategory {
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

interface ApiSubcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: number;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safely extract an array from either `data` or the raw response */
const toArray = <T>(res: unknown): T[] => {
  if (Array.isArray(res)) return res as T[];
  const wrapper = res as Record<string, unknown> | null;
  if (wrapper && Array.isArray(wrapper.data)) return wrapper.data as T[];
  return [];
};

// ── Component ─────────────────────────────────────────────────────────────────

const AdminSubcategoriesPage = () => {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<ApiSubcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryDescription, setSubcategoryDescription] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [creating, setCreating] = useState(false);

  // ── Load all categories ─────────────────────────────────────────────────────
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.categories.list();
      const arr = toArray<ApiCategory>(res).filter((c) => c.is_active);
      setCategories(arr);
      // auto-select first category
      if (arr.length > 0 && selectedCategoryId === null) {
        setSelectedCategoryId(arr[arr.length - 1].id); // last = highest id by default
      }
    } catch (err) {
      console.error("Failed to load categories", err);
      toast.error("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  // ── Load ALL subcategories at once, filter client-side ──────────────────────
  const loadSubcategories = async () => {
    setLoadingSubcategories(true);
    try {
      const res = await api.subcategories.list("");
      const arr = toArray<ApiSubcategory>(res);
      setAllSubcategories(arr);
    } catch (err) {
      console.error("Failed to load subcategories", err);
      toast.error("Failed to load subcategories");
    } finally {
      setLoadingSubcategories(false);
    }
  };

  useEffect(() => {
    void loadCategories();
    void loadSubcategories();
  }, []);

  // Client-side filter: only show subcategories for the selected category
  const visibleSubcategories = useMemo(() => {
    if (selectedCategoryId === null) return [];
    return allSubcategories.filter((s) => s.category_id === selectedCategoryId);
  }, [allSubcategories, selectedCategoryId]);

  // ── Create subcategory ──────────────────────────────────────────────────────
  const handleCreateSubcategory = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedCategoryId === null) {
      toast.error("Please select a category");
      return;
    }
    if (!subcategoryName.trim()) {
      toast.error("Please enter a subcategory name");
      return;
    }

    setCreating(true);
    try {
      await api.subcategories.create({
        categoryId: selectedCategoryId,
        name: subcategoryName.trim(),
        description: subcategoryDescription.trim() || undefined,
      });
      toast.success("Subcategory created successfully");
      setSubcategoryName("");
      setSubcategoryDescription("");
      void loadSubcategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to create subcategory");
    } finally {
      setCreating(false);
    }
  };

  // ── Column definitions ──────────────────────────────────────────────────────
  const columns: ColumnDef<ApiSubcategory>[] = [
    {
      header: "Subcategory",
      className: "font-medium w-[35%]",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-muted-foreground">{row.slug}</div>
        </div>
      ),
    },
    {
      header: "Description",
      className: "w-[40%]",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate block max-w-xs">
          {row.description || "—"}
        </span>
      ),
    },
    {
      header: "Status",
      className: "w-[15%]",
      cell: ({ row }) =>
        row.is_active ? (
          <Badge variant="secondary">Active</Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        ),
    },
  ];

  const selectedCategoryName =
    categories.find((c) => c.id === selectedCategoryId)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, system-ui" }}>
          Subcategories
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Create and organize subcategories under each parent category.
        </p>
      </div>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Parent categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-success/10 p-2.5 text-success">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Loaded subcategories</p>
              <p className="text-2xl font-bold">{visibleSubcategories.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-secondary p-2.5 text-foreground">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Current category</p>
              <p className="truncate text-lg font-bold">{selectedCategoryName}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        {/* Create form */}
        <Card className="border-border/60 shadow-md">
          <CardHeader>
            <CardTitle>Create Subcategory</CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose a category first, then add a new subcategory manually.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubcategory} className="space-y-5">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={selectedCategoryId !== null ? String(selectedCategoryId) : ""}
                  onValueChange={(v) => setSelectedCategoryId(Number(v))}
                  disabled={loadingCategories || categories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={loadingCategories ? "Loading categories..." : "Select category"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory-name">Subcategory Name</Label>
                <Input
                  id="subcategory-name"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  placeholder="Enter subcategory name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory-description">Description</Label>
                <Textarea
                  id="subcategory-description"
                  value={subcategoryDescription}
                  onChange={(e) => setSubcategoryDescription(e.target.value)}
                  placeholder="Enter subcategory description"
                  className="min-h-[120px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={creating || selectedCategoryId === null}
              >
                <Plus className="mr-2 h-4 w-4" />
                {creating ? "Creating Subcategory..." : "Create Subcategory"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Subcategory table */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Subcategory List</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review the subcategories mapped to the selected category.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void loadSubcategories()}
              disabled={loadingSubcategories}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {/* Category filter tabs */}
            <div className="mb-4">
              <Select
                value={selectedCategoryId !== null ? String(selectedCategoryId) : ""}
                onValueChange={(v) => setSelectedCategoryId(Number(v))}
                disabled={loadingCategories}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DataTable
              columns={columns}
              data={visibleSubcategories}
              loading={loadingSubcategories}
              searchKey="name"
              searchPlaceholder="Search subcategories..."
              emptyMessage={
                selectedCategoryId === null
                  ? "Select a category to view subcategories"
                  : "No subcategories found for this category"
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSubcategoriesPage;
