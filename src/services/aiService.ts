import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

/**
 * AI Service for Hanout Price
 * Integrated with Gemini 1.5 Flash for high-speed, multimodal product recognition.
 * Logic adapted from the premium AdVise architecture.
 */

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Strict schema validation inspired by the AdVise architecture
export const AIScanResultSchema = z.object({
    productName: z.string().describe("Full descriptive name: type + brand + size"),
    brand: z.string().describe("Main brand name"),
    price: z.string().describe("Extracted price if visible"),
    category: z.enum(["Épicerie", "Boissons", "Crèmerie", "Hygiène", "Entretien", "Autres"]).optional(),
    confidence: z.number().min(0).max(1)
});

export type AIScanResult = z.infer<typeof AIScanResultSchema>;

export const analyzeProductImage = async (base64Image: string): Promise<AIScanResult> => {
    try {
        console.log("CH7AL AI Vision: Analysing Moroccan product...");

        if (!base64Image || !base64Image.includes(",")) {
            console.error("CH7AL AI: Image malformée ou vide");
            throw new Error("Image invalide pour l'analyse");
        }

        // Extract raw base64 data
        const imageData = base64Image.split(",")[1];

        if (!imageData || imageData.length < 10) {
            console.error("CH7AL AI: Données base64 vides");
            throw new Error("L'image capturée est vide");
        }

        // Using gemini-1.5-flash: high context, multimodal, extremely fast
        console.log("CH7AL AI: Using model gemini-1.5-flash");
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `You are a high-precision product recognition assistant for CH7AL, a Moroccan price-tracking app. 
        
        Analyze the provided image using multimodal vision logic:
        1. **Vision Analysis**: Identify the container shape (flacon, pot, tube, packet), texture, and material.
        2. **OCR / Label Reading**: Read the text on the label to identify the brand, product name, and weight/volume (e.g., 1L, 200g, 33cl).
        3. **Contextual Recognition**: Identify the product type even if partially obscured, using common Moroccan supermarket inventory knowledge.

        SCHEMATIC INSTRUCTIONS:
        - productName: Format "Type + Brand + Format" (e.g., "Lait UHT Centrale 1L", "Chips Rik Rak Piment").
        - brand: The dominant brand name.
        - price: Extract a numeric price (e.g. "13.50") ONLY if a price tag, sticker, or shelf label is clearly visible.
        - category: Choose the best fit from: Épicerie, Boissons, Crèmerie, Hygiène, Entretien, Autres.
        - confidence: 0 to 1 based on how likely the identification is correct.

        Return ONLY a JSON object matching this schema:
        {
          "productName": string,
          "brand": string,
          "price": string,
          "category": string,
          "confidence": number
        }`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageData,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        console.log("CH7AL AI Raw Response:", text);

        try {
            const data = JSON.parse(text);
            const validated = AIScanResultSchema.parse(data);
            console.log("CH7AL AI Validated Data:", validated);
            return validated;
        } catch (parseError) {
            console.error("AI Response Parsing/Validation Error:", parseError, text);
            // Fallback: try to find JSON in text if model added extra markers
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const retryData = JSON.parse(jsonMatch[0]);
                return AIScanResultSchema.parse(retryData);
            }
            throw parseError;
        }

        throw new Error("Invalid AI Response format");

    } catch (error: any) {
        console.error("AI Analysis Error Details:", error);
        // Fallback for safety
        return {
            productName: "Produit non identifié",
            brand: "Inconnue",
            price: "",
            confidence: 0
        };
    }
};
