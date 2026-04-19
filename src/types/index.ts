import { Timestamp } from 'firebase/firestore';

export type Unit = 'kg' | 'L' | 'pièce' | 'g' | 'ml';

export interface UserLevel {
    name: string;
    level: number;
    badge: string;
    color: string;
    minContributions: number;
}

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
    city?: string;
    contributionsCount: number;
    levelInfo?: UserLevel;
    createdAt: Timestamp;
}

export interface Store {
    id: string;
    name: string;
    address: string;
    city: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    createdBy: string;
    neighborhood?: string;
    createdAt: Timestamp;
}

export interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    barcode?: string;
    imageUrl?: string;
    unit: Unit;
    upVotes?: number;
    downVotes?: number;
    createdAt: Timestamp;
}

export interface ProductComment {
    id: string;
    productId: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    content: string;
    createdAt: Timestamp;
}

export interface PriceContribution {
    id: string;
    productId: string;
    storeId: string;
    userId: string;
    price: number;
    currency: 'MAD';
    sourceType: 'manual' | 'scan' | 'ticket' | 'ai_photo';
    imageUrl?: string;
    neighborhood?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    createdAt: Timestamp;
}

export interface ProductStats {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    count: number;
}

// ── Petites Annonces ──────────────────────────────────────────────

export type AnnonceCategory =
    | 'Électronique'
    | 'Vêtements'
    | 'Meubles'
    | 'Alimentation'
    | 'Services'
    | 'Autres';

export type AnnoncePriceType = 'fixed' | 'negotiable' | 'free';

export interface Annonce {
    id: string;
    title: string;
    description: string;
    price: number;              // 0 si gratuit
    priceType: AnnoncePriceType;
    category: AnnonceCategory;
    imageUrl?: string;          // base64 data URL (MVP)
    userId: string;
    userName: string;
    userPhoto?: string;
    whatsapp: string;           // "0612345678" → wa.me/212612345678 au render
    neighborhood?: string;
    status: 'active' | 'sold';
    createdAt: Timestamp;
}
