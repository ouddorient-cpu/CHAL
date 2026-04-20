import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export const AIScanResultSchema = z.object({
    productName: z.string(),
    brand: z.string(),
    price: z.string(),
    category: z.enum(["Épicerie", "Boissons", "Crèmerie", "Hygiène", "Entretien", "Autres"]).optional(),
    confidence: z.number().min(0).max(1),
});

export type AIScanResult = z.infer<typeof AIScanResultSchema>;

const FALLBACK: AIScanResult = {
    productName: "Produit non identifié",
    brand: "Inconnue",
    price: "",
    confidence: 0,
};

export const analyzeProductImage = async (base64Image: string): Promise<AIScanResult> => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("CH7AL AI: clé Gemini manquante");
        return FALLBACK;
    }

    const imageData = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    if (!imageData || imageData.length < 100) {
        console.error("CH7AL AI: image vide ou invalide");
        return FALLBACK;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // gemini-2.0-flash: meilleure reconnaissance multimodale
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Tu analyses une photo prise dans un épicerie/supermarché au Maroc.

Lis l'étiquette, le packaging, et le prix si visible.

Réponds UNIQUEMENT avec ce JSON (rien d'autre) :
{
  "productName": "Type + Marque + Format (ex: Lait UHT Centrale 1L, Coca-Cola 33cl, Savon Lux 90g)",
  "brand": "nom de la marque uniquement",
  "price": "prix en chiffres si visible sur l'image, sinon chaîne vide",
  "category": "une seule valeur parmi: Épicerie, Boissons, Crèmerie, Hygiène, Entretien, Autres",
  "confidence": nombre entre 0 et 1 selon ta certitude
}`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } },
        ]);

        const text = result.response.text().trim();
        console.log("CH7AL AI raw:", text);

        // Extraire le JSON même si le modèle ajoute du texte autour
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Pas de JSON dans la réponse");

        const parsed = JSON.parse(jsonMatch[0]);
        return AIScanResultSchema.parse(parsed);

    } catch (err) {
        console.error("CH7AL AI error:", err);
        return FALLBACK;
    }
};
