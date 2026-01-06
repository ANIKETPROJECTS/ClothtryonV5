import { useState, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Star, Share2, Heart, Scan, Check, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { VirtualTryOn } from "@/components/VirtualTryOn";
import { useProduct, useProducts } from "@/hooks/use-products";
import { TSHIRT_CONFIG } from "@/lib/tshirt-config";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProductDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [isVTOOpen, setIsVTOOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [isImageVTOProcessing, setIsImageVTOProcessing] = useState(false);
  const [vtoResultImage, setVtoResultImage] = useState<string | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: fetchedProduct } = useProduct(Number(id));
  const { data: allProducts } = useProducts();
  
  const product = (fetchedProduct as any) || {
    id: 1,
    name: TSHIRT_CONFIG.name,
    price: TSHIRT_CONFIG.price,
    description: "Crafted from heavy-weight 280gsm cotton jersey, this oversized tee features dropped shoulders and a boxy fit.",
    detailedDescription: "Designed for ultimate comfort and durability, our signature tee is made from sustainably sourced 280gsm organic cotton. The silicon wash finish provides a luxuriously soft hand-feel, while the reinforced double-stitched seams ensure it maintains its shape through countless wears and washes. Features a contemporary oversized silhouette with dropped shoulders and a thick ribbed collar.",
    images: {
      front: TSHIRT_CONFIG.images.front,
      back: TSHIRT_CONFIG.images.back,
      left: TSHIRT_CONFIG.images.left,
      right: TSHIRT_CONFIG.images.right,
    },
    sizes: ["XS", "S", "M", "L", "XL"],
    features: ["100% Organic Cotton", "Heavyweight 280gsm", "Boxy Fit", "Silicon Wash Finish"],
    similarProducts: []
  };

  const images = [
    product.images?.front,
    product.images?.back,
    product.images?.left,
    product.images?.right
  ].filter(Boolean) as string[];

  const similarProducts = allProducts?.filter(p => 
    product.similarProducts?.includes(p.id) || 
    (p.id !== product.id && allProducts.indexOf(p) < 3)
  ).slice(0, 3);

  const handleImageTryOn = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const personImage = reader.result as string;
      setIsImageVTOProcessing(true);
      
      try {
        const res = await apiRequest("POST", "/api/vto/image-try-on", {
          personImage,
          clothingImage: images[0]
        });
        const data = await res.json();
        
        if (data.status === "success") {
          // Instead of AI generation, we use a canvas-based composite to preserve identity
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const personImg = new Image();
          const clothImg = new Image();

          personImg.onload = () => {
            canvas.width = personImg.width;
            canvas.height = personImg.height;
            
            // Draw person
            ctx.drawImage(personImg, 0, 0);
            
            clothImg.onload = () => {
              // Basic cloth mapping logic:
              // In a real 'non-AI' model, we'd use pose detection to align the shirt.
              // For this immediate fix, we'll perform a clean overlay that preserves the person.
              // We'll scale the cloth to fit the typical torso area.
              const clothWidth = canvas.width * 0.5;
              const clothHeight = (clothImg.height / clothImg.width) * clothWidth;
              const x = (canvas.width - clothWidth) / 2;
              const y = canvas.height * 0.25;

              ctx.drawImage(clothImg, x, y, clothWidth, clothHeight);
              
              const resultImage = canvas.toDataURL('image/png');
              setVtoResultImage(resultImage);
              setShowResultDialog(true);
              toast({
                title: "Success",
                description: "Clothing mapped successfully!",
              });
            };
            clothImg.src = images[0];
          };
          personImg.src = personImage;
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to process image.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process image try-on.",
          variant: "destructive",
        });
      } finally {
        setIsImageVTOProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getViewLabel = (idx: number) => {
    const labels = ["Front View", "Back View", "Left Side", "Right Side"];
    return labels[idx] || `View ${idx + 1}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <AnimatePresence>
        {isVTOOpen && (
          <VirtualTryOn 
            onClose={() => setIsVTOOpen(false)} 
            productImage={images[0] || ""}
          />
        )}
      </AnimatePresence>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Your Try-On Result</DialogTitle>
          </DialogHeader>
          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white mt-4">
            {vtoResultImage && (
              <img 
                src={vtoResultImage} 
                alt="Try-on result" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              className="border-zinc-800 text-white hover:bg-zinc-900"
              onClick={() => setShowResultDialog(false)}
            >
              Close
            </Button>
            <Button 
              className="bg-primary text-black hover:bg-primary/90"
              onClick={() => {
                const link = document.createElement('a');
                link.href = vtoResultImage || '';
                link.download = `try-on-${product.name}.png`;
                link.click();
              }}
            >
              Download Image
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-24">
          
          <div className="space-y-4 md:space-y-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-[3/4] bg-white rounded-lg overflow-hidden relative group shadow-2xl"
            >
              <img 
                src={vtoResultImage || images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageTryOn}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImageVTOProcessing}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-black px-4 py-2 md:px-5 md:py-2.5 rounded-full flex items-center gap-2 transition-all hover:scale-105 shadow-xl disabled:opacity-50"
                >
                  {isImageVTOProcessing ? (
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 md:w-5 md:h-5 text-black" />
                  )}
                  <span className="font-bold text-xs md:text-sm">Image Try-On</span>
                </button>

                <button
                  onClick={() => setIsVTOOpen(true)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-black px-4 py-2 md:px-5 md:py-2.5 rounded-full flex items-center gap-2 transition-all hover:scale-105 shadow-xl"
                >
                  <Scan className="w-4 h-4 md:w-5 md:h-5 text-black" />
                  <span className="font-bold text-xs md:text-sm">Virtual Try-On</span>
                </button>
              </div>

              {vtoResultImage && (
                <button 
                  onClick={() => setVtoResultImage(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded-full text-xs"
                >
                  Reset View
                </button>
              )}
            </motion.div>

            <div className="grid grid-cols-4 gap-2 md:gap-4">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImage(idx);
                    setVtoResultImage(null);
                  }}
                  className={`aspect-square rounded-md overflow-hidden border-2 transition-all flex flex-col items-center bg-white ${
                    activeImage === idx && !vtoResultImage ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={getViewLabel(idx)} className="w-full h-full object-cover" />
                  <span className="text-[8px] md:text-[10px] uppercase mt-1 text-neutral-500 font-bold">{getViewLabel(idx)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-start mt-8 lg:mt-0">
            <div className="mb-6 md:mb-8">
              <div className="flex justify-between items-start mb-4">
                <span className="text-primary font-bold tracking-widest text-xs md:text-sm uppercase">Premium Essential</span>
                <div className="flex gap-4">
                  <button className="text-neutral-400 hover:text-white transition-colors"><Share2 className="w-5 h-5" /></button>
                  <button className="text-neutral-400 hover:text-red-500 transition-colors"><Heart className="w-5 h-5" /></button>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4">{product.name}</h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="text-2xl md:text-3xl font-light text-white">{formatPrice(product.price)}</span>
                <div className="flex items-center text-yellow-500 text-sm">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  <span className="text-neutral-500 ml-2">(24 reviews)</span>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-neutral-400 leading-relaxed text-base md:text-lg">{product.description}</p>
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white uppercase mb-3">Product Story</h3>
                  <p className="text-neutral-300 text-sm leading-relaxed">{product.detailedDescription}</p>
                </div>

                <div className="mb-6 md:mb-8">
                  <div className="flex justify-between mb-4">
                    <span className="text-sm font-bold text-white uppercase">Available Sizes</span>
                    <button className="text-sm text-neutral-400 underline hover:text-white">Size Guide</button>
                  </div>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {product.sizes?.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-lg border flex items-center justify-center font-bold transition-all ${
                          selectedSize === size
                            ? "bg-white text-black border-white shadow-lg scale-110"
                            : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                  <ShoppingBag className="w-5 h-5" />
                  Add to Cart
                </button>

                <div className="border-t border-white/10 pt-6 md:pt-8">
                  <h3 className="text-sm font-bold text-white uppercase mb-4">Quality Standards</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {product.features?.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center text-neutral-400 text-sm">
                        <Check className="w-4 h-4 text-primary mr-3 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {similarProducts && similarProducts.length > 0 && (
          <div className="mt-24 border-t border-white/10 pt-16">
            <h2 className="text-2xl font-bold text-white mb-8 uppercase tracking-widest">Complete The Look</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {similarProducts.map((p: any) => (
                <Link key={p.id} href={`/product/${p.id}`}>
                  <div className="group cursor-pointer">
                    <div className="aspect-[3/4] bg-white rounded-lg overflow-hidden mb-4 relative shadow-lg">
                      <img src={p.images.front} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <h3 className="text-white font-bold mb-1">{p.name}</h3>
                    <p className="text-neutral-400">{formatPrice(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}