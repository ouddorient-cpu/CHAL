"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { Store, PriceContribution, Product } from "@/types";
import {
    MapPin,
    Star,
    ShieldCheck,
    Zap,
    Clock,
    ChevronLeft,
    AlertCircle,
    Plus,
    Tag,
    Share2,
    Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function StoreDetailClient() {
    const { t } = useLanguage();
    const { id } = useParams();
    const router = useRouter();
    const [store, setStore] = useState<Store | null>(null);
    const [prices, setPrices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStoreData = async () => {
            if (!id || id === 'placeholder') {
                setLoading(false);
                return;
            }

            try {
                // Fetch Store Details
                const storeDoc = await getDoc(doc(db, "stores", id as string));
                if (storeDoc.exists()) {
                    setStore({ id: storeDoc.id, ...storeDoc.data() } as Store);
                }

                // Fetch Recent Prices at this store
                const pricesQuery = query(
                    collection(db, "prices"),
                    where("storeId", "==", id),
                    orderBy("createdAt", "desc"),
                    limit(20)
                );

                const pricesSnap = await getDocs(pricesQuery);
                const pricesData = await Promise.all(pricesSnap.docs.map(async (docSnap) => {
                    const price = docSnap.data() as PriceContribution;
                    // Fetch product info for each price
                    const productDoc = await getDoc(doc(db, "products", price.productId));
                    return {
                        ...price,
                        id: docSnap.id,
                        product: productDoc.exists() ? { id: productDoc.id, ...productDoc.data() } as Product : null
                    };
                }));

                setPrices(pricesData.filter(p => p.product !== null));
            } catch (error) {
                console.error("Error fetching store data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStoreData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-primary/20 border-t-emerald-primary rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-emerald-primary uppercase tracking-widest animate-pulse">{t('chargementDuHanout')}...</p>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={64} className="text-emerald-primary/20 mb-6" />
                <h2 className="text-xl font-black text-white uppercase tracking-tight">{t('hanoutIntrouvable')}</h2>
                <button onClick={() => router.back()} className="mt-8 bg-emerald-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-900/40">
                    {t('retour')}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans">
            {/* Immersive Header */}
            <div className="relative h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10"></div>
                <img
                    src="https://images.unsplash.com/photo-1604719312563-8912e9227c6a?auto=format&fit=crop&q=80&w=1000"
                    className="w-full h-full object-cover scale-110 blur-sm brightness-50"
                    alt={store.name}
                />

                {/* Top Actions */}
                <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-center z-20">
                    <button
                        onClick={() => router.back()}
                        title={t('retour')}
                        className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 active:scale-95 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex gap-2">
                        <button
                            title={t('ajouterAuxFavoris')}
                            className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 active:scale-95 transition-all"
                        >
                            <Heart size={20} />
                        </button>
                        <button
                            title={t('partager')}
                            className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 active:scale-95 transition-all"
                        >
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Store Info Overlay */}
                <div className="absolute bottom-6 left-6 right-6 z-20">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-emerald-accent text-emerald-950 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                            {t('verifieParCommunaute')}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase italic">{store.name}</h1>
                    <div className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest">
                        <MapPin size={14} className="text-emerald-primary" />
                        {store.address}, Meknès
                    </div>
                </div>
            </div>

            <main className="px-6 -mt-6 relative z-30 pb-32">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        { label: t('alertesLabel'), value: prices.length, icon: Zap, color: "emerald-primary" },
                        { label: t('reliabilityLabel'), value: "98%", icon: ShieldCheck, color: "emerald-accent" },
                        { label: t('actifsLabel'), value: prices.length, icon: Clock, color: "white" }
                    ].map((stat, i) => (
                        <div key={i} className="glass-card p-4 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                            <stat.icon size={18} className={`text-${stat.color} mb-2`} />
                            <span className="text-lg font-black tracking-tight">{stat.value}</span>
                            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Live Product Feed */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-emerald-primary rounded-full"></div>
                            <h2 className="text-sm font-black uppercase tracking-tight">{t('prixEnDirect')}</h2>
                        </div>
                        <button className="text-[10px] font-black text-emerald-accent uppercase tracking-widest">
                            {t('voirToutBtn')}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {prices.length > 0 ? (
                            prices.map((price, index) => (
                                <motion.div
                                    key={price.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="glass-card p-4 rounded-[2rem] border border-white/5 flex items-center gap-4 relative overflow-hidden group"
                                >
                                    <div className="w-16 h-16 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center p-2 shadow-xl">
                                        <Tag size={24} className="text-emerald-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{price.product?.brand}</p>
                                        <h4 className="font-black text-sm uppercase tracking-tight line-clamp-1">{price.product?.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock size={10} className="text-emerald-accent" />
                                            <span className="text-[9px] font-bold text-emerald-accent uppercase tracking-widest">{t('misAJourRecemment')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black italic text-white tracking-tighter">{(price.price || 0).toFixed(2)} DH</p>
                                        <button
                                            title={t('signalerChangement')}
                                            className="mt-1 p-2 bg-emerald-primary/10 text-emerald-primary rounded-xl border border-emerald-primary/10 active:scale-95 transition-all"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-12 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                                <Tag size={40} className="mx-auto text-white/10 mb-4" />
                                <p className="text-sm font-bold text-white/40">{t('aucunPrixRapporte')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Location Card */}
                <div className="mt-10">
                    <div className="glass-card p-6 rounded-[2.5rem] border border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-primary/10 text-emerald-primary rounded-2xl flex items-center justify-center border border-emerald-primary/20">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-tight">{t('localisationTitle')}</h3>
                                <p className="text-xs text-white/60">{store.address}</p>
                            </div>
                        </div>
                        <div className="h-40 bg-slate-900 rounded-3xl overflow-hidden relative">
                            {/* Mini Map Placeholder */}
                            <div className="absolute inset-0 bg-slate-800 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/35.40,33.89,12/400x200?access_token=pk.xxx')] bg-cover opacity-50"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 bg-emerald-primary rounded-full animate-ping opacity-20"></div>
                                <div className="w-4 h-4 bg-emerald-primary rounded-full border-2 border-white absolute shadow-2xl shadow-emerald-900"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Floating Quick Add */}
            <Link
                href="/add/product"
                className="fixed bottom-24 right-6 bg-emerald-primary text-white p-5 rounded-2xl shadow-2xl shadow-emerald-900/40 border border-white/20 active:scale-90 transition-all z-40"
            >
                <Plus size={32} strokeWidth={2.5} />
            </Link>
        </div>
    );
}
