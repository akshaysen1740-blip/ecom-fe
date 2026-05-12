import { useState, useEffect } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorSelector } from "./ColorSelector";
import { ShareButton } from "./ShareButton";
import { cn, generateProductSlug } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { useAppSelector } from "@/app/hooks";

interface ProductVariant {
  name: string;
  value: string;
  image_url: string;
  media_type?: 'image' | 'video';
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  variants: ProductVariant[];
  description: string;
  category?: string;
  shippingAmount?: number;
  thumbnail_url?: string;
}

interface ProductCardProps {
  product: Product;
  onOrderPlace: (product: Product, color: string) => void;
}

export const ProductCard = ({ product, onOrderPlace }: ProductCardProps) => {
  const variants = product.variants || [];
  if (variants.length === 0) return null;

  const sortedVariants = [...variants].sort((a, b) =>
    (a.media_type === 'video' ? 1 : 0) - (b.media_type === 'video' ? 1 : 0)
  );

  const [selectedColor, setSelectedColor] = useState(sortedVariants[0]?.name);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const user = useAppSelector((s) => s.auth.user);

  const [userSession] = useState(() => {
    if (typeof window === 'undefined') return null;
    let s = localStorage.getItem('user_session');
    if (!s) { s = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`; localStorage.setItem('user_session', s); }
    return s;
  });

  const currentVariant = sortedVariants.find(v => v.name === selectedColor) || sortedVariants[0];
  const firstImageUrl = sortedVariants.find(v => v.media_type !== 'video')?.image_url;
  const thumbnailUrl = product.thumbnail_url || firstImageUrl || '/placeholder.svg';

  useEffect(() => {
    const fetch = async () => {
      try {
        const counts = await api.engagement.counts(product.id) as any;
        setLikeCount(counts.likeCount || 0);
        setShareCount(counts.shareCount || 0);
        setIsLiked(!!counts.isLiked);
      } catch { /* ignore */ }
    };
    fetch();
  }, [product.id, user, userSession]);

  const handleOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOrderPlace(product, selectedColor);
    toast.success(`${product.name} added to cart!`, {
      description: `Color: ${selectedColor}`,
    });
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isLiked) {
        await api.engagement.unlike(product.id, user ? null : userSession);
        setIsLiked(false);
        setLikeCount(p => Math.max(0, p - 1));
        toast.success("Removed from wishlist");
      } else {
        await api.engagement.like(product.id, user ? null : userSession);
        setIsLiked(true);
        setLikeCount(p => p + 1);
        toast.success("Added to wishlist");
      }
    } catch { toast.error("Failed to update wishlist"); }
  };

  const handleShare = async (_caption: string, shareType = 'general') => {
    try {
      await api.engagement.share(product.id, shareType, user ? null : userSession);
      setShareCount(p => p + 1);
    } catch { /* ignore */ }
  };

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <Link to={`/product/${generateProductSlug(product.name, product.id)}`} className="block group">
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 shadow-sm">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
          {!imgLoaded && <div className="absolute inset-0 skeleton" />}
          <img
            src={thumbnailUrl}
            alt={`${product.name} in ${selectedColor}`}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />

          {/* Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button
              onClick={handleLike}
              className="relative w-8 h-8 rounded-full bg-background/85 backdrop-blur-sm border border-border/50 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <Heart className={cn("h-3.5 w-3.5 transition-colors", isLiked ? "fill-accent text-accent" : "text-muted-foreground")} />
              {likeCount > 0 && (
                <span className="absolute -bottom-1 -right-1 bg-accent text-white text-[9px] rounded-full h-3.5 w-3.5 flex items-center justify-center font-bold">
                  {likeCount}
                </span>
              )}
            </button>
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <ShareButton
                product={product}
                selectedColor={selectedColor}
                currentImage={currentVariant?.image_url || ''}
                shareCount={shareCount}
                onShare={handleShare}
                isDialogOpen={isShareDialogOpen}
                setIsDialogOpen={setIsShareDialogOpen}
              />
            </div>
          </div>

          {discount > 0 && (
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-accent text-white text-xs font-bold shadow-sm">
              -{discount}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm leading-snug line-clamp-1">{product.name}</h3>
            <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{product.description}</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Color: <span className="text-foreground">{selectedColor}</span>
            </p>
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <ColorSelector colors={sortedVariants} selectedColor={selectedColor} onColorSelect={setSelectedColor} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-primary">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
                )}
              </div>
              {product.shippingAmount !== undefined && (
                <p className="text-[11px] text-muted-foreground">
                  {product.shippingAmount === 0
                    ? <span className="text-green-600 font-medium">Free shipping</span>
                    : `+₹${product.shippingAmount} shipping`}
                </p>
              )}
            </div>

            <Button
              size="sm"
              onClick={handleOrder}
              className="rounded-xl gradient-primary border-0 text-white shadow-primary hover:opacity-90 transition-opacity h-9 px-3 text-xs gap-1.5 shrink-0"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};
