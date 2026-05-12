import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight, LayoutDashboard, Package, Tag, Layers,
  ChevronRight, LogOut, Sparkles, Settings, Menu, X,
  BarChart3, ShoppingBag
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { logoutUser } from "@/features/auth/authThunks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { to: "/admin/product", icon: Package, label: "Products", badge: null },
  { to: "/admin/category", icon: Tag, label: "Categories", badge: null },
  { to: "/admin/subcategory", icon: Layers, label: "Subcategories", badge: null },
];

const NavItem = ({ to, icon: Icon, label, badge, collapsed }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
        isActive
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/60" />}
      {badge && !collapsed && (
        <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">{badge}</Badge>
      )}
    </Link>
  );
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName =
    (user as any)?.name?.trim() ||
    (user as any)?.full_name?.trim() ||
    (user as any)?.firstName?.trim() ||
    user?.email?.split("@")[0] ||
    "Admin";

  const activeItem = NAV_ITEMS.find(i => i.to === location.pathname);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Signed out");
      navigate("/");
    } catch {
      toast.error("Logout failed");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(
      "flex flex-col h-full",
      mobile ? "w-64" : "w-64"
    )}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-primary shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ fontFamily: 'Syne, system-ui' }}>StyleShop</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
        <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Management</p>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} collapsed={false} />
        ))}

        <div className="pt-4 mt-4 border-t border-sidebar-border">
          <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Quick Access</p>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span>Visit Storefront</span>
            <ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-50" />
          </Link>
        </div>
      </div>

      {/* User */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/60">
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {displayName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden h-screen lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-border/60 lg:bg-sidebar">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border/60 animate-in-up">
            <div className="flex justify-end px-4 pt-4">
              <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 md:px-6 border-b border-border/60 bg-background/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span>Admin</span>
              {activeItem && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-foreground font-medium">{activeItem.label}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs gap-1.5">
                <ShoppingBag className="h-3 w-3" />
                <span className="hidden sm:inline">Storefront</span>
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
