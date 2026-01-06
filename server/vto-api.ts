import { Express } from "express";
import { log } from "./index";
import { generateImageMultimodal } from "./replit_integrations/image";

export function setupVTOApi(app: Express) {
  app.post("/api/vto/image-try-on", async (req, res) => {
    try {
      const { personImage, clothingImage } = req.body;

      if (!personImage || !clothingImage) {
        return res.status(400).json({ message: "Missing images" });
      }

      log("Processing Multimodal Image Try-On with Gemini 2.5 Flash...");
      
      try {
        // We provide both the person and the garment to Gemini.
        // The model will generate a new image preserving the person's identity and mapping the garment.
        const resultImage = await generateImageMultimodal(
          "Take the person from the first image and map the clothing item from the second image onto them. Preserve the person's facial features, pose, and background exactly. The person should now be wearing the garment from the second image. High-quality fashion photography style.",
          [
            { data: personImage, mimeType: "image/jpeg" }, // Usually person upload
            { data: clothingImage, mimeType: "image/png" }  // Garment image
          ]
        );

        return res.json({ 
          resultImage,
          status: "success"
        });

      } catch (error: any) {
        log(`Gemini Multimodal VTO Error: ${error.message}`, "error");
        return res.json({ 
          message: "The AI model is temporarily unavailable or struggling with this specific transformation. Please try again.",
          status: "placeholder",
          debug: error.message
        });
      }
    } catch (error) {
      log(`VTO API Error: ${error}`, "error");
      res.status(500).json({ message: "VTO processing failed" });
    }
  });
}
