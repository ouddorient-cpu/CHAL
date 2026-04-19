"use client";

import { useEffect, useState } from "react";
import { getAnnonces } from "@/services/dataService";
import { Annonce, AnnonceCategory } from "@/types";
import {
    Megaphone, Smartphone, Shirt, Sofa, ShoppingBasket, Wrench,
    Package, MapPin, ChevronRight, Plus, Search, Tag
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

// ── Category config ───────────────────────────────────────────────

type CategoryKey = AnnonceCategory | 'all';

interface CatConfig {
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
}

const CATEGORY_CONFIG: Record<AnnonceCategory, CatConfig> = {
    'Électronique': { icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    'Vêtements': { icon: Shirt, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' },
    'Meubles': { icon: Sofa, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'Alimentation': { icon: ShoppingBasket, color: 'text-emerald-primary', bg: 'bg-emerald-primary/10', border: 'border-emerald-primary/20' },
    'Services': { icon: Wrench, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100' },
    'Autres': { icon: Package, color: 'text-gray-500', bg: 'bg-surface', border: 'border-border-subtle' },
};

// ── AnnonceCard ───────────────────────────────────────────────────

function AnnonceCard({ annonce }: { annonce: Annonce }) {
    const { t, lang } = useLanguage();
    const cfg = CATEGORY_CONFIG[annonce.category] || CATEGORY_CONFIG['Autres'];
    const Icon = cfg.icon;

    const labelMap: Record<string, string> = {
        'Électronique': 'electroTab',
        'Vêtements': 'vetementsTab',
        'Meubles': 'meublesTab',
        'Alimentation': 'alimentationTab',
        'Services': 'servicesTab',
        'Autres': 'autresTab'
    };
    const categoryLabel = t(labelMap[annonce.category] as any || 'autresTab');

    return (
        <Link
            href={`/annonces/placeholder?id=${annonce.id}`}
            className="flex items-center gap-4 bg-white rounded-3xl p-3 shadow-xl shadow-emerald-900/5 border border-border-subtle active:scale-[0.98] transition-all group"
        >
            {/* Image or icon placeholder */}
            <div className={`w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border ${cfg.border} ${cfg.bg} flex items-center justify-center`}>
                {annonce.imageUrl ? (
                    <img src={annonce.imageUrl} alt={annonce.title} className="w-full h-full object-cover" />
                ) : (
                    <Icon size={32} className={cfg.color} strokeWidth={1.5} />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 py-0.5">
                {/* Category + sold badge */}
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${cfg.bg} ${cfg.color}`}>
                        {categoryLabel}
                    </span>
                    {annonce.status === 'sold' && (
                        <span className="text-[8px] font-black bg-red-100 text-red-500 px-2 py-0.5 rounded-full uppercase">{t('vendu')}</span>
                    )}
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-foreground text-sm leading-tight line-clamp-1">{annonce.title}</h3>

                {/* Price + neighborhood */}
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-black text-emerald-primary">
                        {annonce.price === 0 ? t('gratuit') : `${annonce.price} DH`}
                        {annonce.priceType === 'negotiable' && annonce.price > 0 && (
                            <span className="text-[9px] font-bold text-muted ml-1">({t('negociableAbbr')})</span>
                        )}
                    </span>
                    {annonce.neighborhood && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-muted">
                            <MapPin size={9} className="text-emerald-primary/40 flex-shrink-0" />
                            <span className="truncate max-w-[70px]">{annonce.neighborhood}</span>
                        </div>
                    )}
                </div>
            </div>

            <ChevronRight size={18} className="text-border-subtle group-hover:text-emerald-primary transition-colors flex-shrink-0" />
        </Link>
    );
}

// ── Page ──────────────────────────────────────────────────────────

export default function AnnoncesPage() {
    const { t } = useLanguage();
    const [annonces, setAnnonces] = useState<Annonce[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
    const [searchQuery, setSearchQuery] = useState("");

    const FILTER_TABS: Array<{ key: CategoryKey; labelKey: string }> = [
        { key: 'all', labelKey: 'toutTab' },
        { key: 'Électronique', labelKey: 'electroTab' },
        { key: 'Vêtements', labelKey: 'vetementsTab' },
        { key: 'Meubles', labelKey: 'meublesTab' },
        { key: 'Alimentation', labelKey: 'alimentationTab' },
        { key: 'Services', labelKey: 'servicesTab' },
        { key: 'Autres', labelKey: 'autresTab' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const cat = selectedCategory === 'all' ? undefined : selectedCategory as AnnonceCategory;
                const data = await getAnnonces(cat, 'active');
                setAnnonces(data);
            } catch (err) {
                console.error("AnnoncesPage error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory]);

    const filtered = annonces.filter(a =>
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.neighborhood || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen bg-background font-sans">

            {/* Header */}
            <div className="bg-white/90 backdrop-blur-xl px-6 py-5 border-b border-border-faint flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-violet-500 rounded-xl flex items-center justify-center">
                        <Megaphone size={18} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="font-black text-lg tracking-tight text-foreground uppercase leading-none">{t('annonces')}</h1>
                        <p className="text-[9px] font-black text-muted uppercase tracking-widest">{t('communauteCH7AL')}</p>
                    </div>
                </div>
                <Link
                    href="/add/annonce"
                    className="w-10 h-10 bg-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 active:scale-90 transition-all"
                >
                    <Plus size={20} className="text-white" strokeWidth={2.5} />
                </Link>
            </div>

            <main className="flex-1 flex flex-col pb-28">

                {/* Search bar */}
                <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-border-subtle shadow-sm">
                        <Search size={16} className="text-muted flex-shrink-0" />
                        <input
                            type="text"
                            placeholder={t('rechercherAnnonce')}
                            className="flex-1 bg-transparent text-sm font-bold text-foreground placeholder:text-faint outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category filter pills */}
                <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setSelectedCategory(tab.key)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${selectedCategory === tab.key
                                ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                                : 'bg-white text-muted border border-border-faint'
                                }`}
                        >
                            {t(tab.labelKey as any)}
                        </button>
                    ))}
                </div>

                {/* Annonces list */}
                <div className="flex-1 px-4 space-y-3">
                    {loading ? (
                        // Skeleton loaders
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white rounded-3xl p-3 border border-border-faint animate-pulse">
                                <div className="w-20 h-20 rounded-2xl bg-surface flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-surface rounded-full w-3/4" />
                                    <div className="h-4 bg-surface rounded-full w-full" />
                                    <div className="h-3 bg-surface rounded-full w-1/2" />
                                </div>
                            </div>
                        ))
                    ) : filtered.length === 0 ? (
                        // Empty state
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center">
                                <Tag size={32} className="text-violet-300" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-foreground text-lg">{t('aucuneAnnonce')}</h3>
                                <p className="text-muted text-sm font-bold max-w-[200px]">
                                    {searchQuery ? t('aucunResultatRecherche') : t('soyezPremierAnnonce')}
                                </p>
                            </div>
                            <Link
                                href="/add/annonce"
                                className="bg-violet-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                            >
                                {t('publierAnnonceBtn')}
                            </Link>
                        </div>
                    ) : (
                        filtered.map(a => <AnnonceCard key={a.id} annonce={a} />)
                    )}
                </div>
            </main>

            {/* FAB — visible only when there are annonces */}
            {!loading && filtered.length > 0 && (
                <Link
                    href="/add/annonce"
                    className="fixed bottom-24 right-4 z-40 bg-violet-500 text-white p-4 rounded-2xl shadow-2xl shadow-violet-500/30 active:scale-90 transition-all border-2 border-white flex items-center gap-2"
                >
                    <Plus size={22} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest pr-1">{t('publierAnnonceBtn')}</span>
                </Link>
            )}
        </div>
    );
}
