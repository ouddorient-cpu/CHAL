"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft, Store as StoreIcon, MapPin, TrendingUp, TrendingDown,
    Minus, ChevronRight, Plus, BarChart2, Loader2
} from "lucide-react";
import { getProductById, getPricesForProductWithStores, calculateProductStats } from "@/services/dataService";
import { Product, PriceContribution, Store } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PriceWithStore extends PriceContribution {
    store: Store | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCategoryEmoji(cat: string) {
    const map: Record<string, string> = {
        Crèmerie: '🥛', Boissons: '🥤', Hygiène: '🧼', Épicerie: '🍶', Entretien: '🧹',
    };
    return map[cat] || '🛒';
}

function formatDate(date: Date) {
    return date.toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' });
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Price history chart (SVG, no deps) ───────────────────────────────────────
function PriceChart({ prices }: { prices: PriceWithStore[] }) {
    const W = 600, H = 160, PAD = { t: 16, r: 16, b: 32, l: 48 };

    // Group by day, take min price per day
    const dayMap: Record<string, number[]> = {};
    prices.forEach(p => {
        const d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
        const key = d.toISOString().slice(0, 10);
        if (!dayMap[key]) dayMap[key] = [];
        dayMap[key].push(p.price);
    });

    // Last 30 days
    const days: { date: string; avg: number }[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (dayMap[key]) {
            const vals = dayMap[key];
            days.push({ date: key, avg: vals.reduce((a, b) => a + b, 0) / vals.length });
        }
    }

    if (days.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-muted gap-2">
                <BarChart2 className="w-8 h-8 opacity-30" />
                <span className="text-sm font-medium">Pas encore assez de données</span>
            </div>
        );
    }

    const minP = Math.min(...days.map(d => d.avg));
    const maxP = Math.max(...days.map(d => d.avg));
    const rangeP = maxP - minP || 1;

    const chartW = W - PAD.l - PAD.r;
    const chartH = H - PAD.t - PAD.b;

    const toX = (i: number) => PAD.l + (i / (days.length - 1)) * chartW;
    const toY = (v: number) => PAD.t + (1 - (v - minP) / rangeP) * chartH;

    const points = days.map((d, i) => ({ x: toX(i), y: toY(d.avg), ...d }));

    // Smooth path using cubic bezier
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX = (prev.x + curr.x) / 2;
        path += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
    }

    // Fill area under curve
    const areaPath = path + ` L ${points[points.length - 1].x},${H - PAD.b} L ${points[0].x},${H - PAD.b} Z`;

    // Label every ~7 days
    const labelIndices = [0, Math.floor(days.length / 3), Math.floor((2 * days.length) / 3), days.length - 1].filter(
        (v, i, a) => a.indexOf(v) === i
    );

    const last = points[points.length - 1];

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.5, 1].map(t => {
                const y = PAD.t + t * chartH;
                const val = (maxP - t * rangeP).toFixed(1);
                return (
                    <g key={t}>
                        <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />
                        <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity="0.4" fontFamily="inherit">{val}</text>
                    </g>
                );
            })}

            {/* Fill */}
            <path d={areaPath} fill="url(#chartFill)" />

            {/* Line */}
            <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Dots */}
            {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--color-primary)" opacity="0.5" />
            ))}

            {/* Last point highlighted */}
            <circle cx={last.x} cy={last.y} r="5" fill="var(--color-primary)" />
            <circle cx={last.x} cy={last.y} r="9" fill="var(--color-primary)" fillOpacity="0.15" />

            {/* Date labels */}
            {labelIndices.map(i => (
                <text key={i} x={points[i].x} y={H - 4} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.45" fontFamily="inherit">
                    {formatDate(new Date(days[i].date))}
                </text>
            ))}
        </svg>
    );
}

// ── Store comparison row ──────────────────────────────────────────────────────
function StoreRow({
    store,
    latestPrice,
    minPrice,
    isMin,
    distance,
    rank,
}: {
    store: Store;
    latestPrice: number;
    minPrice: number;
    isMin: boolean;
    distance: number | null;
    rank: number;
}) {
    const diff = latestPrice - minPrice;
    const pct = minPrice > 0 ? ((diff / minPrice) * 100).toFixed(0) : '0';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.05 }}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                isMin
                    ? 'border-primary bg-primary/5'
                    : 'border-border-subtle bg-surface hover:border-primary/30'
            }`}
        >
            {/* Rank */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                rank === 0 ? 'bg-primary text-white' :
                rank === 1 ? 'bg-gray-200 text-gray-700 dark:bg-surface-2' :
                'bg-surface border border-border-subtle text-muted'
            }`}>
                {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank + 1}
            </div>

            {/* Store info */}
            <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm truncate">{store.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-muted flex-shrink-0" />
                    <p className="text-[10px] text-muted uppercase tracking-wide truncate">
                        {store.neighborhood || store.address || store.city}
                        {distance !== null && (
                            <span className="ml-1.5 text-primary font-bold">· {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Price + badge */}
            <div className="flex flex-col items-end flex-shrink-0">
                <span className={`font-black text-lg ${isMin ? 'text-primary' : 'text-foreground'}`}>
                    {latestPrice.toFixed(2)} <span className="text-xs font-bold opacity-60">DH</span>
                </span>
                {!isMin && diff > 0 && (
                    <span className="text-[10px] font-bold text-red-400">+{pct}%</span>
                )}
                {isMin && (
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider">Moins cher</span>
                )}
            </div>
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [product, setProduct] = useState<Product | null>(null);
    const [prices, setPrices] = useState<PriceWithStore[]>([]);
    const [loading, setLoading] = useState(true);
    const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);

    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            pos => setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => {}
        );
    }, []);

    useEffect(() => {
        if (!id) return;
        Promise.all([getProductById(id), getPricesForProductWithStores(id)]).then(([p, pr]) => {
            setProduct(p);
            setPrices(pr as PriceWithStore[]);
        }).finally(() => setLoading(false));
    }, [id]);

    // ── Stats ──────────────────────────────────────────────────────────────────
    const stats = calculateProductStats(prices);

    // ── Latest price per store (comparateur) ──────────────────────────────────
    const storeMap: Record<string, { store: Store; latestPrice: number }> = {};
    prices.forEach(p => {
        if (!p.store) return;
        if (!storeMap[p.storeId]) {
            storeMap[p.storeId] = { store: p.store, latestPrice: p.price };
        }
    });
    const storeRanking = Object.values(storeMap).sort((a, b) => a.latestPrice - b.latestPrice);
    const minPrice = storeRanking[0]?.latestPrice ?? 0;

    // ── Trend (last 2 contributions) ──────────────────────────────────────────
    const trend: 'up' | 'down' | 'stable' =
        prices.length >= 2
            ? prices[0].price > prices[1].price ? 'up'
            : prices[0].price < prices[1].price ? 'down'
            : 'stable'
        : 'stable';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-app">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-bg-app gap-4 p-6 text-center">
                <span className="text-5xl">🔍</span>
                <h2 className="font-black text-xl text-foreground">Produit introuvable</h2>
                <button onClick={() => router.push("/")} className="text-primary font-bold underline">Retour au feed</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-app pb-24">

            {/* ── Header ── */}
            <div className="bg-surface/90 backdrop-blur-xl border-b border-border-subtle px-4 py-4 sticky top-0 z-20 flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 text-muted hover:text-primary transition-colors rounded-xl hover:bg-primary/5">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="font-black text-base text-foreground truncate">{product.name}</h1>
                    <p className="text-[10px] text-muted uppercase tracking-widest font-bold">{product.category}</p>
                </div>
                <Link
                    href="/add/price"
                    className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-xs font-black"
                >
                    <Plus className="w-3.5 h-3.5" /> Partager
                </Link>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                {/* ── Product hero ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-[24px] border border-border-subtle p-6 flex items-center gap-5"
                >
                    <div className="w-20 h-20 bg-gray-50 dark:bg-surface-2 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
                        {product.imageUrl
                            ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            : <span>{getCategoryEmoji(product.category)}</span>
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-black text-xl text-foreground leading-tight">{product.name}</h2>
                        <p className="text-sm text-muted font-medium mt-0.5">{product.brand}</p>
                        <div className="flex items-center gap-2 mt-3">
                            <span className="text-[10px] font-black px-2 py-1 rounded-md bg-primary/10 text-primary uppercase tracking-wider">{product.category}</span>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                                trend === 'up' ? 'bg-red-50 text-red-500' :
                                trend === 'down' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-gray-100 text-gray-500'
                            }`}>
                                {trend === 'up' ? <><TrendingUp className="w-3 h-3" /> Hausse</> :
                                 trend === 'down' ? <><TrendingDown className="w-3 h-3" /> Baisse</> :
                                 <><Minus className="w-3 h-3" /> Stable</>}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* ── Stats cards ── */}
                {stats.count > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-3 gap-3"
                    >
                        {[
                            { label: 'Min', val: stats.minPrice, color: 'text-primary' },
                            { label: 'Moy', val: stats.avgPrice, color: 'text-foreground' },
                            { label: 'Max', val: stats.maxPrice, color: 'text-red-500' },
                        ].map(s => (
                            <div key={s.label} className="bg-surface rounded-2xl border border-border-subtle p-4 text-center">
                                <p className={`font-black text-xl ${s.color}`}>{s.val.toFixed(2)}</p>
                                <p className="text-[10px] text-muted uppercase tracking-widest font-bold mt-0.5">DH · {s.label}</p>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ── Price history chart ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-surface rounded-[24px] border border-border-subtle p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-foreground text-base">Évolution du prix</h3>
                        <span className="text-[10px] text-muted font-bold uppercase tracking-widest">30 derniers jours</span>
                    </div>
                    <PriceChart prices={prices} />
                    <p className="text-[10px] text-muted text-center mt-3 font-medium">{stats.count} contributions · prix moyen journalier</p>
                </motion.div>

                {/* ── Comparateur hanouts ── */}
                {storeRanking.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-black text-foreground text-base">Comparateur de Hanouts</h3>
                            <span className="text-[10px] text-muted font-bold">{storeRanking.length} hanout{storeRanking.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-3">
                            {storeRanking.map(({ store, latestPrice }, rank) => {
                                const distance =
                                    userPos && store.location
                                        ? haversineKm(userPos.lat, userPos.lon, store.location.latitude, store.location.longitude)
                                        : null;
                                return (
                                    <StoreRow
                                        key={store.id}
                                        store={store}
                                        latestPrice={latestPrice}
                                        minPrice={minPrice}
                                        isMin={rank === 0}
                                        distance={distance}
                                        rank={rank}
                                    />
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ── Empty comparator ── */}
                {storeRanking.length === 0 && (
                    <div className="bg-surface rounded-[24px] border border-dashed border-border-subtle p-10 text-center">
                        <StoreIcon className="w-10 h-10 text-muted opacity-30 mx-auto mb-3" />
                        <p className="font-bold text-foreground text-sm">Aucun prix partagé pour ce produit</p>
                        <p className="text-muted text-xs mt-1">Soyez le premier à partager !</p>
                        <Link
                            href="/add/price"
                            className="inline-flex items-center gap-2 mt-4 bg-primary text-white px-5 py-2.5 rounded-full text-xs font-black"
                        >
                            <Plus className="w-3.5 h-3.5" /> Partager un prix
                        </Link>
                    </div>
                )}

                {/* ── Recent contributions ── */}
                {prices.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <h3 className="font-black text-foreground text-base mb-3">Contributions récentes</h3>
                        <div className="space-y-2">
                            {prices.slice(0, 8).map((p, i) => {
                                const date = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
                                return (
                                    <div key={p.id} className="bg-surface rounded-xl border border-border-subtle px-4 py-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-[10px] font-black text-muted">{String(i + 1).padStart(2, '0')}</span>
                                            <div className="min-w-0">
                                                <p className="font-bold text-foreground text-xs truncate">{p.store?.name || 'Hanout inconnu'}</p>
                                                <p className="text-[10px] text-muted">{formatDate(date)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="font-black text-primary">{p.price.toFixed(2)} DH</span>
                                            {p.sourceType === 'ai_photo' && (
                                                <span className="text-[9px] bg-primary/10 text-primary font-black px-1.5 py-0.5 rounded-md">IA</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
