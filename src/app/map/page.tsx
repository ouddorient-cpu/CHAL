"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Script from "next/script";
import { Search, MapPin, ArrowLeft, X, Navigation, TrendingDown, TrendingUp, Minus, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getStoresPriceIndex } from "@/services/dataService";

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

const CENTER = { lat: 33.8935, lng: -5.5473 }; // Meknès

function priceColor(avg: number | null, min: number, max: number): { hex: string; label: string; level: 'low' | 'mid' | 'high' | 'none' } {
    if (avg === null) return { hex: '#94a3b8', label: 'Pas de données', level: 'none' };
    const range = max - min || 1;
    const ratio = (avg - min) / range;
    if (ratio < 0.33) return { hex: '#00D084', label: 'Bon marché', level: 'low' };
    if (ratio < 0.66) return { hex: '#f59e0b', label: 'Prix moyen', level: 'mid' };
    return { hex: '#ef4444', label: 'Prix élevé', level: 'high' };
}

// SVG circle marker for Google Maps
function markerSvg(color: string, size = 32): string {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="white" stroke-width="2.5" opacity="0.92"/>
        </svg>`
    )}`;
}

export default function MapPage() {
    const [stores, setStores]       = useState<StorePoint[]>([]);
    const [selected, setSelected]   = useState<StorePoint | null>(null);
    const [search, setSearch]       = useState('');
    const [mapsReady, setMapsReady] = useState(false);

    const mapRef        = useRef<HTMLDivElement>(null);
    const googleMapRef  = useRef<google.maps.Map | null>(null);
    const markersRef    = useRef<google.maps.Marker[]>([]);
    const userMarkerRef = useRef<google.maps.Marker | null>(null);

    const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    useEffect(() => {
        getStoresPriceIndex().then(data => setStores(data as StorePoint[]));
    }, []);

    // Init Google Map once script is ready
    const initMap = useCallback(() => {
        if (!mapRef.current || googleMapRef.current) return;
        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
            center: CENTER,
            zoom: 14,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'greedy',
            styles: [
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
            ],
        });
    }, []);

    // Place markers whenever stores or map are ready
    useEffect(() => {
        if (!mapsReady || !stores.length) return;
        if (!googleMapRef.current) initMap();
        const map = googleMapRef.current;
        if (!map) return;

        // Clear existing markers
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        const prices = stores.map(s => s.avgPrice).filter(Boolean) as number[];
        const minP = prices.length ? Math.min(...prices) : 0;
        const maxP = prices.length ? Math.max(...prices) : 100;

        const filtered = stores.filter(s =>
            !search ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.neighborhood?.toLowerCase().includes(search.toLowerCase())
        );

        filtered.forEach(store => {
            const { hex } = priceColor(store.avgPrice, minP, maxP);
            const size = store.priceCount > 0 ? Math.min(28 + store.priceCount * 3, 48) : 28;

            const marker = new window.google.maps.Marker({
                position: { lat: store.location.latitude, lng: store.location.longitude },
                map,
                icon: { url: markerSvg(hex, size), scaledSize: new window.google.maps.Size(size, size) },
                title: store.name,
            });

            marker.addListener('click', () => setSelected(store));
            markersRef.current.push(marker);
        });
    }, [stores, mapsReady, search, initMap]);

    const handleGPS = () => {
        navigator.geolocation?.getCurrentPosition(pos => {
            const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            googleMapRef.current?.setCenter(latlng);
            googleMapRef.current?.setZoom(16);

            if (userMarkerRef.current) {
                userMarkerRef.current.setPosition(latlng);
            } else {
                userMarkerRef.current = new window.google.maps.Marker({
                    position: latlng,
                    map: googleMapRef.current!,
                    icon: {
                        url: markerSvg('#3b82f6', 20),
                        scaledSize: new window.google.maps.Size(20, 20),
                    },
                    zIndex: 999,
                });
            }
        });
    };

    // Recompute price range for the selected store badge
    const allPrices = stores.map(s => s.avgPrice).filter(Boolean) as number[];
    const minP = allPrices.length ? Math.min(...allPrices) : 0;
    const maxP = allPrices.length ? Math.max(...allPrices) : 100;

    return (
        <div className="relative h-screen w-full overflow-hidden">

            {/* Google Maps Script */}
            <Script
                src={`https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&language=fr`}
                strategy="afterInteractive"
                onLoad={() => { setMapsReady(true); initMap(); }}
            />

            {/* Map container */}
            <div ref={mapRef} className="absolute inset-0 z-0 h-full w-full" />

            {/* ── Top overlay ── */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 space-y-3 pointer-events-none">
                <div className="flex gap-2 pointer-events-auto">
                    <Link href="/" className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center flex-shrink-0 border border-gray-100">
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
                        <span className="text-[10px] font-black text-gray-600">{stores.length} hanout{stores.length > 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            {/* GPS button */}
            <button
                onClick={handleGPS}
                className="absolute bottom-32 right-4 z-20 w-12 h-12 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all"
            >
                <Navigation className="w-5 h-5" />
            </button>

            {/* Store detail sheet */}
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

                            {selected.avgPrice !== null && (() => {
                                const { hex, label, level } = priceColor(selected.avgPrice, minP, maxP);
                                const cls = level === 'low' ? 'bg-green-50 text-green-700' : level === 'mid' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600';
                                const Icon = level === 'low' ? TrendingDown : level === 'mid' ? Minus : TrendingUp;
                                return (
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-5 ${cls}`}>
                                        <Icon className="w-4 h-4" />
                                        <span className="font-black text-sm">{label} comparé aux autres hanouts</span>
                                    </div>
                                );
                            })()}

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
