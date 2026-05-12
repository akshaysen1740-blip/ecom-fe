import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, UserPlus, ShoppingBag, ArrowLeft, Sparkles } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { loginUser, signupUser } from "@/features/auth/authThunks";
import { isAdminRole } from "@/features/auth/authUtils";
import { cn } from "@/lib/utils";

const Auth = () => {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { loading, user } = useAppSelector((s) => s.auth);

  const redirectTo =
    location.state && typeof location.state === "object" && "from" in location.state
      ? (location.state.from as { pathname?: string })?.pathname
      : undefined;

  useEffect(() => {
    if (user) navigate(isAdminRole(user.role) ? "/admin" : "/", { replace: true });
  }, [navigate, user]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.rejected.match(result)) {
      toast.error((result.payload as string) || "Login failed");
      setSubmitting(false);
      return;
    }
    toast.success("Welcome back!");
    const dest = redirectTo || (isAdminRole((result.payload as any).user.role) ? "/admin" : "/");
    navigate(dest, { replace: true });
    setSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await dispatch(signupUser({ email, password }));
    if (signupUser.rejected.match(result)) {
      toast.error((result.payload as string) || "Signup failed");
    } else {
      toast.success("Account created! Check your email to verify.");
    }
    setSubmitting(false);
  };

  const isBusy = loading || submitting;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl gradient-primary" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-8 blur-3xl" style={{ background: 'var(--gradient-accent)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to shop
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden">
          {/* Card header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-border/50 bg-secondary/20">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-primary mb-4">
              <ShoppingBag className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, system-ui' }}>
              {tab === "signin" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === "signin"
                ? "Sign in to manage your orders"
                : "Join thousands of happy customers"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border/50">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-3.5 text-sm font-medium transition-all duration-200",
                  tab === t
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl h-11 border-border/70 focus:border-primary/60 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder={tab === "signup" ? "Create a strong password" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-xl h-11 pr-10 border-border/70 focus:border-primary/60 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isBusy}
                className="w-full h-11 rounded-xl gradient-primary border-0 text-white shadow-primary hover:opacity-90 transition-all duration-200 font-semibold"
              >
                {isBusy ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {tab === "signin" ? "Signing in…" : "Creating account…"}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {tab === "signin" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {tab === "signin" ? "Sign In" : "Create Account"}
                  </span>
                )}
              </Button>
            </form>

            {tab === "signup" && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                By creating an account, you agree to our{" "}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
            )}
          </div>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Trusted by 10,000+ customers worldwide</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
