import { useEffect, useState } from "react";
import { FolderTree, GitBranch, Layers3, Plus, RefreshCcw } from "lucide-react";
import { api } from "@/services/api";
import type { Category } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CategoryOption {
  id: string;
  name: string;
}

interface SubcategoryRecord {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
}

const AdminSubcategoriesPage = () => {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryDescription, setSubcategoryDescription] = useState("");
  const [subcategories, setSubcategories] = useState<SubcategoryRecord[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [creating, setCreating] = useState(false);

  const normalizeId = (value: unknown) => {
    if (typeof value === "number") return String(value);
    if (typeof value === "string" && value.trim()) return value;
    return "";
  };

  const normalizeCategories = (categoryData: Category[] | undefined) =>
    (categoryData || [])
      .filter((category) => category.is_active === 1 && Boolean(category.name?.trim()))
      .map((category) => ({
        id: String(category.id),
        name: category.name,
      }));

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await api.categories.list();
      const normalized = normalizeCategories(data);
      setCategories(normalized);
      setSelectedCategoryId((current) => {
        if (current && normalized.some((category) => category.id === current)) {
          return current;
        }
        return normalized[0]?.id || "";
      });
    } catch (error) {
      console.error("Failed to load categories", error);
      toast.error("Failed to load categories");
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    setLoadingSubcategories(true);
    try {
      const data = await api.subcategories.list(categoryId);
      const normalized = ((data as any[]) || [])
        .map((subcategory, index) => ({
          id: normalizeId(subcategory.id) || `subcategory-${index}`,
          name:
            (typeof subcategory.name === "string" && subcategory.name.trim()) ||
            `Subcategory ${index + 1}`,
          description:
            typeof subcategory.description === "string" ? subcategory.description : null,
          categoryId: normalizeId(subcategory.categoryId ?? subcategory.category_id) || categoryId,
        }))
        .filter((subcategory) => subcategory.id && subcategory.name);

      setSubcategories(normalized);
    } catch (error) {
      console.error("Failed to load subcategories", error);
      toast.error("Failed to load subcategories");
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      void loadSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  const handleCreateSubcategory = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedCategoryId) {
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
        categoryId: Number(selectedCategoryId),
        name: subcategoryName.trim(),
        description: subcategoryDescription.trim() || undefined,
      });

      toast.success("Subcategory created successfully");
      setSubcategoryName("");
      setSubcategoryDescription("");
      void loadSubcategories(selectedCategoryId);
    } catch (error: any) {
      toast.error(error.message || "Failed to create subcategory");
    } finally {
      setCreating(false);
    }
  };

  const selectedCategoryName =
    categories.find((category) => category.id === selectedCategoryId)?.name || "Category";

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
              <p className="text-2xl font-bold">{subcategories.length}</p>
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
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                  disabled={loadingCategories || categories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingCategories ? "Loading categories..." : "Select category"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
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
                  onChange={(event) => setSubcategoryName(event.target.value)}
                  placeholder="Enter subcategory name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory-description">Description</Label>
                <Textarea
                  id="subcategory-description"
                  value={subcategoryDescription}
                  onChange={(event) => setSubcategoryDescription(event.target.value)}
                  placeholder="Enter subcategory description"
                  className="min-h-[120px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={creating || !selectedCategoryId}
              >
                <Plus className="mr-2 h-4 w-4" />
                {creating ? "Creating Subcategory..." : "Create Subcategory"}
              </Button>
            </form>
          </CardContent>
        </Card>

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
              onClick={() => void loadSubcategories(selectedCategoryId)}
              disabled={!selectedCategoryId || loadingSubcategories}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedCategoryId ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Select a category to view subcategories
                    </TableCell>
                  </TableRow>
                ) : loadingSubcategories ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Loading subcategories...
                    </TableCell>
                  </TableRow>
                ) : subcategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No subcategories found for this category
                    </TableCell>
                  </TableRow>
                ) : (
                  subcategories.map((subcategory) => (
                    <TableRow key={subcategory.id}>
                      <TableCell className="font-medium">{subcategory.name}</TableCell>
                      <TableCell className="max-w-md text-sm text-muted-foreground">
                        {subcategory.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Mapped</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSubcategoriesPage;
