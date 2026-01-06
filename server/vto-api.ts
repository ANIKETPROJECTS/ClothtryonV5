import { Express } from "express";
import path from "path";
import fs from "fs/promises";
import { log } from "./index";

export function setupVTOApi(app: Express) {
  app.post("/api/vto/image-try-on", async (req, res) => {
    try {
      const { personImage, clothingImage } = req.body;

      if (!personImage || !clothingImage) {
        return res.status(400).json({ message: "Missing images" });
      }

      const hfToken = process.env.HF_API_TOKEN;
      if (!hfToken) {
        return res.status(500).json({ message: "Hugging Face API token not configured. Please add HF_API_TOKEN to secrets." });
      }

      // 1. Convert base64 to Blob for Hugging Face API
      const personBase64 = personImage.split(",")[1];
      const clothBase64 = clothingImage.split(",")[1];

      try {
        log("Sending images to Hugging Face IDM-VTON model...");
        
        // Using IDM-VTON via Hugging Face Inference API
        const response = await fetch(
          "https://api-inference.huggingface.co/models/yisol/IDM-VTON",
          {
            headers: {
              Authorization: `Bearer ${hfToken}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
              inputs: {
                person_image: personBase64,
                garment_image: clothBase64,
              }
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HF API Error: ${response.status} - ${errorText}`);
        }

        const resultBlob = await response.blob();
        const buffer = Buffer.from(await resultBlob.arrayBuffer());
        const resultBase64 = buffer.toString("base64");

        return res.json({ 
          resultImage: `data:image/png;base64,${resultBase64}`,
          status: "success"
        });

      } catch (hfError: any) {
        log(`Hugging Face Error: ${hfError.message}`, "error");
        
        // Fallback or detailed error message
        return res.json({ 
          message: "The AI model is currently busy or warming up. Please try again in a few moments.",
          status: "placeholder",
          debug: hfError.message
        });
      }
    } catch (error) {
      log(`VTO API Error: ${error}`, "error");
      res.status(500).json({ message: "VTO processing failed" });
    }
  });
}
