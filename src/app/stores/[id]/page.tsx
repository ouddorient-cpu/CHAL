import StoreDetailClient from "@/components/StoreDetailClient";

export async function generateStaticParams() {
    // For static export, we provide a placeholder to bypass the pre-rendering check.
    // In Capacitor, the client-side router will handle the actual IDs.
    return [{ id: 'placeholder' }];
}

export default function StoreDetailPage() {
    return <StoreDetailClient />;
}
