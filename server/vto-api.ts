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
        // Updated prompt to emphasize strict preservation of the person's identity and background.
        // We use "Image-to-Image" style instructions.
        const resultImage = await generateImageMultimodal(
          "STRICTLY PRESERVE THE PERSON IN THE FIRST IMAGE. DO NOT CHANGE THEIR FACE, POSE, OR IDENTITY. Only replace their current shirt with the exact clothing item shown in the second image. The result must be the SAME PERSON from the first image now wearing the garment from the second image. The background must remain identical to the first image. High-resolution, professional fashion edit.",
          [
            { data: personImage, mimeType: "image/jpeg" }, 
            { data: clothingImage, mimeType: "image/png" }  
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
