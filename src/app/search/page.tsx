"use client";

import { useState } from "react";
import { getProducts } from "@/services/dataService";
import { Product } from "@/types";
import { Search, X, Tag, ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { useLanguage } from "@/context/LanguageContext";

export default function SearchPage() {
    const { t } = useLanguage();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (q: string) => {
        setQuery(q);
        if (!q.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            const all = await getProducts();
            const lower = q.toLowerCase();
            setResults(
                all.filter(
                    (p) =>
                        p.name.toLowerCase().includes(lower) ||
                        p.brand.toLowerCase().includes(lower) ||
                        p.category.toLowerCase().includes(lower)
                )
            );
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />

            <div className="p-4 space-y-6 pt-6">
                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder={t('nomMarqueCategorie')}
                        className="w-full bg-white border border-border-faint rounded-[2rem] py-4 pl-12 pr-12 text-sm font-bold shadow-sm focus:ring-8 focus:ring-emerald-primary/5 focus:border-emerald-primary outline-none transition-all text-foreground placeholder:text-faint"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        autoFocus
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(""); setResults([]); setHasSearched(false); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                            aria-label={t('effacerRecherche')}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Results */}
                <div className="space-y-3">
                    {query.length > 0 ? (
                        <h3 className="text-sm font-bold text-muted uppercase tracking-wider">{t('resultats')} ({results.length})</h3>
                    ) : (
                        <p className="text-muted text-sm">{t('saisirNom')}</p>
                    )}

                    {results.map((p) => (
                        <Link
                            key={p.id}
                            href={`/product/${p.id}`}
                            className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-border-faint premium-shadow-sm active:scale-95 transition-all text-left group hover:border-emerald-primary/30"
                        >
                            <div className="w-14 h-14 bg-surface rounded-[1.2rem] flex items-center justify-center text-border-subtle group-hover:bg-emerald-primary/5 group-hover:text-emerald-primary transition-colors overflow-hidden">
                                {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover rounded-[1.2rem]" alt={p.name} /> : <Tag size={24} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-extrabold text-foreground text-sm tracking-tight">{p.name}</h4>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-wider">{p.brand} • {p.unit}</p>
                            </div>
                            <ChevronRight size={18} className="text-border-subtle group-hover:text-emerald-primary transition-colors" />
                        </Link>
                    ))}

                    {hasSearched && results.length === 0 && !loading && (
                        <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-border-subtle">
                            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package size={28} className="text-border-subtle" />
                            </div>
                            <p className="text-muted font-medium">{t('aucunProduit')}</p>
                            <p className="text-faint text-xs mt-1">{t('essayezAutre')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
