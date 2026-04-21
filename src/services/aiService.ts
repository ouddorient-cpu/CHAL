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

// ── Step 1: Cloud Vision API — OCR + logo detection ───────────────────────────
async function extractWithVision(imageData: string, apiKey: string): Promise<string> {
    try {
        const res = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requests: [{
                        image: { content: imageData },
                        features: [
                            { type: "TEXT_DETECTION" },
                            { type: "LOGO_DETECTION", maxResults: 3 },
                            { type: "LABEL_DETECTION", maxResults: 5 },
                        ],
                    }],
                }),
            }
        );

        if (!res.ok) {
            console.warn("CH7AL Vision HTTP", res.status, await res.text());
            return "";
        }

        const data = await res.json();
        const r = data.responses?.[0];
        if (!r) return "";

        const text  = (r.fullTextAnnotation?.text || r.textAnnotations?.[0]?.description || "").slice(0, 400);
        const logo  = r.logoAnnotations?.[0]?.description || "";
        const labels = (r.labelAnnotations || []).map((l: any) => l.description).slice(0, 5).join(", ");

        const parts: string[] = [];
        if (text)   parts.push(`Texte lu sur le produit: "${text.replace(/\n/g, ' ')}"`);
        if (logo)   parts.push(`Logo/Marque détecté: "${logo}"`);
        if (labels) parts.push(`Éléments visuels: ${labels}`);

        console.log("CH7AL Vision context:", parts.join(" | "));
        return parts.join("\n");

    } catch (err) {
        console.warn("CH7AL Vision error:", err);
        return "";
    }
}

// ── Step 2: Gemini — product identification with Vision context ───────────────
export const analyzeProductImage = async (base64Image: string): Promise<AIScanResult> => {
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const mapsKey   = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    if (!geminiKey) {
        console.error("CH7AL AI: NEXT_PUBLIC_GEMINI_API_KEY manquante");
        return FALLBACK;
    }

    const imageData = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    if (!imageData || imageData.length < 100) {
        console.error("CH7AL AI: image invalide");
        return FALLBACK;
    }

    // Vision API (nouvelle clé) extracts text/logo first
    const visionContext = mapsKey ? await extractWithVision(imageData, mapsKey) : "";

    const prompt = `Tu analyses une photo de produit de supermarché ou épicerie.
${visionContext ? `\nDonnées extraites par Vision AI:\n${visionContext}\n` : ""}
Identifie le produit à partir de l'image et des données ci-dessus.

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte autour) :
{"productName":"nom complet (marque + type + format)","brand":"marque uniquement","price":"prix si lisible sinon vide","category":"Épicerie | Boissons | Crèmerie | Hygiène | Entretien | Autres","confidence":0.92}

Note: confidence = ta certitude réelle (0.0 = rien identifiable, 1.0 = nom/marque lus clairement).`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

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
                generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
            }),
        });

        if (!res.ok) {
            console.error(`CH7AL AI HTTP ${res.status}:`, await res.text());
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
