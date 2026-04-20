"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bell, BellOff, Plus, Trash2, Search, Loader2, CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getProducts, getUserAlerts, setPriceAlert, deletePriceAlert, getPricesForProduct } from "@/services/dataService";
import { Product } from "@/types";

interface Alert {
    id: string;
    productId: string;
    productName: string;
    threshold: number;
    active: boolean;
}

interface AlertWithCurrentPrice extends Alert {
    currentMin: number | null;
    triggered: boolean;
}

export default function AlertsPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [alerts, setAlerts] = useState<AlertWithCurrentPrice[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [threshold, setThreshold] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const [rawAlerts, prods] = await Promise.all([
                getUserAlerts(user.uid),
                getProducts(),
            ]);
            setProducts(prods);

            // Check current min prices for each alert
            const enriched = await Promise.all(
                rawAlerts.map(async (a: Alert) => {
                    const prices = await getPricesForProduct(a.productId);
                    const currentMin = prices.length ? Math.min(...prices.map(p => p.price)) : null;
                    return {
                        ...a,
                        currentMin,
                        triggered: currentMin !== null && currentMin <= a.threshold,
                    };
                })
            );
            setAlerts(enriched);
            setLoading(false);
        };
        load();
    }, [user]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = async () => {
        if (!user || !selectedProduct || !threshold) return;
        setSaving(true);
        await setPriceAlert(user.uid, selectedProduct.id, selectedProduct.name, parseFloat(threshold));
        setSaving(false);
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            setAdding(false);
            setSelectedProduct(null);
            setThreshold('');
            // Refresh alerts
            getUserAlerts(user.uid).then(async rawAlerts => {
                const enriched = await Promise.all(
                    rawAlerts.map(async (a: Alert) => {
                        const prices = await getPricesForProduct(a.productId);
                        const currentMin = prices.length ? Math.min(...prices.map(p => p.price)) : null;
                        return { ...a, currentMin, triggered: currentMin !== null && currentMin <= a.threshold };
                    })
                );
                setAlerts(enriched);
            });
        }, 1200);
    };

    const handleDelete = async (alert: AlertWithCurrentPrice) => {
        if (!user) return;
        await deletePriceAlert(user.uid, alert.productId);
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center gap-4 p-6 text-center">
                <Bell className="w-12 h-12 text-muted opacity-30" />
                <h2 className="font-black text-xl text-foreground">Connexion requise</h2>
                <p className="text-muted text-sm">Connecte-toi pour créer des alertes prix</p>
                <Link href="/auth" className="bg-primary text-white px-6 py-3 rounded-full font-black text-sm">Se connecter</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-app pb-24">

            {/* Header */}
            <div className="bg-surface/90 backdrop-blur-xl border-b border-border-subtle px-4 py-4 sticky top-0 z-20 flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 text-muted hover:text-primary rounded-xl hover:bg-primary/5 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="font-black text-lg text-foreground">Alertes Prix</h1>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Notifié quand un prix baisse</p>
                </div>
                <button
                    onClick={() => setAdding(true)}
                    className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-xs font-black"
                >
                    <Plus className="w-3.5 h-3.5" /> Nouvelle
                </button>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

                {/* Triggered alerts banner */}
                {alerts.some(a => a.triggered) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary text-white rounded-2xl p-4 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-black text-sm">
                                {alerts.filter(a => a.triggered).length} alerte{alerts.filter(a => a.triggered).length > 1 ? 's' : ''} déclenchée{alerts.filter(a => a.triggered).length > 1 ? 's' : ''} !
                            </p>
                            <p className="text-[11px] opacity-75 mt-0.5">Des prix sont sous tes seuils en ce moment</p>
                        </div>
                    </motion.div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                )}

                {/* Empty state */}
                {!loading && alerts.length === 0 && (
                    <div className="bg-surface rounded-[24px] border border-dashed border-border-subtle p-12 text-center">
                        <BellOff className="w-10 h-10 text-muted opacity-30 mx-auto mb-3" />
                        <p className="font-bold text-foreground">Aucune alerte</p>
                        <p className="text-muted text-xs mt-1">Crée une alerte pour être notifié quand un prix baisse</p>
                    </div>
                )}

                {/* Alert list */}
                {alerts.map(alert => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-surface rounded-2xl border-2 p-4 flex items-center gap-4 ${
                            alert.triggered ? 'border-primary' : 'border-border-subtle'
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            alert.triggered ? 'bg-primary text-white' : 'bg-surface-2 text-muted'
                        }`}>
                            <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground text-sm truncate">{alert.productName}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-muted">Seuil : {alert.threshold.toFixed(2)} DH</span>
                                {alert.currentMin !== null && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                        alert.triggered ? 'bg-primary/10 text-primary' : 'bg-surface-2 text-muted'
                                    }`}>
                                        Actuel : {alert.currentMin.toFixed(2)} DH
                                    </span>
                                )}
                            </div>
                            {alert.triggered && (
                                <p className="text-[11px] text-primary font-black mt-1">✨ Prix sous ton seuil !</p>
                            )}
                        </div>
                        <button
                            onClick={() => handleDelete(alert)}
                            className="p-2 text-muted hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* ── Add alert drawer ── */}
            <AnimatePresence>
                {adding && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/40"
                            onClick={() => setAdding(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-[28px] shadow-2xl p-6 pb-10 max-h-[85vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-black text-foreground text-lg">Nouvelle alerte</h3>
                                <button onClick={() => setAdding(false)} className="p-2 text-muted hover:text-foreground rounded-xl hover:bg-surface-2">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Product search */}
                            {!selectedProduct ? (
                                <>
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                        <input
                                            type="text"
                                            placeholder="Chercher un produit…"
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            autoFocus
                                            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-border-subtle bg-surface focus:border-primary outline-none text-sm font-medium text-foreground placeholder:text-muted"
                                        />
                                    </div>
                                    <div className="overflow-y-auto space-y-2 flex-1">
                                        {filteredProducts.slice(0, 20).map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedProduct(p)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors text-left"
                                            >
                                                <span className="text-2xl">{p.category === 'Boissons' ? '🥤' : p.category === 'Crèmerie' ? '🥛' : p.category === 'Hygiène' ? '🧼' : '🛒'}</span>
                                                <div>
                                                    <p className="font-bold text-sm text-foreground">{p.name}</p>
                                                    <p className="text-xs text-muted">{p.brand}</p>
                                                </div>
                                            </button>
                                        ))}
                                        {filteredProducts.length === 0 && (
                                            <p className="text-center text-muted text-sm py-6">Aucun produit trouvé</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-5">
                                    {/* Selected product */}
                                    <div className="flex items-center gap-3 bg-surface-2 rounded-2xl p-4">
                                        <span className="text-2xl">🛒</span>
                                        <div className="flex-1">
                                            <p className="font-bold text-foreground">{selectedProduct.name}</p>
                                            <p className="text-xs text-muted">{selectedProduct.brand}</p>
                                        </div>
                                        <button onClick={() => setSelectedProduct(null)} className="text-muted hover:text-foreground">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Threshold input */}
                                    <div>
                                        <label className="text-[11px] font-black text-muted uppercase tracking-widest block mb-2">
                                            M'alerter si le prix est inférieur à
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.5"
                                                inputMode="decimal"
                                                autoFocus
                                                placeholder="0.00"
                                                value={threshold}
                                                onChange={e => setThreshold(e.target.value)}
                                                className="w-full px-6 py-5 rounded-2xl border-2 border-border-subtle bg-surface focus:border-primary outline-none font-black text-3xl text-center text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-muted">DH</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSave}
                                        disabled={saving || !threshold || saved}
                                        className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                                            saved
                                                ? 'bg-green-500 text-white'
                                                : 'bg-primary text-white shadow-lg shadow-primary/25 disabled:opacity-50'
                                        }`}
                                    >
                                        {saved ? (
                                            <><CheckCircle2 className="w-5 h-5" /> Alerte créée !</>
                                        ) : saving ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <><Bell className="w-4 h-4" /> Créer l'alerte</>
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
