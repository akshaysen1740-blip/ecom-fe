import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductGrid } from "@/components/ProductGrid";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/services/api";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Zap, Shield, Truck } from "lucide-react";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  variants: { name: string; value: string; image_url: string }[];
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
}

const FEATURES = [
  { icon: Zap, label: "Fast Delivery", desc: "Same-day dispatch on orders" },
  { icon: Shield, label: "Secure Checkout", desc: "256-bit SSL encryption" },
  { icon: Truck, label: "Free Returns", desc: "30-day hassle-free returns" },
  { icon: Sparkles, label: "Premium Quality", desc: "Carefully curated products" },
];

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cart");
      if (stored) setCart(JSON.parse(stored));
    } catch { setCart([]); }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const CACHE_KEY = "categories_cache";
    const TTL = 24 * 60 * 60 * 1000;
    const fetchCategories = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < TTL) { setCategories(data); return; }
        }
        const data = await api.categories.list();
        setCategories((data as any[]) || []);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      } catch {
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  const handleOrderPlace = (product: Product, color: string) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === product.id && i.color === color);
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      const img = product.variants.find(v => v.name === color)?.image_url || product.variants[0]?.image_url || "";
      return [...prev, { productId: product.id, color, name: product.name, price: product.price, image: img, vendorId: product.vendor_id || null, quantity: 1 }];
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader cartCount={cart.reduce((s, i) => s + i.quantity, 0)} onSearch={setSearchQuery} />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-10 blur-3xl gradient-primary" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-8 blur-3xl" style={{ background: 'var(--gradient-accent)' }} />
        </div>

        <div className="relative container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6 animate-in-up">
            <Sparkles className="h-3 w-3" />
            New arrivals this week
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance animate-in-up [animation-delay:80ms]" style={{ fontFamily: 'Syne, system-ui' }}>
            Discover{" "}
            <span className="gradient-text">Amazing</span>{" "}
            Products
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto text-balance animate-in-up [animation-delay:160ms]">
            Choose your perfect color, share with friends, and get premium quality delivered fast.
          </p>
          <div className="flex items-center justify-center gap-3 animate-in-up [animation-delay:240ms]">
            <Button size="lg" className="rounded-xl gradient-primary border-0 text-white shadow-primary hover:opacity-90 transition-opacity gap-2 h-12 px-7">
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Link to="/saj-price-calculator">
              <Button size="lg" variant="outline" className="rounded-xl h-12 px-7 border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-200">
                Price Calculator
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature pills */}
        <div className="relative container mx-auto mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
          {FEATURES.map(({ icon: Icon, label, desc }, i) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-4 shadow-sm animate-in-up"
              style={{ animationDelay: `${320 + i * 60}ms` }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="container mx-auto px-4 pb-20">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Syne, system-ui' }}>Featured Products</h2>
            <p className="text-muted-foreground text-sm mt-1">Select your color and place your order</p>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 rounded-xl border-border/70 h-10">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ProductGrid onOrderPlace={handleOrderPlace} selectedCategory={selectedCategory} searchQuery={searchQuery} />
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-secondary/30">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <span className="font-bold gradient-text" style={{ fontFamily: 'Syne, system-ui' }}>StyleShop</span>
            </div>
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} StyleShop. Premium products with style.</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
