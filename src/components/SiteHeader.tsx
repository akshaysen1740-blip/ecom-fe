import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag, LogIn, LogOut, Settings, Calculator,
  Search, X, Sun, Moon, Menu, ChevronRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logoutUser } from "@/features/auth/authThunks";
import { isAdminRole } from "@/features/auth/authUtils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  cartCount: number;
  onSearch?: (query: string) => void;
}

export const SiteHeader = ({ cartCount, onSearch }: SiteHeaderProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isUser = Boolean(user);
  const isAdmin = isAdminRole(user?.role);
  const [currentCartCount, setCurrentCartCount] = useState(cartCount);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setCurrentCartCount(cartCount); }, [cartCount]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cart") {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          if (Array.isArray(parsed)) setCurrentCartCount(parsed.length);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");
    setIsDark(html.classList.contains("dark"));
  };

  const handleSearch = (val: string) => {
    setSearchValue(val);
    onSearch?.(val);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Signed out successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign out");
    } finally {
      setIsSigningOut(false);
    }
  };

  const userInitial = user?.email?.[0]?.toUpperCase() ?? "U";
  const displayName = (user as any)?.name || (user as any)?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/90 backdrop-blur-xl shadow-sm"
          : "bg-background/60 backdrop-blur-md"
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-primary transition-transform duration-200 group-hover:scale-105">
            <ShoppingBag className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text hidden sm:block" style={{ fontFamily: 'Syne, system-ui' }}>
            StyleShop
          </span>
        </Link>

        {/* Center — Search bar (desktop) */}
        <div className="hidden md:flex flex-1 max-w-sm mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search products…"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/60 pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all duration-200"
            />
            {searchValue && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Calculator */}
          <Link to="/saj-price-calculator" className="hidden sm:block">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground">
              <Calculator className="h-4 w-4" />
            </Button>
          </Link>

          {/* Admin */}
          {isAdmin && (
            <Link to="/admin" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          )}

          {/* Cart */}
          <button
            onClick={() => navigate("/cart")}
            className="relative flex items-center justify-center h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
          >
            <ShoppingBag className="h-4 w-4" />
            {currentCartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 min-w-[1.1rem] flex items-center justify-center rounded-full gradient-accent text-white text-[10px] font-bold leading-none px-1 shadow-sm animate-in-up">
                {currentCartCount > 99 ? "99+" : currentCartCount}
              </span>
            )}
          </button>

          {/* Auth */}
          {isUser ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex items-center gap-2 ml-1 rounded-xl px-2.5 py-1.5 hover:bg-secondary transition-colors duration-200">
                  <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {userInitial}
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-[80px] truncate">{displayName}</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSigningOut} className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isSigningOut ? "Signing out…" : "Sign Out"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="rounded-xl gradient-primary border-0 text-white shadow-primary hover:opacity-90 transition-opacity gap-1.5 ml-1">
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
          )}

          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(!searchOpen)}
            className="h-9 w-9 rounded-xl md:hidden text-muted-foreground"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="md:hidden border-t border-border/50 px-4 py-3 animate-in-up">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search products…"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/60 pl-9 pr-10 py-2.5 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all duration-200"
            />
            <button
              onClick={() => { setSearchOpen(false); handleSearch(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
