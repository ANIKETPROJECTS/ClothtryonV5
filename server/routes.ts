import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupVTOApi } from "./vto-api";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  setupVTOApi(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  app.get(api.products.getBySku.path, async (req, res) => {
    const product = await storage.getProductBySku(req.params.sku);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  // Seed initial data if empty
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getProducts();
  if (existing.length === 0) {
    const productsToSeed = [
      {
        name: "ONYU Signature Tee",
        description: "The cornerstone of the ONYU collection. Crafted from 240GSM premium heavyweight cotton, this tee offers a structured yet breathable fit. Features dropped shoulders and a reinforced collar for longevity.",
        detailedDescription: "Designed for ultimate comfort and durability, our signature tee is made from sustainably sourced 240gsm organic cotton. The silicon wash finish provides a luxuriously soft hand-feel, while the reinforced double-stitched seams ensure it maintains its shape through countless wears and washes. Features a contemporary oversized silhouette with dropped shoulders and a thick ribbed collar.",
        price: 2499,
        sku: "ONYU-TEE-001",
        images: {
          front: "/src/assets/generated_images/signature_onyu_black_t-shirt_front_view_(no_background).png",
          back: "/src/assets/generated_images/signature_onyu_black_t-shirt_back_view_(no_background).png",
          left: "/src/assets/generated_images/signature_onyu_black_t-shirt_left_side_view_(no_background).png",
          right: "/src/assets/generated_images/signature_onyu_black_t-shirt_right_side_view_(no_background).png"
        },
        features: ["240GSM Heavyweight Cotton", "Oversized Boxy Fit", "Reinforced Crew Neck", "Eco-friendly Silicon Wash"],
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        similarProducts: [2, 3]
      },
      {
        name: "ONYU Stealth Hoodie",
        description: "Minimalist design meets extreme comfort. Our Stealth Hoodie is made from premium French Terry with a unique water-resistant finish.",
        detailedDescription: "The Stealth Hoodie represents our commitment to performance-led design. Built with 400GSM French Terry fabric, it features a unique water-resistant finish that repels light rain while remaining completely breathable. Includes hidden zippered tech pockets and a double-lined structured hood.",
        price: 4999,
        sku: "ONYU-HD-002",
        images: {
          front: "/src/assets/generated_images/premium_black_stealth_hoodie_product_shot.png",
          back: "/src/assets/generated_images/premium_black_hoodie_back_view_(no_background).png",
          left: "/src/assets/generated_images/premium_black_hoodie_left_side_view_(no_background).png",
          right: "/src/assets/generated_images/premium_black_hoodie_right_side_view_(no_background).png"
        },
        features: ["400GSM French Terry", "Water-resistant Coating", "Hidden Tech Pockets", "Double-lined Hood"],
        sizes: ["S", "M", "L", "XL"],
        similarProducts: [1, 3]
      },
      {
        name: "ONYU Cargo Joggers",
        description: "Utility refined. These joggers feature a technical nylon-stretch blend with six functional pockets.",
        detailedDescription: "Engineered for movement, the ONYU Cargo Joggers blend technical performance with streetwear aesthetics. The 4-way stretch technical nylon fabric provides unrestricted mobility, while the six-pocket configuration offers ample storage for essentials. Features articulated knees and adjustable toggles at the hem.",
        price: 3999,
        sku: "ONYU-JG-003",
        images: {
          front: "/src/assets/generated_images/premium_technical_cargo_joggers_product_shot.png",
          back: "/src/assets/generated_images/premium_black_cargo_joggers_back_view_(no_background).png",
          left: "/src/assets/generated_images/premium_black_cargo_joggers_left_side_view_(no_background).png",
          right: "/src/assets/generated_images/premium_black_cargo_joggers_right_side_view_(no_background).png"
        },
        features: ["4-Way Stretch Nylon", "Articulated Knee Design", "Snap-closure Cargo Pockets", "Adjustable Tapered Fit"],
        sizes: ["S", "M", "L", "XL"],
        similarProducts: [1, 2]
      }
    ];

    for (const product of productsToSeed) {
      await storage.createProduct(product);
    }
  }
}
