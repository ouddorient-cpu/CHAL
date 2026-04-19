"use client";

import { Product, ProductStats } from "@/types";
import { ChevronRight, MapPin, Tag } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface ProductCardProps {
    product: Product;
    stats?: ProductStats;
    variant?: 'grid' | 'list';
    latestPrice?: {
        price: number;
        storeName?: string;
        neighborhood?: string;
    };
}

export default function ProductCard({ product, stats, variant = 'grid', latestPrice }: ProductCardProps) {
    const { t } = useLanguage();

    if (variant === 'list') {
        return (
            <Link
                href={`/product/placeholder?id=${product.id}`}
                className="flex items-center gap-4 bg-card rounded-3xl p-3 premium-shadow-sm border border-border-subtle active:scale-[0.98] transition-all group"
            >
                <div className="w-24 h-24 flex-shrink-0 bg-surface rounded-2xl overflow-hidden border border-border-faint">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-border-subtle">
                            <Tag size={24} strokeWidth={1.5} />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[8px] font-black text-emerald-primary bg-emerald-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            {product.category}
                        </span>
                        {product.brand && (
                            <span className="text-[8px] font-bold text-muted uppercase tracking-widest truncate max-w-[80px]">
                                {product.brand}
                            </span>
                        )}
                    </div>

                    <h3 className="font-extrabold text-foreground text-sm line-clamp-1 mt-1">{product.name}</h3>

                    <div className="flex items-center gap-3 mt-2">
                        {stats && typeof stats.avgPrice === 'number' ? (
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-sm font-black text-emerald-primary">
                                    ~{stats.avgPrice.toFixed(2)}
                                </span>
                                <span className="text-[7px] font-black text-emerald-primary italic">DH</span>
                            </div>
                        ) : latestPrice && typeof latestPrice.price === 'number' ? (
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-sm font-black text-emerald-primary">
                                    {latestPrice.price.toFixed(2)}
                                </span>
                                <span className="text-[7px] font-black text-emerald-primary italic">DH</span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold text-border-subtle uppercase italic">{t('prixQuestion')}</span>
                        )}

                        {(latestPrice?.storeName || latestPrice?.neighborhood) && (
                            <div className="flex items-center gap-2 text-[9px] font-bold text-muted">
                                <div className="flex items-center gap-1 max-w-[80px]">
                                    <MapPin size={10} className="text-emerald-primary/40" />
                                    <span className="truncate">{latestPrice.neighborhood || latestPrice.storeName}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {stats && stats.count > 1 && (
                        <p className="text-[8px] font-bold text-muted mt-1">
                            {t('baseSur')} {stats.count} {t('observations')}
                        </p>
                    )}
                </div>

                <div className="text-border-subtle group-hover:text-emerald-primary transition-colors">
                    <ChevronRight size={18} />
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={`/product/placeholder?id=${product.id}`}
            className="block bg-card rounded-[2rem] premium-shadow-sm border border-border-subtle overflow-hidden active:scale-[0.97] transition-all hover:border-emerald-primary/20 group"
        >
            <div className="relative aspect-square bg-surface overflow-hidden">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-border-subtle">
                        <Tag size={40} strokeWidth={1.5} />
                    </div>
                )}
                <div className="absolute top-3 left-3 bg-card/80 backdrop-blur-md px-3 py-1 rounded-xl text-[9px] font-black text-emerald-primary uppercase tracking-[0.1em] shadow-sm border border-white/20">
                    {product.category}
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-extrabold text-foreground line-clamp-1 text-sm tracking-tight">{product.name}</h3>
                <p className="text-[10px] text-muted font-bold mb-3 uppercase tracking-wider">{product.brand}</p>

                {stats && typeof stats.avgPrice === 'number' ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-lg font-black text-emerald-primary">
                                    {stats.avgPrice.toFixed(2)}
                                </span>
                                <span className="text-[9px] font-black text-emerald-primary italic ml-0.5 tracking-tighter">DH</span>
                            </div>
                            <div className="text-[9px] font-black text-emerald-primary bg-emerald-primary/5 px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-primary/10">
                                <MapPin size={10} />
                                {stats.count}
                            </div>
                        </div>
                    </div>
                ) : latestPrice && typeof latestPrice.price === 'number' ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-lg font-black text-emerald-primary">
                                {latestPrice.price.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-black text-emerald-primary italic ml-0.5 tracking-tighter">DH</span>
                        </div>
                        <div className="text-[9px] font-black text-muted truncate max-w-[60px]">
                            {latestPrice.neighborhood || latestPrice.storeName}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-2 bg-surface rounded-xl text-[10px] text-muted font-bold uppercase tracking-widest border border-dashed border-border-subtle">
                        {t('prixQuestion')}
                    </div>
                )}
            </div>
        </Link>
    );
}
