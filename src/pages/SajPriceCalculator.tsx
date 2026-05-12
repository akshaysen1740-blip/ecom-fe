import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calculator, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const SajPriceCalculator = () => {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const handleCalculate = () => {
    const num = parseFloat(code);
    if (!isNaN(num)) setResult(num * 1.8);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full opacity-8 blur-3xl gradient-primary" />
      </div>

      <div className="relative w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to shop
        </Link>

        <Card className="border-border/60 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-primary mx-auto mb-4">
              <Calculator className="h-7 w-7 text-white" />
            </div>
            <CardTitle>SAJ Price Calculator</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Enter a code to calculate the price</p>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code (Number)</Label>
              <Input
                id="code"
                type="number"
                placeholder="Enter a number…"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
                className="h-11 text-base"
              />
            </div>

            <Button
              onClick={handleCalculate}
              className="w-full h-11 rounded-xl gradient-primary border-0 text-white shadow-primary hover:opacity-90 transition-opacity font-semibold"
            >
              Calculate Price
            </Button>

            {result !== null && (
              <div className="p-5 rounded-2xl bg-primary/6 border border-primary/15 text-center animate-in-up">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Calculated Price</p>
                <p className="text-4xl font-bold gradient-text" style={{ fontFamily: 'Syne, system-ui' }}>
                  ₹{result.toFixed(2)}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center border-t border-border/60 pt-4">
              * Shipping charges are extra
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SajPriceCalculator;
