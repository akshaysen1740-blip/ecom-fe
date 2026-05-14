import { useEffect, useState } from "react";
import { PackagePlus, Video, Image as ImageIcon, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { adminCategoryOptions } from "@/components/admin/admin-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreateProduct } from "./components/CreateProduct";
import { ManageProducts, Product, ProductVariant } from "./components/ManageProducts";
import { ManageVendors, Vendor } from "./components/ManageVendors";

const AdminProductsPage = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
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
      const response = await api.products.list("?sort=-created_at");
      const rawData = (response as any)?.data || response;
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1").replace(/\/api\/v1$/, "");
      const transformedProducts: Product[] = (rawData || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        description: product.description || "",
        category: product.category || "",
        thumbnail_url: product.thumbnail_url
          ? product.thumbnail_url.startsWith("http")
            ? product.thumbnail_url
            : `${API_BASE}${product.thumbnail_url}`
          : null,
        shipping_type: product.shipping_type || "free",
        shipping_amount:
          product.shipping_amount != null ? Number(product.shipping_amount) : null,
        vendor_id: product.vendor_id || null,
        variants: (product.product_variants || product.variants || []).map((variant: any) => ({
          id: variant.id,
          name: variant.name,
          value: variant.value,
          image_url: variant.image_url
            ? variant.image_url.startsWith("http")
              ? variant.image_url
              : `${API_BASE}${variant.image_url}`
            : variant.image_url,
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

  const fetchVendors = async () => {
    try {
      const response = await api.vendors.list();
      const rawData = (response as any)?.data || response;
      setVendors(rawData || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "manage" || activeTab === "vendors") {
      fetchProducts();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchVendors();
  }, []);

  const uploadMedia = async (
    file: File,
    productId: string,
    variantName: string,
    mediaType: "image" | "video",
  ) => {
    const { url } = await api.media.upload(file, productId, variantName, mediaType);
    return url;
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

  const getVendorProductCount = (vendorId: string) => {
    return products.filter((product) => product.vendor_id === vendorId).length;
  };

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
              <CreateProduct 
                onProductCreated={() => {
                  setActiveTab("manage");
                  fetchProducts();
                }} 
              />
            </TabsContent>

            <TabsContent value="manage" className="space-y-6 pt-6">
              <ManageProducts 
                products={products}
                loading={loadingProducts}
                onViewProduct={setViewingProduct}
                onEditProduct={handleEditProduct}
                onDeleteProduct={(id) => setProductToDelete(id)}
              />
            </TabsContent>

            <TabsContent value="vendors" className="space-y-6 pt-6">
              <ManageVendors 
                vendors={vendors}
                onVendorCreated={fetchVendors}
                getVendorProductCount={getVendorProductCount}
              />
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

      <Dialog open={!!viewingProduct} onOpenChange={(open) => !open && setViewingProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              {/* Thumbnail */}
              {viewingProduct.thumbnail_url && (
                <div className="flex justify-center">
                  <img
                    src={viewingProduct.thumbnail_url}
                    alt={viewingProduct.name}
                    className="h-48 w-full rounded-xl object-cover border bg-muted"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Product Name</Label>
                <div className="font-medium">{viewingProduct.name}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Price</Label>
                  <div className="font-medium">Rs. {viewingProduct.price}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <div className="font-medium">{viewingProduct.category || "-"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Variants</Label>
                  <div className="font-medium">{viewingProduct.variants.length}</div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <div className="text-sm mt-1 bg-muted/50 p-3 rounded-lg border">
                  {viewingProduct.description || "No description provided."}
                </div>
              </div>
              {viewingProduct.variants.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Variants</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                    {viewingProduct.variants.map((variant) => (
                      <div key={variant.id} className="rounded-xl border bg-muted/30 overflow-hidden">
                        {variant.media_type === "video" ? (
                          <video
                            src={variant.image_url}
                            className="h-28 w-full object-cover"
                            muted
                            playsInline
                            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                            onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                          />
                        ) : (
                          <img
                            src={variant.image_url}
                            alt={variant.name}
                            className="h-28 w-full object-cover bg-muted"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "";
                              (e.target as HTMLImageElement).className = "h-28 w-full flex items-center justify-center bg-muted";
                            }}
                          />
                        )}
                        <div className="p-2">
                          <div className="font-medium text-sm truncate">{variant.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{variant.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingProduct(null)}>
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
