import ProductClient from "@/components/ProductClient";

export async function generateStaticParams() {
    // For static export, you need to provide at least one param 
    // or handle the dynamic case differently. 
    // Returning an empty array usually means it won't pre-render any specific IDs 
    // but with output:export it might still error if it's dynamic.
    // Let's return a dummy to see if it unblocks.
    return [{ id: 'placeholder' }];
}

export default function ProductPage() {
    return <ProductClient />;
}
