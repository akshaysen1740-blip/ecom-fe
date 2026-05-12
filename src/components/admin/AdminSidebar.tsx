import { NavLink, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { adminNavItems } from "@/components/admin/admin-config";
import { cn } from "@/lib/utils";

export const AdminSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">SwetaArts Admin</p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              Catalog operations
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="overflow-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={location.pathname === item.to}
                  >
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "transition-colors",
                          isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                        )
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/30 p-3 text-xs text-sidebar-foreground/75 group-data-[collapsible=icon]:hidden">
          Keep category structure, subcategory planning, and product publishing in one place.
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
