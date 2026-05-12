import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { isAdminRole } from "@/features/auth/authUtils";
import { Card, CardContent } from "@/components/ui/card";

export const ProtectedAdminRoute = () => {
  const location = useLocation();
  const { user, loading, initialized } = useAppSelector((state) => state.auth);

  if (loading || !initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4">
        <Card className="w-full max-w-md border-0 bg-card/95 shadow-2xl backdrop-blur">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">Checking admin access</p>
              <p className="text-sm text-muted-foreground">
                We are verifying your session and permissions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (!isAdminRole(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
