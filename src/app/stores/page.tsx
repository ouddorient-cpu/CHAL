"use client";

import Header from "@/components/layout/Header";
import StoreCard from "@/components/ui/StoreCard";
import { getStores } from "@/services/dataService";
import { Store } from "@/types";
import { MapPin, Search, SlidersHorizontal, Map as MapIcon, List as ListIcon, Plus, ChevronRight, LocateFixed } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function StoresPage() {
    const { t } = useLanguage();
    const neighborhoods = [t('tousFilter'), "Hamria", "Mansour", "Zitoune", "Plaisance", "Marjane"];

    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [activeFilter, setActiveFilter] = useState(t('tousFilter'));
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const data = await getStores();
            setStores(data);
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredStores = stores.filter(store => {
        const matchesNeighborhood = activeFilter === t('tousFilter') || store.address.includes(activeFilter);
        const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesNeighborhood && matchesSearch;
    });

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />

            <main className="flex-1 pb-24">
                {/* Search & Discovery Header */}
                <div className="p-4 space-y-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted group-focus-within:text-emerald-primary transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder={t('rechercherHanout')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface border border-border-faint rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-emerald-primary/50 focus:ring-4 focus:ring-emerald-primary/5 transition-all text-foreground placeholder:text-faint"
                        />
                        <button aria-label={t('filtrer')} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-primary/10 text-emerald-primary rounded-xl">
                            <SlidersHorizontal size={16} />
                        </button>
                    </div>

                    {/* Neighborhood Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-4 px-4">
                        {neighborhoods.map((n) => (
                            <button
                                key={n}
                                onClick={() => setActiveFilter(n)}
                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeFilter === n
                                    ? "bg-emerald-primary text-white border-emerald-primary shadow-lg shadow-emerald-900/20 scale-105"
                                    : "bg-white text-muted border-border-faint"
                                    }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-emerald-primary rounded-full"></div>
                            <h2 className="text-sm font-black text-foreground uppercase tracking-tight">
                                {filteredStores.length} {t('hanoutsAMeknes')}
                            </h2>
                        </div>

                        <div className="flex bg-surface p-1 rounded-xl border border-border-faint">
                            <button
                                aria-label={t('vueListe')}
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-primary' : 'text-muted'}`}
                            >
                                <ListIcon size={18} />
                            </button>
                            <Link
                                aria-label={t('vueCarte')}
                                href="/map"
                                className={`p-1.5 rounded-lg transition-all text-muted hover:text-emerald-primary`}
                            >
                                <MapIcon size={18} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="px-4 space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-emerald-primary/20 border-t-emerald-primary rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest animate-pulse">{t('chargementDesHanouts')}...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filteredStores.length > 0 ? (
                                filteredStores.map((store, index) => (
                                    <motion.div
                                        key={store.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link href={`/stores/${store.id}`}>
                                            <StoreCard store={store} />
                                        </Link>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-surface rounded-[2.5rem] p-12 text-center border-2 border-dashed border-border-faint"
                                >
                                    <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl text-border-subtle">
                                        <MapPin size={40} />
                                    </div>
                                    <p className="text-foreground font-black text-lg">{t('aucunHanoutIci')}</p>
                                    <p className="text-muted text-xs mt-2 max-w-[200px] mx-auto">{t('aucunHanoutQuartierDesc')}</p>
                                    <Link
                                        href="/add/product"
                                        className="inline-flex items-center gap-2 mt-8 bg-emerald-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-900/40 active:scale-95 transition-all"
                                    >
                                        <Plus size={16} />
                                        {t('ajouterLePremier')}
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                {/* Recommendation Section */}
                {!loading && filteredStores.length > 0 && (
                    <div className="p-4 mt-6">
                        <section className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <span className="inline-block bg-emerald-accent text-emerald-900 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter mb-4 animate-bounce">
                                    {t('nouveauBadge')}
                                </span>
                                <h3 className="font-black text-2xl mb-2 tracking-tight">{t('carteDiscoveryTitle')}</h3>
                                <p className="text-white/60 text-xs mb-6 max-w-[180px] leading-relaxed">
                                    {t('carteDiscoveryDesc')}
                                </p>
                                <Link
                                    href="/map"
                                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 transition-all"
                                >
                                    {t('explorerBtn')}
                                    <ChevronRight size={14} />
                                </Link>
                            </div>
                            <MapPin size={150} className="absolute right-[-30px] bottom-[-30px] text-emerald-accent opacity-10 group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-accent/20 rounded-full blur-3xl"></div>
                        </section>
                    </div>
                )}
            </main>

            {/* Floating Quick Action */}
            <Link
                href="/add/product"
                title={t('nouveauHanout')}
                className="fixed bottom-24 right-6 w-16 h-16 bg-emerald-primary text-white rounded-2xl shadow-2xl shadow-emerald-900/40 flex items-center justify-center transform active:scale-90 transition-all z-40 border border-white/20"
            >
                <Plus size={32} strokeWidth={2.5} />
            </Link>
        </div>
    );
}
