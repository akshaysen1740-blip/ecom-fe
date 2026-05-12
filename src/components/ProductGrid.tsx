import { useState, useEffect } from "react";
import { ProductCard } from "./ProductCard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { PackageSearch } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  created_at?: string;
  thumbnail_url?: string;
  variants: { name: string; value: string; image_url?: string; media_type?: string }[];
}

interface ProductGridProps {
  onOrderPlace: (product: Product, color: string) => void;
  selectedCategory?: string;
  searchQuery?: string;
}

const SkeletonCard = () => (
  <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
    <div className="aspect-square skeleton" />
    <div className="p-4 space-y-2.5">
      <div className="h-4 skeleton w-3/4" />
      <div className="h-3 skeleton w-full" />
      <div className="h-3 skeleton w-1/2" />
      <div className="h-8 skeleton w-full mt-3 rounded-xl" />
    </div>
  </div>
);

export const ProductGrid = ({ onOrderPlace, selectedCategory, searchQuery }: ProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastCreatedAt, setLastCreatedAt] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 28;

  const transformProducts = (data: any[] | null | undefined) =>
    data?.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      description: p.description,
      category: p.category,
      created_at: p.created_at,
      thumbnail_url: p.thumbnail_url,
      shipping_type: p.shipping_type || 'free',
      shipping_amount: p.shipping_amount != null ? Number(p.shipping_amount) : null,
      vendor_id: p.vendor_id || null,
      variants: (p.product_variants || p.variants)?.map((v: any) => ({
        name: v.name,
        value: v.value,
        image_url: v.image_url,
        media_type: v.media_type || 'image',
      })) || [],
    })) || [];

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        const data = await api.products.list(`?limit=${PAGE_SIZE}&createdAfter=${encodeURIComponent(cutoff)}&sort=-created_at`);
        const transformed = transformProducts(data);
        setProducts(transformed);
        if (data.length > 0) setLastCreatedAt((data[data.length - 1] as any).created_at || null);
        setHasMore(data.length === PAGE_SIZE);
      } catch {
        toast.error('Failed to load products');
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  const handleLoadMore = async () => {
    if (!lastCreatedAt || loadingMore) return;
    setLoadingMore(true);
    try {
      const more = await api.products.list(`?limit=${PAGE_SIZE}&before=${encodeURIComponent(lastCreatedAt)}&sort=-created_at`);
      if (!more || more.length === 0) { setHasMore(false); return; }
      setProducts(prev => [...prev, ...transformProducts(more)]);
      setLastCreatedAt((more[more.length - 1] as any).created_at || null);
      setHasMore(more.length === PAGE_SIZE);
    } catch {
      toast.error('Failed to load more products');
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  let filtered = selectedCategory && selectedCategory !== 'all'
    ? products.filter(p => p.category === selectedCategory)
    : products;

  if (searchQuery?.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <PackageSearch className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No products found</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          {searchQuery
            ? `No results for "${searchQuery}". Try a different search term.`
            : "No products in this category yet. Check back soon!"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} onOrderPlace={onOrderPlace} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-xl px-8 h-10 border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                Loading…
              </span>
            ) : "Load More Products"}
          </Button>
        </div>
      )}
    </>
  );
};
