import { useEffect, useState } from "react";
import {
  Edit2,
  Image as ImageIcon,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import type { CreateProductDto } from "@/services/productService";
import type { Subcategory } from "@/services/types";
import { adminCategoryOptions } from "@/components/admin/admin-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ProductVariant {
  id?: string;
  name: string;
  value: string;
  image_url: string;
  media_type?: "image" | "video";
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  shipping_type?: "free" | "flat" | "calculated";
  shipping_amount?: number | null;
  vendor_id?: string | null;
  variants: ProductVariant[];
  created_at: string;
}

interface Vendor {
  id: string;
  name: string;
}

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

interface CategoryOption {
  id: string;
  name: string;
}

interface SubcategoryOption extends Subcategory {}

const AdminProductsPage = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [createProductForm, setCreateProductForm] =
    useState<CreateProductFormState>(initialCreateProductForm);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [newVendorName, setNewVendorName] = useState("");
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVariants, setEditingVariants] = useState<ProductVariant[]>([]);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantValue, setNewVariantValue] = useState("");
  const [newVariantFile, setNewVariantFile] = useState<File | null>(null);
  const [newVariantMediaType, setNewVariantMediaType] = useState<"image" | "video">("image");
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [variantToDelete, setVariantToDelete] = useState<{ productId: string; variantId: string } | null>(null);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await api.products.list("?sort=-created_at");
      const transformedProducts: Product[] = (data || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        description: product.description || "",
        category: product.category || "",
        shipping_type: product.shipping_type || "free",
        shipping_amount:
          product.shipping_amount != null ? Number(product.shipping_amount) : null,
        vendor_id: product.vendor_id || null,
        variants: (product.product_variants || product.variants || []).map((variant: any) => ({
          id: variant.id,
          name: variant.name,
          value: variant.value,
          image_url: variant.image_url,
          media_type: variant.media_type === "video" ? "video" : "image",
        })),
        created_at: product.created_at,
      }));

      setProducts(transformedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (activeTab === "manage" || activeTab === "vendors") {
      fetchProducts();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const data = await api.vendors.list();
        setVendors(data || []);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };

    fetchVendors();
  }, []);

  useEffect(() => {
    const normalizeId = (value: unknown) => {
      if (typeof value === "number") {
        return String(value);
      }

      if (typeof value === "string" && value.trim()) {
        return value;
      }

      return "";
    };

    const normalizeName = (value: unknown, fallback: string) => {
      if (typeof value === "string" && value.trim()) {
        return value;
      }

      return fallback;
    };

    const fetchCatalogMeta = async () => {
      const categoryResult = await api.categories.list().then(
        (value) => ({ status: "fulfilled" as const, value }),
        (reason) => ({ status: "rejected" as const, reason }),
      );

      if (categoryResult.status === "fulfilled") {
        const normalizedCategories = (categoryResult.value || [])
          .filter((category) => category.is_active === 1)
          .map((category, index) => ({
            id: normalizeId(category.id),
            name: normalizeName(category.name, `Category ${index + 1}`),
          }))
          .filter((category) => category.id);

        setCategories(normalizedCategories);
      } else {
        console.error("Error fetching categories:", categoryResult.reason);
        setCategories([]);
        toast.error("Failed to load categories");
      }
    };

    void fetchCatalogMeta();
  }, []);

  useEffect(() => {
    const normalizeId = (value: unknown) => {
      if (typeof value === "number") {
        return String(value);
      }

      if (typeof value === "string" && value.trim()) {
        return value;
      }

      return "";
    };

    const normalizeName = (value: unknown, fallback: string) => {
      if (typeof value === "string" && value.trim()) {
        return value;
      }

      return fallback;
    };

    const fetchSubcategories = async () => {
      if (!createProductForm.categoryId) {
        setSubcategories([]);
        return;
      }

      setLoadingSubcategories(true);

      try {
        const data = await api.subcategories.list(createProductForm.categoryId);
        const normalizedSubcategories = (data || [])
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

  const availableSubcategories = subcategories;

  const updateCreateProductForm = (
    field: keyof CreateProductFormState,
    value: string,
  ) => {
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

  const uploadMedia = async (
    file: File,
    productId: string,
    variantName: string,
    mediaType: "image" | "video",
  ) => {
    const { url } = await api.media.upload(file, productId, variantName, mediaType);
    return url;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const subcategoryId = Number(createProductForm.subcategoryId);
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
      setActiveTab("manage");
      void fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateVendor = async () => {
    if (!newVendorName.trim()) {
      toast.error("Please enter a vendor name");
      return;
    }

    setIsCreatingVendor(true);
    try {
      const vendor = await api.vendors.create(newVendorName.trim());
      setVendors((current) => [...current, vendor]);
      setNewVendorName("");
      toast.success("Vendor created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create vendor");
    } finally {
      setIsCreatingVendor(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditingVariants([...product.variants]);
    setIsEditDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) {
      return;
    }

    try {
      await api.products.update(editingProduct.id, {
        name: editingProduct.name,
        price: editingProduct.price,
        description: editingProduct.description,
        category: editingProduct.category,
        shipping_type: editingProduct.shipping_type,
        shipping_amount:
          editingProduct.shipping_type === "flat"
            ? editingProduct.shipping_amount || 0
            : null,
        vendor_id: editingProduct.vendor_id || null,
      });

      toast.success("Product updated successfully!");
      setIsEditDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) {
      return;
    }

    try {
      await api.products.delete(productToDelete);
      toast.success("Product deleted successfully!");
      setProductToDelete(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    }
  };

  const handleAddVariant = async () => {
    if (!editingProduct || !newVariantName || !newVariantFile) {
      toast.error("Please fill in variant name and select a file");
      return;
    }

    try {
      const mediaUrl = await uploadMedia(
        newVariantFile,
        editingProduct.id,
        newVariantName,
        newVariantMediaType,
      );

      const variant = (await api.variants.create(editingProduct.id, {
        name: newVariantName,
        value: newVariantValue || newVariantName.toLowerCase(),
        image_url: mediaUrl,
        media_type: newVariantMediaType,
      })) as ProductVariant;

      setEditingVariants((current) => [
        ...current,
        {
          id: variant.id,
          name: variant.name,
          value: variant.value,
          image_url: variant.image_url || "",
          media_type: variant.media_type === "video" ? "video" : "image",
        },
      ]);
      setNewVariantName("");
      setNewVariantValue("");
      setNewVariantFile(null);
      setNewVariantMediaType("image");
      toast.success("Variant added successfully!");
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to add variant");
    }
  };

  const handleDeleteVariant = async () => {
    if (!variantToDelete) {
      return;
    }

    try {
      await api.variants.delete(variantToDelete.variantId);
      setEditingVariants((current) =>
        current.filter((variant) => variant.id !== variantToDelete.variantId),
      );
      setVariantToDelete(null);
      toast.success("Variant deleted successfully!");
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete variant");
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, system-ui' }}>Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your catalog, variants, and vendors</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/8 border border-primary/15">
            <PackagePlus className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{products.length}</span>
            <span className="text-xs text-muted-foreground">products</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border/60">
            <span className="text-sm font-semibold">{vendors.length}</span>
            <span className="text-xs text-muted-foreground">vendors</span>
          </div>
        </div>
      </div>

      <Card className="border-border/60 shadow-md">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-11 rounded-xl">
              <TabsTrigger value="create">Create Product</TabsTrigger>
              <TabsTrigger value="manage">Manage Products</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6 pt-6">
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
                      onValueChange={(value) =>
                        updateCreateProductForm("subcategoryId", value)
                      }
                      disabled={!createProductForm.categoryId || loadingSubcategories}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !createProductForm.categoryId
                              ? "Select category first"
                              : loadingSubcategories
                              ? "Loading subcategories..."
                              : availableSubcategories.length > 0
                              ? "Select subcategory"
                              : "No subcategories found"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubcategories.map((subcategory) => (
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
                      onChange={(event) =>
                        updateCreateProductForm("comparePrice", event.target.value)
                      }
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
                    onChange={(event) =>
                      handleThumbnailSelect(event.target.files?.[0] || null)
                    }
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
                    onChange={(event) =>
                      updateCreateProductForm("description", event.target.value)
                    }
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
            </TabsContent>

            <TabsContent value="manage" className="space-y-6 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-10"
                  />
                </div>
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

              {loadingProducts ? (
                <div className="py-8 text-center">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No products found</div>
              ) : (
                <div className="overflow-hidden rounded-2xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Variants</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="line-clamp-2 text-sm text-muted-foreground">
                                {product.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">Rs. {product.price}</TableCell>
                          <TableCell>{product.category || "-"}</TableCell>
                          <TableCell>{product.variants.length}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit2 className="mr-1 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setProductToDelete(product.id)}
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="vendors" className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold">Manage Vendors</h3>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="New vendor name"
                      value={newVendorName}
                      onChange={(event) => setNewVendorName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleCreateVendor();
                        }
                      }}
                      className="sm:w-56"
                    />
                    <Button
                      onClick={handleCreateVendor}
                      disabled={isCreatingVendor || !newVendorName.trim()}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Vendor
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Products Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground">
                            No vendors yet. Create one to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        vendors.map((vendor) => (
                          <TableRow key={vendor.id}>
                            <TableCell className="font-medium">{vendor.name}</TableCell>
                            <TableCell>
                              {products.filter((product) => product.vendor_id === vendor.id).length}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details and manage variants.
            </DialogDescription>
          </DialogHeader>

          {editingProduct ? (
            <div className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    value={editingProduct.name}
                    onChange={(event) =>
                      setEditingProduct({ ...editingProduct, name: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(event) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: parseFloat(event.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editingProduct.category}
                  onValueChange={(value) =>
                    setEditingProduct({ ...editingProduct, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminCategoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Shipping Type</Label>
                  <Select
                    value={editingProduct.shipping_type || "free"}
                    onValueChange={(value: "free" | "flat" | "calculated") =>
                      setEditingProduct({ ...editingProduct, shipping_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="calculated">Calculated at checkout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingProduct.shipping_type === "flat" ? (
                  <div className="space-y-2">
                    <Label>Shipping Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct.shipping_amount ?? 0}
                      onChange={(event) =>
                        setEditingProduct({
                          ...editingProduct,
                          shipping_amount: parseFloat(event.target.value),
                        })
                      }
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Select
                    value={editingProduct.vendor_id || ""}
                    onValueChange={(value) =>
                      setEditingProduct({ ...editingProduct, vendor_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingProduct.description}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: event.target.value,
                    })
                  }
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Variants</Label>
                  <Button onClick={handleSaveProduct} size="sm">
                    Save Product
                  </Button>
                </div>

                <div className="space-y-4 rounded-2xl border p-4">
                  <div className="text-sm font-medium">Add New Variant</div>
                  <div className="grid gap-2 md:grid-cols-5">
                    <Input
                      placeholder="Variant name"
                      value={newVariantName}
                      onChange={(event) => setNewVariantName(event.target.value)}
                    />
                    <Input
                      placeholder="Variant value"
                      value={newVariantValue}
                      onChange={(event) => setNewVariantValue(event.target.value)}
                    />
                    <Select
                      value={newVariantMediaType}
                      onValueChange={(value: "image" | "video") =>
                        setNewVariantMediaType(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="file"
                      accept={newVariantMediaType === "video" ? "video/*" : "image/*"}
                      onChange={(event) => setNewVariantFile(event.target.files?.[0] || null)}
                    />
                    <Button onClick={handleAddVariant} size="sm">
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {editingVariants.map((variant) => (
                    <Card key={variant.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {variant.media_type === "video" ? (
                            <Video className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium">{variant.name}</div>
                            <div className="text-sm text-muted-foreground">{variant.value}</div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            variant.id &&
                            setVariantToDelete({
                              productId: editingProduct.id,
                              variantId: variant.id,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product and all its variants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!variantToDelete}
        onOpenChange={(open) => !open && setVariantToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this variant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVariantToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVariant}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProductsPage;
