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
        console.error("CH7AL AI: NEXT_PUBLIC_GEMINI_API_KEY manquante");
        return FALLBACK;
    }

    const imageData = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    if (!imageData || imageData.length < 100) {
        console.error("CH7AL AI: image invalide");
        return FALLBACK;
    }

    const prompt = `Tu analyses une photo de produit (épicerie, électronique, cosmétique…).
Lis l'étiquette, le packaging ou tout texte visible.

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans texte autour) :
{
  "productName": "nom complet du produit (marque + type + format si visible)",
  "brand": "marque uniquement",
  "price": "prix en chiffres si lisible sur l'image, sinon chaîne vide",
  "category": "une seule valeur: Épicerie, Boissons, Crèmerie, Hygiène, Entretien, ou Autres",
  "confidence": 0.0
}`;

    // Appel direct REST — évite les bugs SDK
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/jpeg", data: imageData } },
                    ],
                }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`CH7AL AI HTTP ${res.status}:`, errText);
            return FALLBACK;
        }

        const json = await res.json();
        const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        console.log("CH7AL AI raw response:", text);

        const match = text.match(/\{[\s\S]*\}/);
        if (!match) {
            console.error("CH7AL AI: pas de JSON dans la réponse", text);
            return FALLBACK;
        }

        const parsed = JSON.parse(match[0]);
        return AIScanResultSchema.parse(parsed);

    } catch (err) {
        console.error("CH7AL AI fetch error:", err);
        return FALLBACK;
    }
};
