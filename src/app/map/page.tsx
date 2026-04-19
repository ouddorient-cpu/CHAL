"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Search, MapPin, Target as GpsIcon, ChevronLeft, SlidersHorizontal, Package, Clock, X, Zap, House as HomeIcon, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRecentStores } from "@/services/dataService";
import { Store } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false }) as any;
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false }) as any;
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false }) as any;

export default function ExplorationMap() {
    const { t } = useLanguage();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [stores, setStores] = useState<Store[]>([]);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    useEffect(() => {
        setMounted(true);
        const fetchStores = async () => {
            const s = await getRecentStores(20);
            setStores(s);
        };
        fetchStores();
    }, []);

    return (
        <div className="relative h-screen w-full bg-[#1e1c18] overflow-hidden font-sans">
            {/* Map Container */}
            {mounted && (
                <MapContainer
                    center={[33.8935, -5.5473]}
                    zoom={14}
                    zoomControl={false}
                    className="absolute inset-0 z-0 h-full w-full"
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    {stores.map((store) => store.location && (
                        <Marker
                            key={store.id}
                            position={[store.location.latitude, store.location.longitude] as any}
                            eventHandlers={{
                                click: () => setSelectedStore(store),
                            }}
                        />
                    ))}
                </MapContainer>
            )}

            {/* Top Overlay: Search & Filters */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 space-y-4 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex gap-3">
                    <button
                        onClick={() => router.back()}
                        title={t('retour')}
                        className="p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 active:scale-90 transition-all"
                    >
                        <ChevronLeft size={20} className="text-foreground" />
                    </button>
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-primary transition-all duration-300" size={18} />
                        <input
                            type="text"
                            placeholder={t('chercherHanoutOuPrix')}
                            className="w-full bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-xl focus:ring-4 focus:ring-emerald-primary/10 transition-all outline-none text-foreground placeholder:text-muted"
                        />
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {[t('tousFilter'), t('epicerie'), t('fruitsFilter'), t('promosFilter'), 'Meknès - Hamria'].map((filter, i) => (
                        <button key={i} className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? 'bg-emerald-primary text-white' : 'bg-white/20 backdrop-blur-md text-white border border-white/20'}`}>
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Right: GPS Button */}
            <div className="absolute bottom-24 right-4 z-20">
                <button
                    title={t('maPosition')}
                    className="w-14 h-14 bg-emerald-primary rounded-2xl shadow-2xl shadow-emerald-900/40 flex items-center justify-center text-white active:scale-90 transition-all border-t border-white/20"
                >
                    <MapPin size={24} />
                </button>
            </div>

            {/* Store Detail Popup/Drawer */}
            <AnimatePresence>
                {selectedStore && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="absolute bottom-0 left-0 right-0 z-30 p-4"
                    >
                        <div className="glass-card rounded-[2.5rem] p-6 shadow-2xl border-emerald-primary/10 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4">
                                <button
                                    onClick={() => setSelectedStore(null)}
                                    title={t('fermerDetails')}
                                    className="p-2 text-muted hover:text-foreground transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-emerald-primary/10 rounded-2xl flex items-center justify-center">
                                    <Package size={32} className="text-emerald-primary" />
                                </div>
                                <div className="flex flex-col gap-1 pr-6">
                                    <h4 className="text-xl font-black text-foreground leading-tight">{selectedStore.name}</h4>
                                    <div className="flex items-center gap-1.5 text-muted font-bold text-xs capitalize">
                                        <MapPin size={12} className="text-emerald-primary" />
                                        <span>{selectedStore.neighborhood} - {selectedStore.address || 'Meknès'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between p-4 bg-emerald-primary/5 rounded-2xl border border-emerald-primary/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border border-border-faint">
                                        <img src="https://placehold.co/100" className="w-full h-full object-cover" alt={t('meilleurPrixLabel')} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-accent uppercase tracking-widest">{t('meilleurPrixLabel')}</p>
                                        <p className="text-xs font-bold text-foreground">Lait Centrale 0.5L</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-foreground">3.50 <span className="text-[10px] italic">DH</span></p>
                                    <div className="flex items-center gap-1 text-[8px] font-black text-muted uppercase tracking-tighter">
                                        <Clock size={8} />
                                        <span>{t('ilYA')} 2h</span>
                                    </div>
                                </div>
                            </div>

                            <Link href={`/stores/${selectedStore.id}`} className="mt-6 block w-full py-4 bg-emerald-primary text-white text-center rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg shadow-emerald-primary/20 active:scale-95 transition-all border-t border-white/20">
                                {t('voirTousLesPrixBtn')}
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation (Simplified for Map) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#fefcf8]/95 backdrop-blur-xl px-2 py-2 rounded-2xl shadow-2xl border border-border-faint flex gap-1">
                <Link href="/" className="px-6 py-3 rounded-xl text-muted hover:text-emerald-primary transition-all">
                    <HomeIcon size={20} />
                </Link>
                <div className="px-6 py-3 rounded-xl bg-emerald-primary text-white shadow-lg shadow-emerald-primary/20">
                    <MapPin size={20} />
                </div>
                <Link href="/add/product" className="px-6 py-3 rounded-xl text-muted hover:text-emerald-primary transition-all">
                    <Plus size={20} />
                </Link>
            </div>
        </div>
    );
}
