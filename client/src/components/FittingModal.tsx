import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Minus, Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FittingModalProps {
  isOpen: boolean;
  onClose: () => void;
  personImage: string;
  clothingImages: {
    front: string;
    back: string;
    left: string;
    right: string;
  };
}

export function FittingModal({ isOpen, onClose, personImage, clothingImages }: FittingModalProps) {
  const [currentView, setCurrentView] = useState<keyof typeof clothingImages>("front");
  const [shirtPos, setShirtPos] = useState({ x: 0, y: 0, scale: 0.8 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const moveShirt = (dx: number, dy: number) => {
    setShirtPos(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const scaleShirt = (ds: number) => {
    setShirtPos(prev => ({ ...prev, scale: Math.max(0.1, prev.scale + ds) }));
  };

  const resetShirt = () => {
    setShirtPos({ x: 0, y: 0, scale: 0.8 });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      const step = 2;
      switch (e.key) {
        case "ArrowUp": moveShirt(0, -step); break;
        case "ArrowDown": moveShirt(0, step); break;
        case "ArrowLeft": moveShirt(-step, 0); break;
        case "ArrowRight": moveShirt(step, 0); break;
        case "+": case "=": scaleShirt(0.01); break;
        case "-": case "_": scaleShirt(-0.01); break;
        case "Escape": 
          if (isFullscreen) setIsFullscreen(false);
          else onClose();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen) return null;

  const Interface = () => (
    <div className="relative w-full h-full bg-neutral-900 overflow-hidden flex items-center justify-center">
      <img src={personImage} alt="Person" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
      
      <motion.div
        drag
        dragMomentum={false}
        style={ { x: shirtPos.x, y: shirtPos.y, scale: shirtPos.scale } }
        className="absolute cursor-move z-10 w-1/2 flex items-center justify-center"
      >
        <img 
          src={clothingImages[currentView]} 
          alt="Shirt" 
          className="w-full h-auto pointer-events-none mix-blend-multiply brightness-110 contrast-110" 
          style={ { filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' } }
        />
      </motion.div>

      {/* View Selection Controls */}
      <div className="absolute top-4 left-4 flex gap-2 z-20">
        {(["front", "back", "left", "right"] as const).map(view => (
          <Button
            key={view}
            variant={currentView === view ? "default" : "secondary"}
            size="sm"
            className="capitalize text-[10px] h-7 px-3"
            onClick={() => {
              setCurrentView(view);
              // Reset shirt position slightly for different views if needed, 
              // but keeping it simple for now as requested.
            }}
          >
            {view}
          </Button>
        ))}
      </div>

      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={resetShirt}><RotateCcw className="h-4 w-4" /></Button>
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setIsFullscreen(!isFullscreen)}><Maximize2 className="h-4 w-4" /></Button>
      </div>

      {/* Positioning Controls */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-20 pointer-events-none">
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="grid grid-cols-3 gap-1">
            <div />
            <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => moveShirt(0, -2)}><ChevronUp className="h-3.5 w-3.5" /></Button>
            <div />
            <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => moveShirt(-2, 0)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => moveShirt(0, 2)}><ChevronDown className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => moveShirt(2, 0)}><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <div className="flex gap-2 pointer-events-auto bg-black/20 p-1 rounded-lg backdrop-blur-sm">
          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => scaleShirt(0.02)}><Plus className="h-4 w-4" /></Button>
          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => scaleShirt(-0.02)}><Minus className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={ { opacity: 0 } }
        animate={ { opacity: 1 } }
        exit={ { opacity: 0 } }
        className={`fixed inset-0 z-[300] bg-black flex flex-col ${isFullscreen ? '' : 'p-4 md:p-12'}`}
      >
        <div className="relative w-full h-full max-w-5xl mx-auto bg-neutral-900 rounded-xl overflow-hidden flex flex-col shadow-2xl border border-white/5">
          <div className="p-3 md:p-4 flex justify-between items-center border-b border-white/10 bg-neutral-900/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <h2 className="text-white font-display font-bold text-sm md:text-base tracking-tight">Interactive Fitting</h2>
              <span className="text-[10px] text-white/40 uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10">Active Pose: {currentView}</span>
            </div>
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 min-h-0">
            <Interface />
          </div>

          <div className="p-3 bg-neutral-950 border-t border-white/5 text-center text-white/30 text-[9px] md:text-[10px] uppercase tracking-[0.2em]">
            Drag shirt to move • Arrows for precision • +/- keys to zoom
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
