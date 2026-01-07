import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image as ImageIcon, Loader2, Maximize2, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageVTO() {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shirtPos, setShirtPos] = useState({ x: 0, y: 0, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleProcess = () => {
    if (!personImage || !clothingImage) {
      toast({
        title: "Missing Images",
        description: "Please upload both a person image and a clothing image.",
        variant: "destructive",
      });
      return;
    }
    // We are now just rendering the shirt on top, no need to call backend for generation
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Ready for Fitting",
        description: "You can now move and scale the T-shirt to fit perfectly.",
      });
    }, 500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "person" | "clothing") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "person") setPersonImage(reader.result as string);
        else setClothingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const moveShirt = (dx: number, dy: number) => {
    setShirtPos(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const scaleShirt = (ds: number) => {
    setShirtPos(prev => ({ ...prev, scale: Math.max(0.1, prev.scale + ds) }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!clothingImage || !personImage) return;
      const step = 2;
      switch (e.key) {
        case "ArrowUp": moveShirt(0, -step); break;
        case "ArrowDown": moveShirt(0, step); break;
        case "ArrowLeft": moveShirt(-step, 0); break;
        case "ArrowRight": moveShirt(step, 0); break;
        case "+": case "=": scaleShirt(0.01); break;
        case "-": case "_": scaleShirt(-0.01); break;
        case "Escape": setIsFullscreen(false); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clothingImage, personImage]);

  const VTOInterface = ({ isFull = false }) => (
    <div className={`relative bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center ${isFull ? 'w-full h-full' : 'aspect-[3/4] w-full'}`} ref={containerRef}>
      {personImage && (
        <img src={personImage} alt="Person" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
      )}
      {clothingImage && (
        <motion.div
          drag
          dragMomentum={false}
          style={ { x: shirtPos.x, y: shirtPos.y, scale: shirtPos.scale } }
          className="absolute cursor-move z-10 w-1/2"
        >
          <img src={clothingImage} alt="Shirt" className="w-full h-auto pointer-events-none" />
        </motion.div>
      )}
      
      {!isFull && personImage && clothingImage && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 z-20 bg-black/50 text-white hover:bg-black/70"
          onClick={() => setIsFullscreen(true)}
        >
          <Maximize2 className="w-5 h-5" />
        </Button>
      )}

      {/* Controls Overlay */}
      {personImage && clothingImage && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-20 pointer-events-none">
          <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="grid grid-cols-3 gap-1">
              <div />
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => moveShirt(0, -5)}><ChevronUp className="h-4 w-4" /></Button>
              <div />
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => moveShirt(-5, 0)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => moveShirt(0, 5)}><ChevronDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => moveShirt(5, 0)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => scaleShirt(0.02)}><Plus className="h-4 w-4" /></Button>
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => scaleShirt(-0.02)}><Minus className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-12 px-4">
      <AnimatePresence>
        {isFullscreen && (
          <motion.div 
            initial={ { opacity: 0 } }
            animate={ { opacity: 1 } }
            exit={ { opacity: 0 } }
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            <div className="p-4 flex justify-between items-center bg-neutral-900 border-b border-white/10">
              <h2 className="text-white font-bold">Full Screen Fitting</h2>
              <Button variant="ghost" size="icon" className="text-white" onClick={() => setIsFullscreen(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <VTOInterface isFull />
            </div>
            <div className="p-4 bg-neutral-900 border-t border-white/10 text-center text-white/50 text-xs">
              Use arrow keys to move, +/- to zoom, or drag the shirt directly.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter text-white">Manual Virtual Try-On</h1>
          <p className="text-white/60 text-lg">Upload your photo and a clothing item to manually fit it.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Your Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center overflow-hidden relative">
                {personImage ? (
                  <img src={personImage} alt="Person" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-10 h-10 text-white/20" />
                )}
              </div>
              <input type="file" id="person-upload" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, "person")} />
              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5" onClick={() => document.getElementById("person-upload")?.click()}>
                Upload Person
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Clothing Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                {clothingImage ? (
                  <img src={clothingImage} alt="Clothing" className="w-full h-auto object-contain" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-white/20" />
                )}
              </div>
              <input type="file" id="clothing-upload" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, "clothing")} />
              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5" onClick={() => document.getElementById("clothing-upload")?.click()}>
                Upload Clothing
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center pt-4">
          <Button size="lg" className="w-full max-w-md bg-white text-black hover:bg-white/90" disabled={isProcessing || !personImage || !clothingImage} onClick={handleProcess}>
            {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : "Prepare Fitting"}
          </Button>
        </div>

        {personImage && clothingImage && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-md mt-12 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Live Fitting Area</CardTitle>
              <div className="text-xs text-white/40">Drag to move • Arrows to nudge • +/- to scale</div>
            </CardHeader>
            <CardContent>
              <VTOInterface />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
