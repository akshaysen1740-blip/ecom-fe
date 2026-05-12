import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MiniCartProps {
  itemCount: number;
}

export const MiniCart: React.FC<MiniCartProps> = ({ itemCount }) => {
  const navigate = useNavigate();

  const handleGoToCart = () => {
    navigate('/cart');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleGoToCart}
      className="relative"
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full h-4 w-4 flex items-center justify-center text-xs font-bold">
          {itemCount}
        </span>
      )}
    </Button>
  );
};



