import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Share2, Download, Edit3, ClipboardIcon } from "lucide-react";
import { toast } from "sonner";

interface ProductVariant {
  name: string;
  value: string;
  image_url: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  variants?: ProductVariant[];
}

interface ShareButtonProps {
  product: Product;
  selectedColor: string;
  currentImage: string;
  shareCount?: number;
  onShare?: (caption: string, shareType?: string) => Promise<void>;
  isDialogOpen: boolean; // New prop
  setIsDialogOpen: (isOpen: boolean) => void; // New prop
}

export const ShareButton = ({ product, selectedColor, currentImage, shareCount = 0, onShare, isDialogOpen, setIsDialogOpen }: ShareButtonProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [customCaption, setCustomCaption] = useState("");

  // When the dialog is opened externally (parent controls isDialogOpen),
  // ensure the caption is prefilled.
  useEffect(() => {
    if (isDialogOpen) {
      setCustomCaption(generateShareContent());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen]);

  const generateShareContent = (caption?: string) => {
    return caption || `🛍️ Check out this amazing product!\n\n${product.name}\nColor: ${selectedColor}\nPrice: ₹${product.price}\n\n${product.description}\n\n#shopping #products #deals`;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(customCaption);
    toast.success("Caption copied to clipboard!");
  };

  const downloadAllImages = async () => {
    try {
      // Get all variant images from the product
      const variants = product.variants || [];
      
      for (const variant of variants) {
        const response = await fetch(variant.image_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${product.name}-${variant.name}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast.success(`All ${variants.length} color images downloaded successfully!`);
    } catch (error) {
      toast.error("Failed to download images");
    }
  };

  const handleShare = async (caption?: string) => {
    setIsSharing(true);
    console.log("Starting share process...", { caption });
    
    try {
      const shareText = generateShareContent(caption);
      console.log("Generated share text:", shareText);
      
      // Record the share in database if onShare function is provided
      if (onShare) {
        await onShare(shareText, 'whatsapp');
      }
      
      // Download all variant images first
      await downloadAllImages();
      
      // Always open WhatsApp directly instead of using navigator.share
      console.log("Opening WhatsApp...");
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      console.log("WhatsApp URL:", whatsappUrl);
      
      // Use a more reliable method to open WhatsApp
      const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      if (!newWindow) {
        // If popup blocked, try alternative approach
        console.log("Popup blocked, trying alternative...");
        window.location.href = whatsappUrl;
      } else {
        console.log("WhatsApp opened successfully");
        toast.success("All images downloaded! WhatsApp opened with your message.");
      }
      
    } catch (error) {
      console.error("Share error:", error);
      // Fallback approach
      try {
        const shareText = generateShareContent(caption);
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        console.log("Fallback: Opening WhatsApp URL:", whatsappUrl);
        window.location.href = whatsappUrl;
        toast.success("Opening WhatsApp...");
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        toast.error("Failed to open WhatsApp. Please try again.");
      }
    } finally {
      setIsSharing(false);
      setIsDialogOpen(false);
    }
  };

  const handleCustomShare = () => {
    setCustomCaption(generateShareContent());
    setIsDialogOpen(true);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <div className="relative">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 md:h-8 md:w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background touch-manipulation"
            onClick={handleCustomShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <Download className="h-4 w-4 animate-pulse" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </Button>
          {shareCount > 0 && (
            <span className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
              {shareCount}
            </span>
          )}
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Customize Caption
          </DialogTitle>
          <DialogDescription>
            Edit your message before sharing to WhatsApp
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="caption">Caption for WhatsApp</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyToClipboard}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ClipboardIcon className="h-4 w-4" />
                Copy
              </Button>
            </div>
            <Textarea
              id="caption"
              value={customCaption}
              onChange={(e) => setCustomCaption(e.target.value)}
              placeholder="Enter your custom caption..."
              rows={6}
              className="mt-2"
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleShare(customCaption)}
              disabled={isSharing}
              className="opacity-100 w-full sm:w-auto h-10 md:h-auto text-sm md:text-base"
            >
              {isSharing ? (
                <>
                  <Download className="h-4 w-4 mr-2 animate-pulse" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share on WhatsApp
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};