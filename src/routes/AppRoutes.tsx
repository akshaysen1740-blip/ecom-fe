import { Navigate, Route, Routes } from "react-router-dom";
import Auth from "@/pages/Auth";
import CartPage from "@/pages/CartPage";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import ProductPage from "@/pages/ProductPage";
import SajPriceCalculator from "@/pages/SajPriceCalculator";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminCategoriesPage from "@/pages/admin/AdminCategoriesPage";
import AdminProductsPage from "@/pages/admin/AdminProductsPage";
import AdminSubcategoriesPage from "@/pages/admin/AdminSubcategoriesPage";
import { ProtectedAdminRoute } from "@/routes/ProtectedRoutes";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />

      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="product" replace />} />
          <Route path="category" element={<AdminCategoriesPage />} />
          <Route path="subcategory" element={<AdminSubcategoriesPage />} />
          <Route path="product" element={<AdminProductsPage />} />
        </Route>
      </Route>

      <Route path="/cart" element={<CartPage />} />
      <Route path="/product/:productSlug" element={<ProductPage />} />
      <Route path="/saj-price-calculator" element={<SajPriceCalculator />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
