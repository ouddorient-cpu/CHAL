"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Search, MapPin, ArrowLeft, X, Navigation, TrendingDown, TrendingUp, Minus, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getStoresPriceIndex } from "@/services/dataService";

// ── Leaflet dynamic imports (no SSR) ─────────────────────────────
const MapContainer  = dynamic(() => import("react-leaflet").then(m => m.MapContainer),  { ssr: false }) as any;
const TileLayer     = dynamic(() => import("react-leaflet").then(m => m.TileLayer),     { ssr: false }) as any;
const CircleMarker  = dynamic(() => import("react-leaflet").then(m => m.CircleMarker),  { ssr: false }) as any;
const Tooltip       = dynamic(() => import("react-leaflet").then(m => m.Tooltip),       { ssr: false }) as any;
const useMap        = dynamic(() => import("react-leaflet").then(m => m.useMap),        { ssr: false }) as any;

// ── Types ─────────────────────────────────────────────────────────
interface StorePoint {
    id: string;
    name: string;
    neighborhood?: string;
    address?: string;
    location: { latitude: number; longitude: number };
    avgPrice: number | null;
    minPrice: number | null;
    priceCount: number;
}

// ── Color scale ───────────────────────────────────────────────────
function priceColor(avg: number | null, min: number, max: number): { fill: string; label: string } {
    if (avg === null) return { fill: '#94a3b8', label: 'Pas de données' };
    const range = max - min || 1;
    const ratio = (avg - min) / range; // 0 = cheapest, 1 = most expensive
    if (ratio < 0.33) return { fill: '#00D084', label: 'Bon marché' };
    if (ratio < 0.66) return { fill: '#f59e0b', label: 'Prix moyen' };
    return { fill: '#ef4444', label: 'Prix élevé' };
}

// ── GPS recenter helper ───────────────────────────────────────────
function RecenterButton({ pos }: { pos: [number, number] | null }) {
    // We can't use useMap here via dynamic, so we handle it via map ref
    return null;
}

// ── Main page ─────────────────────────────────────────────────────
export default function MapPage() {
    const [mounted, setMounted]       = useState(false);
    const [stores, setStores]         = useState<StorePoint[]>([]);
    const [selected, setSelected]     = useState<StorePoint | null>(null);
    const [userPos, setUserPos]       = useState<[number, number] | null>(null);
    const [search, setSearch]         = useState('');
    const [mapRef, setMapRef]         = useState<any>(null);

    const CENTER: [number, number] = [33.8935, -5.5473]; // Meknès

    useEffect(() => {
        setMounted(true);
        getStoresPriceIndex().then(data => setStores(data as StorePoint[]));
    }, []);

    const handleGPS = () => {
        navigator.geolocation?.getCurrentPosition(pos => {
            const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setUserPos(coords);
            mapRef?.setView(coords, 16);
        });
    };

    const filtered = stores.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.neighborhood?.toLowerCase().includes(search.toLowerCase())
    );

    // Compute price range for color scale
    const prices = filtered.map(s => s.avgPrice).filter(Boolean) as number[];
    const minP = prices.length ? Math.min(...prices) : 0;
    const maxP = prices.length ? Math.max(...prices) : 100;

    return (
        <div className="relative h-screen w-full overflow-hidden">

            {/* ── Map ── */}
            {mounted && (
                <MapContainer
                    center={CENTER}
                    zoom={14}
                    zoomControl={false}
                    className="absolute inset-0 z-0 h-full w-full"
                    ref={setMapRef}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; OpenStreetMap &copy; CARTO'
                    />

                    {/* User position */}
                    {userPos && (
                        <CircleMarker
                            center={userPos}
                            radius={10}
                            pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.9, color: '#fff', weight: 3 }}
                        />
                    )}

                    {/* Store heatmap circles */}
                    {filtered.map(store => {
                        const { fill } = priceColor(store.avgPrice, minP, maxP);
                        const isSelected = selected?.id === store.id;
                        return (
                            <CircleMarker
                                key={store.id}
                                center={[store.location.latitude, store.location.longitude]}
                                radius={store.priceCount > 0 ? Math.min(8 + store.priceCount * 2, 22) : 8}
                                pathOptions={{
                                    fillColor: fill,
                                    fillOpacity: isSelected ? 1 : 0.75,
                                    color: isSelected ? '#fff' : fill,
                                    weight: isSelected ? 3 : 1,
                                }}
                                eventHandlers={{ click: () => setSelected(store) }}
                            >
                                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                                    <div style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 800 }}>
                                        <strong>{store.name}</strong><br />
                                        {store.avgPrice !== null
                                            ? `Moy: ${store.avgPrice.toFixed(2)} DH`
                                            : 'Aucun prix'}
                                    </div>
                                </Tooltip>
                            </CircleMarker>
                        );
                    })}
                </MapContainer>
            )}

            {/* ── Top overlay ── */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 space-y-3 pointer-events-none">
                {/* Header */}
                <div className="flex gap-2 pointer-events-auto">
                    <Link
                        href="/"
                        className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center flex-shrink-0 border border-gray-100"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Link>
                    <div className="flex-1 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Chercher un Hanout…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-12 bg-white rounded-2xl shadow-lg pl-10 pr-4 text-sm font-bold border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Legend */}
                <div className="pointer-events-auto flex gap-2 flex-wrap">
                    {[
                        { color: '#00D084', label: 'Bon marché' },
                        { color: '#f59e0b', label: 'Prix moyen' },
                        { color: '#ef4444', label: 'Prix élevé' },
                        { color: '#94a3b8', label: 'Sans données' },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-[10px] font-black text-gray-600">{label}</span>
                        </div>
                    ))}
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                        <span className="text-[10px] font-black text-gray-600">{filtered.length} hanout{filtered.length > 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            {/* ── GPS button ── */}
            <button
                onClick={handleGPS}
                className="absolute bottom-32 right-4 z-20 w-12 h-12 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all"
            >
                <Navigation className="w-5 h-5" />
            </button>

            {/* ── Store detail sheet ── */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 bg-black/20"
                            onClick={() => setSelected(null)}
                        />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-[28px] shadow-2xl p-6 pb-10"
                        >
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <Package className="w-7 h-7 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-gray-900 leading-tight">{selected.name}</h3>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3 h-3 text-gray-400" />
                                            <p className="text-xs text-gray-500 font-medium">
                                                {selected.neighborhood || selected.address || 'Meknès'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Price stats */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {[
                                    { label: 'Prix moyen', val: selected.avgPrice?.toFixed(2), unit: 'DH' },
                                    { label: 'Meilleur prix', val: selected.minPrice?.toFixed(2), unit: 'DH' },
                                    { label: 'Contributions', val: selected.priceCount, unit: '' },
                                ].map(s => (
                                    <div key={s.label} className="bg-gray-50 rounded-2xl p-3 text-center">
                                        <p className="font-black text-gray-900 text-lg">{s.val ?? '—'}{s.unit && <span className="text-xs ml-0.5">{s.unit}</span>}</p>
                                        <p className="text-[10px] text-gray-500 font-bold mt-0.5 uppercase tracking-wide">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Price level indicator */}
                            {selected.avgPrice !== null && (
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-5 ${
                                    priceColor(selected.avgPrice, minP, maxP).fill === '#00D084'
                                        ? 'bg-green-50 text-green-700'
                                        : priceColor(selected.avgPrice, minP, maxP).fill === '#f59e0b'
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-red-50 text-red-600'
                                }`}>
                                    {priceColor(selected.avgPrice, minP, maxP).fill === '#00D084'
                                        ? <TrendingDown className="w-4 h-4" />
                                        : priceColor(selected.avgPrice, minP, maxP).fill === '#f59e0b'
                                        ? <Minus className="w-4 h-4" />
                                        : <TrendingUp className="w-4 h-4" />
                                    }
                                    <span className="font-black text-sm">{priceColor(selected.avgPrice, minP, maxP).label} comparé aux autres hanouts</span>
                                </div>
                            )}

                            <Link
                                href="/add/price"
                                className="block w-full py-4 bg-primary text-white rounded-2xl text-center font-black text-sm shadow-lg shadow-primary/25"
                            >
                                Partager un prix ici
                            </Link>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
