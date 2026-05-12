import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/ProductCard";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/services/api";

interface CartItem {
  productId: string;
  color: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  image_url?: string;
  vendorId?: string | null;
  vendorName?: string | null;
  shipping_type?: 'free' | 'flat' | 'calculated';
  shipping_amount?: number | null;
}

// Match ProductCard's expected product shape
interface SuggestedVariant {
  name: string;
  value: string;
  image_url: string;
  media_type?: 'image' | 'video';
}

interface SuggestedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  variants: SuggestedVariant[];
  description: string;
  category?: string;
  shippingAmount?: number;
  thumbnail_url?: string;
}

const CartPage = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [vendors, setVendors] = useState<Record<string, string>>({});
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const isLikelyVideoUrl = (url: string | undefined | null) => {
    if (!url) return false;
    return /\.(mp4|webm|mov|m4v|avi)$/i.test(url);
  };

  const updateLocalStorage = (updatedCart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  // Ensure each cart item has a valid image URL (prefer non-video variant)
  const ensureCartItemImages = useCallback(async (items: CartItem[]) => {
    const needsFix = items.filter((item) => {
      const url = item.image || item.image_url;
      return !url || isLikelyVideoUrl(url);
    });

    if (needsFix.length === 0) {
      return;
    }

    const productIds = [...new Set(needsFix.map((item) => item.productId))];

    let data: any[] = [];
    try {
      data = await api.products.list(`?ids=${encodeURIComponent(productIds.join(","))}`);
    } catch (error) {
      console.error('Error fetching product variants for cart images:', error);
      return;
    }

    const updated: CartItem[] = items.map((item) => {
      const existingUrl = item.image || item.image_url;
      if (existingUrl && !isLikelyVideoUrl(existingUrl)) {
        return item;
      }

      const product = data.find(
        (p: { id: string }) => p.id === item.productId
      ) as
        | { id: string; product_variants?: { name?: string; media_type?: string; image_url?: string }[]; variants?: { name?: string; media_type?: string; image_url?: string }[] }
        | undefined;
      const variants = product?.product_variants || product?.variants;
      if (!product || !variants) {
        return item;
      }

      const preferredVariant =
        variants.find(
          (v) => v.name === item.color && v.media_type !== 'video' && v.image_url
        ) ||
        variants.find((v) => v.media_type !== 'video' && v.image_url);

      if (!preferredVariant?.image_url) {
        return item;
      }

      return {
        ...item,
        image: preferredVariant.image_url as string,
      };
    });

    setCartItems(updated);
    updateLocalStorage(updated);
  }, []);

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      const items: CartItem[] = JSON.parse(storedCart);
      setCartItems(items);

      // Fix any missing / video-only images in the background
      // Intentionally not awaited so page renders quickly; errors are handled inside
      void ensureCartItemImages(items);

      // Fetch vendor names for all unique vendor IDs
      const vendorIds = [...new Set(items.map((item: CartItem) => item.vendorId).filter(Boolean))];
      if (vendorIds.length > 0) {
        fetchVendorNames(vendorIds as string[]);
      }
    }
  }, [ensureCartItemImages]);

  useEffect(() => {
    const fetchSuggestedProducts = async () => {
      try {
        const data = await api.products.list("?limit=10&sort=-created_at");

        const transformed: SuggestedProduct[] =
          data?.map((product) => {
            const p = product as {
              id: string;
              name: string;
              price: number | string;
              originalPrice?: number | string;
              description?: string;
              category?: string;
              shipping_amount?: number | string | null;
              thumbnail_url?: string | null;
              product_variants?: {
                name: string;
                value: string;
                image_url: string;
                media_type?: string | null;
              }[];
              variants?: {
                name: string;
                value: string;
                image_url: string;
                media_type?: string | null;
              }[];
            };
            const variants = p.product_variants || p.variants || [];

            return {
              id: p.id,
              name: p.name,
              price: Number(p.price),
              originalPrice: p.originalPrice != null ? Number(p.originalPrice) : undefined,
              description: p.description || "",
              category: p.category || undefined,
              shippingAmount:
                p.shipping_amount != null ? Number(p.shipping_amount) : undefined,
              thumbnail_url: p.thumbnail_url || undefined,
              variants:
                variants.map((variant) => ({
                  name: variant.name,
                  value: variant.value,
                  image_url: variant.image_url,
                  media_type: (variant.media_type || undefined) as 'image' | 'video' | undefined,
                })) || [],
            };
          }) || [];

        setSuggestedProducts(transformed);
      } catch (error) {
        console.error("Error fetching suggested products:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestedProducts();
  }, []);

  const fetchVendorNames = async (vendorIds: string[]) => {
    try {
      const data = await api.vendors.list(vendorIds);
      
      if (data) {
        const vendorMap: Record<string, string> = {};
        data.forEach(vendor => {
          vendorMap[vendor.id] = vendor.name;
        });
        setVendors(vendorMap);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleQuantityChange = (productId: string, color: string, newQuantity: number) => {
    const updatedCart = cartItems.map(item => 
      item.productId === productId && item.color === color 
        ? { ...item, quantity: newQuantity } 
        : item
    ).filter(item => item.quantity > 0);
    setCartItems(updatedCart);
    updateLocalStorage(updatedCart);
  };

  const handleRemoveItem = (productId: string, color: string) => {
    const updatedCart = cartItems.filter(item => !(item.productId === productId && item.color === color));
    setCartItems(updatedCart);
    updateLocalStorage(updatedCart);
    toast.success("Item removed from cart.");
  };

  // Calculate shipping per vendor (only charge once per vendor)
  const calculateShipping = () => {
    const vendorShipping: Record<string, number> = {};
    const vendorItems: Record<string, CartItem[]> = {};
    
    // Group items by vendor
    cartItems.forEach(item => {
      const vid = item.vendorId || 'no-vendor';
      if (!vendorItems[vid]) {
        vendorItems[vid] = [];
      }
      vendorItems[vid].push(item);
    });
    
    // Calculate shipping for each vendor (only once per vendor)
    Object.keys(vendorItems).forEach(vid => {
      const items = vendorItems[vid];
      if (items.length > 0) {
        const firstItem = items[0];
        if (firstItem.shipping_type === 'flat' && firstItem.shipping_amount) {
          vendorShipping[vid] = firstItem.shipping_amount;
        } else if (firstItem.shipping_type === 'free') {
          vendorShipping[vid] = 0;
        } else if (firstItem.shipping_type === 'flat' && !firstItem.shipping_amount) {
          // Shipping may be applicable but amount not set - show as 0 in cart, will be calculated later
          vendorShipping[vid] = 0;
        } else if (!firstItem.shipping_type || firstItem.shipping_type === 'calculated') {
          vendorShipping[vid] = 0; // Calculated shipping handled separately
        } else {
          vendorShipping[vid] = 0;
        }
      }
    });
    
    return { vendorShipping, vendorItems };
  };

  const { vendorShipping, vendorItems } = calculateShipping();
  const totalShipping = Object.values(vendorShipping).reduce((sum, amount) => sum + amount, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = subtotal + totalShipping;

  const handleOrderPlace = (product: SuggestedProduct, color: string) => {
    setCartItems(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.productId === product.id && item.color === color
      );

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += 1;
        updateLocalStorage(newCart);
        return newCart;
      }

      const variantImage =
        product.variants.find((v) => v.name === color)?.image_url ||
        product.variants[0]?.image_url ||
        "";

      const newCart: CartItem[] = [
        ...prevCart,
        {
          productId: product.id,
          color,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: variantImage,
        },
      ];

      updateLocalStorage(newCart);
      toast.success(`${product.name} in ${color} added to cart!`);
      return newCart;
    });
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Format cart items grouped by vendor for WhatsApp message
    let message = `Hi, I would like to place an order:\n\n`;
    
    let itemIndex = 1;
    Object.keys(vendorItems).forEach(vid => {
      const items = vendorItems[vid];
      const vendorName = vid === 'no-vendor' ? 'General' : (vendors[vid] || 'Unknown Vendor');
      
      message += `📦 ${vendorName}:\n`;
      items.forEach(item => {
        message += `   ${itemIndex}. ${item.name} (${item.color})\n`;
        message += `      Quantity: ${item.quantity}\n`;
        message += `      Price: ₹${item.price} per unit\n`;
        message += `      Subtotal: ₹${(item.price * item.quantity).toFixed(2)}\n\n`;
        itemIndex++;
      });
      
      const vendorSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shipping = vendorShipping[vid] || 0;
      const hasShippingAmount = items[0]?.shipping_type === 'flat' && items[0]?.shipping_amount;
      message += `   Subtotal: ₹${vendorSubtotal.toFixed(2)}\n`;
      if (shipping > 0) {
        message += `   Shipping: ₹${shipping.toFixed(2)}\n`;
      } else if (items[0]?.shipping_type === 'flat' && !hasShippingAmount) {
        message += `   Shipping: May be applicable\n`;
      } else {
        message += `   Shipping: Free\n`;
      }
      message += `   Total: ₹${(vendorSubtotal + shipping).toFixed(2)}${!hasShippingAmount && items[0]?.shipping_type === 'flat' ? ' (shipping may apply)' : ''}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Total Items: ${totalItems}\n`;
    message += `Subtotal: ₹${subtotal.toFixed(2)}\n`;
    message += `Shipping: ₹${totalShipping.toFixed(2)}\n`;
    message += `Grand Total: ₹${totalAmount.toFixed(2)}\n\n`;
    message += `Please confirm the order.`;

    const phoneNumber = '916304458152'; // India country code +91
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success("Opening WhatsApp...");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader cartCount={cartItems.reduce((s, i) => s + i.quantity, 0)} />

      <main className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Continue shopping
          </Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Syne, system-ui' }}>
            Your Cart
            {cartItems.length > 0 && (
              <span className="ml-3 text-lg font-normal text-muted-foreground">
                ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)
              </span>
            )}
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6 text-sm max-w-xs">Looks like you haven't added anything yet. Start exploring our products.</p>
            <Link to="/">
              <Button className="rounded-xl gradient-primary border-0 text-white shadow-primary hover:opacity-90 transition-opacity gap-2">
                Browse Products
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-3">
              {cartItems.map((item) => {
                const itemImage = item.image || item.image_url || "/placeholder.svg";
                const itemSubtotal = item.price * item.quantity;
                return (
                  <div
                    key={`${item.productId}-${item.color}`}
                    className="flex gap-4 p-4 rounded-2xl border border-border/60 bg-card shadow-sm hover:border-primary/20 transition-colors duration-200 animate-in-up"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary shrink-0">
                      <img src={itemImage} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{item.color}</span>
                            {item.vendorId && (
                              <span className="text-xs text-muted-foreground">by {vendors[item.vendorId] || "Vendor"}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-primary">₹{itemSubtotal.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3">
                        {/* Qty controls */}
                        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg hover:bg-background"
                            onClick={() => handleQuantityChange(item.productId, item.color, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <span className="text-base leading-none">−</span>
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg hover:bg-background"
                            onClick={() => handleQuantityChange(item.productId, item.color, item.quantity + 1)}
                          >
                            <span className="text-base leading-none">+</span>
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {item.shipping_type === 'free' ? '🚚 Free shipping' :
                             item.shipping_type === 'flat' && item.shipping_amount ? `+₹${item.shipping_amount} shipping` :
                             item.shipping_type === 'calculated' ? 'Shipping calculated' : ''}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.productId, item.color)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 rounded-2xl border border-border/60 bg-card shadow-md p-6 space-y-4">
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Syne, system-ui' }}>Order Summary</h3>

                {/* Vendor breakdown */}
                <div className="space-y-3">
                  {Object.keys(vendorItems).map(vid => {
                    const items = vendorItems[vid];
                    const vendorName = vid === 'no-vendor' ? 'General' : (vendors[vid] || 'Vendor');
                    const vendorSubtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
                    const shipping = vendorShipping[vid] || 0;
                    return (
                      <div key={vid} className="rounded-xl bg-secondary/50 p-3 space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground">📦 {vendorName}</p>
                        <div className="flex justify-between text-xs">
                          <span>Subtotal</span>
                          <span className="font-medium">₹{vendorSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Shipping</span>
                          <span className="font-medium">
                            {shipping > 0 ? `₹${shipping.toFixed(2)}` :
                             items[0]?.shipping_type === 'flat' && !items[0]?.shipping_amount ?
                             'May apply' : 'Free'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="border-t border-border/60 pt-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items ({cartItems.reduce((s, i) => s + i.quantity, 0)})</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {totalShipping > 0 ? `₹${totalShipping.toFixed(2)}` :
                       cartItems.some(i => i.shipping_type === 'flat' && !i.shipping_amount) ?
                       'May apply' : 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/60">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-bold text-primary">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full h-11 rounded-xl gradient-primary border-0 text-white shadow-primary hover:opacity-90 transition-all font-semibold gap-2"
                  onClick={handlePlaceOrder}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  Order via WhatsApp
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  You'll be redirected to WhatsApp to confirm your order
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {!loadingSuggestions && suggestedProducts.length > 0 && (
          <section className="mt-16 pt-10 border-t border-border/60">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Syne, system-ui' }}>You may also like</h2>
                <p className="text-sm text-muted-foreground mt-1">More great products for you</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {suggestedProducts.map((product) => (
                <ProductCard key={product.id} product={product} onOrderPlace={handleOrderPlace} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default CartPage;
