import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ImageVTO() {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleProcess = async () => {
    if (!personImage || !clothingImage) {
      toast({
        title: "Missing Images",
        description: "Please upload both a person image and a clothing image.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await apiRequest("POST", "/api/vto/image-try-on", {
        personImage,
        clothingImage,
      });
      const data = await res.json();
      
      if (data.status === "placeholder") {
        toast({
          title: "Feature Integrated",
          description: data.message,
        });
      } else {
        setResultImage(data.resultImage);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process image try-on.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter text-white">Advanced Virtual Try-On</h1>
          <p className="text-white/60 text-lg">Upload your photo and a clothing item to see the magic.</p>
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
              <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                {personImage ? (
                  <img src={personImage} alt="Person" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-10 h-10 text-white/20" />
                )}
              </div>
              <input
                type="file"
                id="person-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "person")}
              />
              <Button
                variant="outline"
                className="w-full border-white/10 hover:bg-white/5"
                onClick={() => document.getElementById("person-upload")?.click()}
              >
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
                  <img src={clothingImage} alt="Clothing" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-white/20" />
                )}
              </div>
              <input
                type="file"
                id="clothing-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "clothing")}
              />
              <Button
                variant="outline"
                className="w-full border-white/10 hover:bg-white/5"
                onClick={() => document.getElementById("clothing-upload")?.click()}
              >
                Upload Clothing
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            className="w-full max-w-md bg-white text-black hover:bg-white/90"
            disabled={isProcessing || !personImage || !clothingImage}
            onClick={handleProcess}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Generate Try-On"
            )}
          </Button>
        </div>

        {resultImage && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-md mt-12 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-white">Your Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[3/4] rounded-lg bg-white/5 overflow-hidden">
                <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
