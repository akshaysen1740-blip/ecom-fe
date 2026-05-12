import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, Search, Compass } from "lucide-react";

const NotFound = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
    {/* Ambient */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-8 blur-3xl gradient-primary" />
    </div>

    <div className="relative text-center max-w-md mx-auto animate-in-up">
      {/* Big 404 */}
      <div className="text-9xl font-black gradient-text leading-none mb-4 select-none" style={{ fontFamily: 'Syne, system-ui' }}>
        404
      </div>

      <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center mb-6">
        <Compass className="h-8 w-8 text-muted-foreground" />
      </div>

      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, system-ui' }}>Page not found</h1>
      <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/">
          <Button className="rounded-xl gradient-primary border-0 text-white shadow-primary hover:opacity-90 transition-opacity gap-2 w-full sm:w-auto">
            <ShoppingBag className="h-4 w-4" />
            Back to Shop
          </Button>
        </Link>
        <button onClick={() => window.history.back()}>
          <Button variant="outline" className="rounded-xl gap-2 w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </button>
      </div>
    </div>
  </div>
);

export default NotFound;
