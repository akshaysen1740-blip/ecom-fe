import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchCurrentUser } from "@/features/auth/authThunks";
import { AppRoutes } from "@/routes/AppRoutes";

const queryClient = new QueryClient();

const App = () => {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((state) => state.auth.initialized);

  useEffect(() => {
    if (!initialized) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, initialized]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
