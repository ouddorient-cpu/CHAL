"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight,
    Store as StoreIcon,
    ShoppingBasket,
    Utensils,
    Milk,
    Sparkles,
    History,
    Plus,
    ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { getRecentPrices, getRecentStores, confirmPrice, getUserConfirmations } from "@/services/dataService";
import { Store } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

// --- Types ---
interface FeedItem {
    id: string;
    price: number;
    product?: { id: string; name: string; category: string; imageUrl?: string };
    store?: { id: string; name: string };
    storeId?: string;
    userName?: string;
    createdAt?: any;
    confirmations?: number;
}

// --- Helpers ---
const CATEGORIES = [
    { id: 'all', name: 'Tous', icon: <ShoppingBasket className="w-5 h-5" /> },
    { id: 'Épicerie', name: 'Épicerie', icon: <Utensils className="w-5 h-5" /> },
    { id: 'Boissons', name: 'Boissons', icon: <Milk className="w-5 h-5" /> },
    { id: 'Crèmerie', name: 'Crèmerie', icon: <History className="w-5 h-5" /> },
    { id: 'Hygiène', name: 'Hygiène', icon: <Sparkles className="w-5 h-5" /> },
];

function getCategoryEmoji(category: string) {
    switch (category) {
        case 'Crèmerie': return '🥛';
        case 'Boissons': return '🥤';
        case 'Hygiène': return '🧼';
        case 'Épicerie': return '🍶';
        default: return '🛒';
    }
}

function timeAgo(date: Date) {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}j ago`;
}

// --- Sub-components ---

function FeedCard({ item, confirmedIds, onConfirm }: {
    item: FeedItem;
    confirmedIds: Set<string>;
    onConfirm: (id: string) => void;
}) {
    const category = item.product?.category || 'Autres';
    const emoji = getCategoryEmoji(category);
    const time = item.createdAt?.toDate ? timeAgo(item.createdAt.toDate()) : '';
    const initial = item.userName?.charAt(0)?.toUpperCase() || 'A';
    const isConfirmed = confirmedIds.has(item.id);
    const confirmCount = item.confirmations || 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-surface p-4 rounded-[20px] border border-transparent shadow-polish hover:border-primary transition-all group flex flex-col"
        >
            <Link href={item.product?.id ? `/products/${item.product.id}` : '#'} className="flex flex-col flex-1">
                <div className="aspect-[4/3] w-full bg-gray-50 dark:bg-surface-2 rounded-xl mb-4 flex items-center justify-center text-4xl group-hover:bg-primary/5 transition-colors overflow-hidden">
                    {item.product?.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                        <span>{emoji}</span>
                    )}
                </div>

                <div className="bg-primary text-white inline-block px-3 py-1 rounded-lg font-extrabold text-lg mb-2 self-start">
                    {(item.price || 0).toFixed(2)} DH
                </div>

                <h3 className="font-bold text-foreground text-base mb-1 line-clamp-1">
                    {item.product?.name || 'Produit'}
                </h3>

                <div className="flex items-center gap-1 text-xs text-muted mb-3">
                    <StoreIcon className="w-3.5 h-3.5" />
                    {item.store?.name || 'Hanout'}
                </div>
            </Link>

            {/* Confirm + meta */}
            <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-black flex-shrink-0">
                        {initial}
                    </div>
                    <span className="text-[10px] text-muted truncate max-w-[90px]">@{item.userName || 'Anonyme'}</span>
                    <span className="text-[10px] text-muted">{time}</span>
                </div>

                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={e => { e.preventDefault(); onConfirm(item.id); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black transition-all ${
                        isConfirmed
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'bg-surface-2 text-muted hover:bg-primary/10 hover:text-primary border border-border-subtle'
                    }`}
                >
                    <ThumbsUp className="w-3 h-3" />
                    {confirmCount > 0 ? confirmCount : ''}
                </motion.button>
            </div>
        </motion.div>
    );
}

function CategoryScroll({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
    return (
        <div className="flex overflow-x-auto gap-3 py-4 no-scrollbar mb-6">
            {CATEGORIES.map((cat, idx) => (
                <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onSelect(cat.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap font-bold text-xs uppercase tracking-wider border ${
                        selected === cat.id
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                            : 'bg-surface border-border-subtle text-muted hover:border-foreground shadow-polish'
                    }`}
                >
                    {cat.icon}
                    <span>{cat.name}</span>
                </motion.button>
            ))}
        </div>
    );
}

function StatsBanner({ storesCount, pricesCount }: { storesCount: number; pricesCount: number }) {
    const stats = [
        { val: storesCount > 0 ? storesCount.toLocaleString() : '—', label: 'Hanouts répertoriés' },
        { val: pricesCount > 0 ? pricesCount.toLocaleString() : '—', label: 'Prix partagés' },
        { val: 'Active', label: 'Communauté Meknès' },
    ];

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className="flex-1 bg-foreground text-background p-6 rounded-[20px] shadow-lg flex flex-col items-center md:items-start"
                >
                    <span className="text-2xl font-black mb-1">{stat.val}</span>
                    <span className="text-[11px] opacity-60 uppercase font-bold tracking-wider">{stat.label}</span>
                </div>
            ))}
        </div>
    );
}

// --- Main page ---
export default function Home() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [totalPrices, setTotalPrices] = useState(0);
    const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rPrices, rStores] = await Promise.all([
                    getRecentPrices(12),
                    getRecentStores(100),
                ]);

                const pricesWithStore = (rPrices as any[]).map((p: any) => ({
                    ...p,
                    store: (rStores as any[]).find((s: any) => s.id === p.storeId) || null,
                }));

                setFeedItems(pricesWithStore);
                setStores(rStores);
                setTotalPrices(pricesWithStore.length);

                if (user) {
                    const ids = pricesWithStore.map((p: any) => p.id);
                    const confirmed = await getUserConfirmations(user.uid, ids);
                    setConfirmedIds(confirmed);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handleConfirm = async (priceId: string) => {
        if (!user) return;
        const { confirmed } = await confirmPrice(priceId, user.uid);
        setConfirmedIds(prev => {
            const next = new Set(prev);
            confirmed ? next.add(priceId) : next.delete(priceId);
            return next;
        });
        setFeedItems(prev => prev.map(item =>
            item.id === priceId
                ? { ...item, confirmations: (item.confirmations || 0) + (confirmed ? 1 : -1) }
                : item
        ));
    };

    const filteredItems = selectedCategory === 'all'
        ? feedItems
        : feedItems.filter(p => p.product?.category === selectedCategory);

    return (
        <div className="flex min-h-screen bg-bg-app">
            <Sidebar selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />

            <main className="flex-1 p-6 md:p-10 lg:p-14 overflow-x-hidden pb-24 lg:pb-10">
                <Header />

                {/* Page title */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">
                            Les derniers prix au Hanout
                        </h1>
                        <p className="text-muted text-sm font-medium mt-1">
                            Partagé par la communauté il y a quelques minutes
                        </p>
                    </div>
                    <Link
                        href="/stores"
                        className="font-bold text-sm text-primary flex items-center gap-1 hover:underline underline-offset-4"
                    >
                        Filtrer par proximité
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Category scroll — mobile only (desktop uses Sidebar) */}
                <div className="lg:hidden">
                    <CategoryScroll selected={selectedCategory} onSelect={setSelectedCategory} />
                </div>

                {/* Feed grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="bg-surface rounded-[20px] h-64 animate-pulse shadow-polish" />
                        ))
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map(item => (
                                <FeedCard key={item.id} item={item} confirmedIds={confirmedIds} onConfirm={handleConfirm} />
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Empty state */}
                {!loading && filteredItems.length === 0 && (
                    <div className="py-20 text-center bg-surface rounded-[32px] border border-border-subtle mb-12">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
                            <ShoppingBasket className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-foreground">Aucun résultat</h3>
                        <p className="text-muted text-sm mt-1">
                            Soyez le premier à partager un prix ici !
                        </p>
                    </div>
                )}

                <StatsBanner storesCount={stores.length} pricesCount={totalPrices} />
            </main>

            {/* FAB */}
            <Link
                href="/add/price"
                className="fixed bottom-24 lg:bottom-8 right-6 lg:right-8 bg-primary text-white py-4 px-6 rounded-full font-black text-sm flex items-center gap-3 shadow-[0_10px_25px_rgba(0,208,132,0.3)] z-50 hover:bg-primary-dark transition-colors"
            >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Partager un prix</span>
            </Link>
        </div>
    );
}
