import AnnonceDetailClient from "@/components/AnnonceDetailClient";

export async function generateStaticParams() {
    // Placeholder for static export — real IDs are handled client-side
    return [{ id: 'placeholder' }];
}

export default function AnnoncePage() {
    return <AnnonceDetailClient />;
}
