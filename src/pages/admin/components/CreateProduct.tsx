import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import type { CreateProductDto } from "@/services/productService";
import type { Subcategory } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CategoryOption {
  id: string;
  name: string;
}

interface SubcategoryOption extends Subcategory {}

interface CreateProductFormState {
  categoryId: string;
  subcategoryId: string;
  name: string;
  description: string;
  sku: string;
  price: string;
  comparePrice: string;
  stock: string;
  thumbnailUrl: string;
}

const initialCreateProductForm: CreateProductFormState = {
  categoryId: "",
  subcategoryId: "",
  name: "",
  description: "",
  sku: "",
  price: "",
  comparePrice: "",
  stock: "",
  thumbnailUrl: "",
};

interface CreateProductProps {
  onProductCreated: () => void;
}

export function CreateProduct({ onProductCreated }: CreateProductProps) {
  const [createProductForm, setCreateProductForm] = useState<CreateProductFormState>(initialCreateProductForm);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const normalizeId = (value: unknown) => {
      if (typeof value === "number") return String(value);
      if (typeof value === "string" && value.trim()) return value;
      return "";
    };

    const normalizeName = (value: unknown, fallback: string) => {
      if (typeof value === "string" && value.trim()) return value;
      return fallback;
    };

    const fetchCatalogMeta = async () => {
      try {
        const response = await api.categories.list();
        const rawData = (response as any)?.data || response;
        const normalizedCategories = (rawData || [])
          .filter((category) => Boolean(category.is_active))
          .map((category, index) => ({
            id: normalizeId(category.id),
            name: normalizeName(category.name, `Category ${index + 1}`),
          }))
          .filter((category) => category.id);

        setCategories(normalizedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
        toast.error("Failed to load categories");
      }
    };

    void fetchCatalogMeta();
  }, []);

  useEffect(() => {
    const normalizeId = (value: unknown) => {
      if (typeof value === "number") return String(value);
      if (typeof value === "string" && value.trim()) return value;
      return "";
    };

    const normalizeName = (value: unknown, fallback: string) => {
      if (typeof value === "string" && value.trim()) return value;
      return fallback;
    };

    const fetchSubcategories = async () => {
      if (!createProductForm.categoryId) {
        setSubcategories([]);
        return;
      }

      setLoadingSubcategories(true);

      try {
        const response = await api.subcategories.list(createProductForm.categoryId);
        const rawData = (response as any)?.data || response;
        const normalizedSubcategories = (rawData || [])
          .map((subcategory: any, index) => ({
            id: normalizeId(subcategory.id),
            name: normalizeName(subcategory.name, `Subcategory ${index + 1}`),
            categoryId: normalizeId(subcategory.categoryId ?? subcategory.category_id),
          }))
          .filter((subcategory) => subcategory.id);

        setSubcategories(normalizedSubcategories);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        setSubcategories([]);
        toast.error("Failed to load subcategories");
      } finally {
        setLoadingSubcategories(false);
      }
    };

    void fetchSubcategories();
  }, [createProductForm.categoryId]);

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
    };
  }, [thumbnailPreviewUrl]);

  const updateCreateProductForm = (field: keyof CreateProductFormState, value: string) => {
    setCreateProductForm((current) => {
      if (field === "categoryId") {
        return {
          ...current,
          categoryId: value,
          subcategoryId: "",
        };
      }
      return {
        ...current,
        [field]: value,
      };
    });
  };

  const handleThumbnailSelect = (file: File | null) => {
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
      setThumbnailPreviewUrl("");
    }

    if (!file) {
      updateCreateProductForm("thumbnailUrl", "");
      return;
    }

    const sanitizedName = file.name.replace(/\s+/g, "-");
    const localPath = `/uploads/thumbnails/${Date.now()}-${sanitizedName}`;

    setThumbnailPreviewUrl(URL.createObjectURL(file));
    updateCreateProductForm("thumbnailUrl", localPath);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const subcategoryId = Number(createProductForm.subcategoryId);
    const categoryId = Number(createProductForm.categoryId);
    const price = Number(createProductForm.price);
    const comparePrice = createProductForm.comparePrice
      ? Number(createProductForm.comparePrice)
      : undefined;
    const stock = createProductForm.stock ? Number(createProductForm.stock) : undefined;

    if (!createProductForm.categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (!Number.isInteger(subcategoryId) || subcategoryId <= 0) {
      toast.error("Please select a valid subcategory");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.error("Please enter a valid product price");
      return;
    }

    if (comparePrice != null && (!Number.isFinite(comparePrice) || comparePrice < 0)) {
      toast.error("Please enter a valid compare price");
      return;
    }

    if (stock != null && (!Number.isInteger(stock) || stock < 0)) {
      toast.error("Please enter a valid stock quantity");
      return;
    }

    setSubmitting(true);

    try {
      const payload: CreateProductDto = {
        subcategoryId,
        categoryId,
        name: createProductForm.name.trim(),
        price,
      };

      if (createProductForm.description.trim()) {
        payload.description = createProductForm.description.trim();
      }

      if (createProductForm.sku.trim()) {
        payload.sku = createProductForm.sku.trim();
      }

      if (comparePrice != null) {
        payload.comparePrice = comparePrice;
      }

      if (stock != null) {
        payload.stock = stock;
      }

      if (createProductForm.thumbnailUrl.trim()) {
        payload.thumbnailUrl = createProductForm.thumbnailUrl.trim();
      }

      const createdProduct = await api.products.create(payload);

      toast.success(
        createdProduct?.id != null
          ? `Product created successfully with ID ${createdProduct.id}`
          : createdProduct?.message || "Product created successfully!",
      );
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
        setThumbnailPreviewUrl("");
      }
      setCreateProductForm(initialCreateProductForm);
      onProductCreated();
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={createProductForm.categoryId}
            onValueChange={(value) => updateCreateProductForm("categoryId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
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
          <Label>Subcategory</Label>
          <Select
            value={createProductForm.subcategoryId}
            onValueChange={(value) => updateCreateProductForm("subcategoryId", value)}
            disabled={!createProductForm.categoryId || loadingSubcategories}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !createProductForm.categoryId
                    ? "Select category first"
                    : loadingSubcategories
                    ? "Loading subcategories..."
                    : subcategories.length > 0
                    ? "Select subcategory"
                    : "No subcategories found"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((subcategory) => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-name">Product Name</Label>
          <Input
            id="product-name"
            value={createProductForm.name}
            onChange={(event) => updateCreateProductForm("name", event.target.value)}
            placeholder="Enter product name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-sku">SKU</Label>
          <Input
            id="product-sku"
            value={createProductForm.sku}
            onChange={(event) => updateCreateProductForm("sku", event.target.value)}
            placeholder="Enter SKU"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="product-price">Price</Label>
          <Input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            value={createProductForm.price}
            onChange={(event) => updateCreateProductForm("price", event.target.value)}
            placeholder="Enter price"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="compare-price">Compare Price</Label>
          <Input
            id="compare-price"
            type="number"
            min="0"
            step="0.01"
            value={createProductForm.comparePrice}
            onChange={(event) => updateCreateProductForm("comparePrice", event.target.value)}
            placeholder="Enter compare price"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-stock">Stock</Label>
          <Input
            id="product-stock"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={createProductForm.stock}
            onChange={(event) => updateCreateProductForm("stock", event.target.value)}
            placeholder="Enter stock quantity"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnail-file">Thumbnail Image</Label>
        <Input
          id="thumbnail-file"
          type="file"
          accept="image/*"
          onChange={(event) => handleThumbnailSelect(event.target.files?.[0] || null)}
        />
        <Input
          value={createProductForm.thumbnailUrl}
          placeholder="Generated local thumbnail path"
          readOnly
        />
        {thumbnailPreviewUrl ? (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-secondary/30 p-2">
            <img
              src={thumbnailPreviewUrl}
              alt="Thumbnail preview"
              className="h-28 w-28 rounded-lg object-cover"
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-description">Description</Label>
        <Textarea
          id="product-description"
          value={createProductForm.description}
          onChange={(event) => updateCreateProductForm("description", event.target.value)}
          placeholder="Enter product description"
          className="min-h-[120px]"
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 text-sm text-muted-foreground">
        The create form sends only the generated thumbnail path in the payload.
        The selected image is previewed locally in the browser for now.
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating Product..." : "Create Product"}
      </Button>
    </form>
  );
}
