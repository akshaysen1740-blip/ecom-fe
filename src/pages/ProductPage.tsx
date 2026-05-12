import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ColorSelector } from "@/components/ColorSelector";
import { cn, generateProductSlug } from "@/lib/utils";
import { MiniCart } from "@/components/MiniCart";
import { ShareButton } from "@/components/ShareButton";
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
  shipping_type?: 'free' | 'flat' | 'calculated';
  shipping_amount?: number | null;
  vendor_id?: string | null;
}

interface CartItem {
  productId: string;
  color: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendorId?: string | null;
  shipping_type?: 'free' | 'flat' | 'calculated';
  shipping_amount?: number | null;
}

const ProductPage = () => {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const user = useAppSelector((state) => state.auth.user);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false); // State for controlling the ShareButton dialog
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [userSession] = useState(() => {
    if (typeof window !== 'undefined') {
      let session = localStorage.getItem('user_session');
      if (!session) {
        session = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('user_session', session);
      }
      return session;
    }
    return null;
  });

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!product) return;
      try {
        const counts = await api.engagement.counts(product.id);
        setLikeCount(counts.likeCount || 0);
        setShareCount(counts.shareCount || 0);
        setIsLiked(!!counts.isLiked);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    if (product) {
      fetchCounts();
      
      if (product.vendor_id) {
        api.vendors.list([product.vendor_id]).then((data) => {
          setVendorName(data[0]?.name || null);
        });
      }
    }
  }, [product, user, userSession]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        let foundProduct = await api.products.getBySlug(productSlug);

        if (!foundProduct) {
          const allProducts = await api.products.list();
          foundProduct = allProducts.find((p: any) => generateProductSlug(p.name, p.id) === productSlug);
        }

        if (foundProduct) {
          const productData = foundProduct as any;
          const variants = productData.variants || productData.product_variants || [];
          setProduct({ ...productData, variants } as Product);
          setSelectedColor(variants[0]?.name || null);
        } else {
          setError("Product not found.");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    if (productSlug) {
      fetchProduct();
    }
  }, [productSlug]);

  // Sort variants so images come first and videos last
  const sortedVariants = product?.variants
    ? [...product.variants].sort((a, b) => {
        const aIsVideo = a.media_type === 'video' ? 1 : 0;
        const bIsVideo = b.media_type === 'video' ? 1 : 0;
        return aIsVideo - bIsVideo;
      })
    : [];

  const currentVariant = sortedVariants.find(v => v.name === selectedColor) || sortedVariants[0];
  
  const handleAddToCart = () => {
    if (product && selectedColor && currentVariant) {
      const existingItemIndex = cartItems.findIndex(
        (item) => item.productId === product.id && item.color === selectedColor
      );

      const updatedCart = [...cartItems];

      if (existingItemIndex > -1) {
        updatedCart[existingItemIndex].quantity += 1;
      } else {
        updatedCart.push({
          productId: product.id,
          color: selectedColor,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: currentVariant.image_url,
          vendorId: product.vendor_id || null,
          shipping_type: product.shipping_type || 'flat',
          shipping_amount: product.shipping_amount || null,
        });
      }
      setCartItems(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      toast.success(`${product.name} in ${selectedColor} added to cart!`);
    } else {
      toast.error("Please select a color.");
    }
  };

  const handleLike = async () => {
    if (!product) return;
    try {
      if (isLiked) {
        await api.engagement.unlike(product.id, user ? null : userSession);
        
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        toast.success("Removed from wishlist");
      } else {
        await api.engagement.like(product.id, user ? null : userSession);
        
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error("Failed to update wishlist");
    }
  };

  const handleShare = async (caption: string, shareType: string = 'general') => {
    if (!product) return;
    try {
      await api.engagement.share(product.id, shareType, user ? null : userSession);
      
      setShareCount(prev => prev + 1);
      toast.success("Share recorded");

    } catch (error) {
      console.error('Error recording share:', error);
      toast.error("Failed to record share.");
    }
  };

  const handleCustomShare = () => {
    if (!product) return;
    setIsShareDialogOpen(true); // Open the ShareButton dialog
  };

  const handleBuyOnWhatsApp = async () => {
    if (!product) return;
    try {
      const productUrl = window.location.href;
      const message = `Hi, I'm interested in ${product.name}. ${productUrl}`;
      const phoneNumber = '916304458152'; // India country code +91
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

      try {
        await api.engagement.share(product.id, 'buy', user ? null : userSession);
      } catch (e) {
        // Non-blocking: if analytics insert fails, still proceed to open WhatsApp
      }

      window.open(whatsappUrl, '_blank');
      toast.success("Opening WhatsApp...");
    } catch (error) {
      toast.error("Unable to open WhatsApp.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => navigate('/')} variant="outline" className="rounded-xl">← Back</Button>
      </div>
    </div>
  );
  
  if (!product) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Product not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Button onClick={() => navigate('/')} variant="ghost" size="sm" className="rounded-xl gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Products
          </Button>
          <MiniCart itemCount={cartItems.reduce((s, i) => s + i.quantity, 0)} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Media */}
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary border border-border/50">
              {currentVariant?.media_type === 'video' ? (
                <video
                  src={currentVariant.image_url}
                  className="w-full h-full object-cover"
                  playsInline
                  controls
                />
              ) : (
                <img
                  src={currentVariant?.image_url}
                  alt={`${product.name} in ${selectedColor}`}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              )}

              {/* Overlay actions */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button
                  onClick={handleLike}
                  className="relative w-9 h-9 rounded-xl bg-background/85 backdrop-blur-sm border border-border/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                >
                  <Heart className={cn("h-4 w-4 transition-colors", isLiked ? "fill-accent text-accent" : "text-muted-foreground")} />
                  {likeCount > 0 && (
                    <span className="absolute -bottom-1 -right-1 bg-accent text-white text-[9px] rounded-full h-3.5 w-3.5 flex items-center justify-center font-bold">
                      {likeCount}
                    </span>
                  )}
                </button>
                <ShareButton
                  product={product}
                  selectedColor={selectedColor || ''}
                  currentImage={currentVariant?.image_url || ''}
                  shareCount={shareCount}
                  onShare={handleShare}
                  isDialogOpen={isShareDialogOpen}
                  setIsDialogOpen={setIsShareDialogOpen}
                />
              </div>

              {product.originalPrice && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent text-white text-xs font-bold shadow-sm">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {sortedVariants.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {sortedVariants.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => setSelectedColor(v.name)}
                    className={cn(
                      "relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                      selectedColor === v.name ? "border-primary shadow-primary" : "border-border/50 opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col gap-5">
            {product.category && (
              <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1 w-fit">
                {product.category}
              </span>
            )}

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-balance" style={{ fontFamily: 'Syne, system-ui' }}>
                {product.name}
              </h1>
              <p className="text-muted-foreground mt-2 leading-relaxed text-sm whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-base text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
              )}
            </div>

            {/* Shipping */}
            <div className="flex items-center gap-2 text-sm rounded-xl bg-secondary/60 px-4 py-2.5">
              <svg className="h-4 w-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <span className="text-muted-foreground">Shipping:</span>
              <span className="font-medium">
                {product.shipping_type === 'free' ? (
                  <span className="text-success">Free</span>
                ) : product.shipping_type === 'flat' && typeof product.shipping_amount === 'number' ? (
                  `₹${product.shipping_amount.toFixed(2)}`
                ) : product.shipping_type === 'calculated' ? (
                  'Calculated at checkout'
                ) : 'May be applicable'}
              </span>
            </div>

            {/* Vendor */}
            {vendorName && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Sold by:</span>
                <span className="font-semibold">{vendorName}</span>
              </div>
            )}

            {/* Color selector */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Color: <span className="text-muted-foreground font-normal">{selectedColor}</span>
              </p>
              <ColorSelector colors={sortedVariants} selectedColor={selectedColor || ''} onColorSelect={setSelectedColor} />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleAddToCart}
                className="h-12 rounded-xl gradient-primary border-0 text-white shadow-primary hover:opacity-90 transition-opacity font-semibold gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleBuyOnWhatsApp}
                  variant="outline"
                  className="h-11 rounded-xl border-border hover:border-success/40 hover:bg-success/5 font-medium gap-2"
                >
                  <svg className="h-4 w-4 text-success" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  Buy Now
                </Button>
                <Button
                  onClick={handleCustomShare}
                  variant="outline"
                  className="h-11 rounded-xl gap-2 font-medium"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductPage;
