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

      const hfToken = process.env.HF_TOKEN;
      if (!hfToken) {
        return res.status(500).json({ message: "Hugging Face API token not configured" });
      }

      // 1. Convert base64 to Blob for Hugging Face API
      const personBase64 = personImage.split(",")[1];
      const clothBase64 = clothingImage.split(",")[1];

      // Note: In a production environment, we'd use a dedicated client
      // For now, we'll interface with a popular VTO model on Hugging Face
      // Model: Nymbo/Virtual-Try-On (highly rated for garment preservation)
      
      try {
        log("Sending images to Hugging Face VTO model...");
        
        // This is a simplified interface to a Hugging Face Space/Model
        // For production, we'd use the @huggingface/inference library
        const response = await fetch(
          "https://api-inference.huggingface.co/models/Nymbo/Virtual-Try-On",
          {
            headers: {
              Authorization: `Bearer ${hfToken}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
              inputs: {
                background: personBase64,
                garment: clothBase64,
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
