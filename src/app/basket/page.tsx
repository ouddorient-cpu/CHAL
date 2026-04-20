"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Plus, Trash2, ShoppingBasket, Search,
    Minus, Check, Loader2, TrendingDown, Package, X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    getBasketWithPrices, saveBasket, getProducts,
    BasketItem,
} from "@/services/dataService";
import { Product } from "@/types";

// ── Helpers ────────────────────────────────────────────────────────────────────
const UNITS = ['pièce', 'kg', 'L', 'g', 'ml', 'pack'];

function getCategoryEmoji(cat: string) {
    const map: Record<string, string> = { Crèmerie: '🥛', Boissons: '🥤', Hygiène: '🧼', Épicerie: '🍶', Entretien: '🧹' };
    return map[cat] || '🛒';
}

// ── Item row ───────────────────────────────────────────────────────────────────
function BasketRow({
    item, onQtyChange, onDelete,
}: {
    item: BasketItem;
    onQtyChange: (id: string, qty: number) => void;
    onDelete: (id: string) => void;
}) {
    const lineTotal = item.currentMinPrice != null ? item.currentMinPrice * item.qty : null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
            className="bg-surface rounded-2xl border border-border-subtle p-4 flex items-center gap-3"
        >
            {/* Emoji */}
            <div className="w-11 h-11 bg-surface-2 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                🛒
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    {item.currentMinPrice != null ? (
                        <span className="text-[11px] text-primary font-black">
                            {item.currentMinPrice.toFixed(2)} DH/{item.unit}
                        </span>
                    ) : (
                        <span className="text-[11px] text-muted font-medium">Prix non disponible</span>
                    )}
                    {lineTotal != null && (
                        <span className="text-[10px] font-black text-muted">
                            = {lineTotal.toFixed(2)} DH
                        </span>
                    )}
                </div>
            </div>

            {/* Qty stepper */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={() => onQtyChange(item.id, Math.max(1, item.qty - 1))}
                    className="w-7 h-7 rounded-full border-2 border-border-subtle flex items-center justify-center text-muted hover:border-primary hover:text-primary transition-all"
                >
                    <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center font-black text-foreground text-sm">{item.qty}</span>
                <button
                    onClick={() => onQtyChange(item.id, item.qty + 1)}
                    className="w-7 h-7 rounded-full border-2 border-border-subtle flex items-center justify-center text-muted hover:border-primary hover:text-primary transition-all"
                >
                    <Plus className="w-3 h-3" />
                </button>
            </div>

            {/* Delete */}
            <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function BasketPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [items, setItems]         = useState<BasketItem[]>([]);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [adding, setAdding]       = useState(false);

    // Add-item form
    const [products, setProducts]   = useState<Product[]>([]);
    const [search, setSearch]       = useState('');
    const [customName, setCustomName] = useState('');
    const [selectedProd, setSelectedProd] = useState<Product | null>(null);
    const [qty, setQty]             = useState(1);
    const [unit, setUnit]           = useState('pièce');

    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Load ────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) { setLoading(false); return; }
        getBasketWithPrices(user.uid).then(setItems).finally(() => setLoading(false));
        getProducts().then(setProducts);
    }, [user]);

    // ── Auto-save with debounce ─────────────────────────────────────────────────
    const scheduleAutoSave = (newItems: BasketItem[]) => {
        if (!user) return;
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        setSaving(true);
        saveTimeout.current = setTimeout(async () => {
            await saveBasket(user.uid, newItems.map(({ currentMinPrice, ...rest }) => rest));
            setSaving(false);
        }, 1200);
    };

    const updateItems = (newItems: BasketItem[]) => {
        setItems(newItems);
        scheduleAutoSave(newItems);
    };

    // ── CRUD ────────────────────────────────────────────────────────────────────
    const handleQtyChange = (id: string, newQty: number) => {
        updateItems(items.map(i => i.id === id ? { ...i, qty: newQty } : i));
    };

    const handleDelete = (id: string) => {
        updateItems(items.filter(i => i.id !== id));
    };

    const handleAddItem = async () => {
        const name = selectedProd?.name || customName.trim();
        if (!name) return;
        const newItem: BasketItem = {
            id: Date.now().toString(),
            name,
            productId: selectedProd?.id,
            qty,
            unit,
        };
        // Fetch current price if linked to a product
        let currentMinPrice: number | null = null;
        if (selectedProd) {
            const { getPricesForProduct } = await import('@/services/dataService');
            const prices = await getPricesForProduct(selectedProd.id);
            currentMinPrice = prices.length ? Math.min(...prices.map(p => p.price)) : null;
        }
        const enriched = { ...newItem, currentMinPrice };
        const newItems = [...items, enriched];
        updateItems(newItems);
        // Reset form
        setAdding(false);
        setSelectedProd(null);
        setCustomName('');
        setSearch('');
        setQty(1);
        setUnit('pièce');
    };

    // ── Totals ──────────────────────────────────────────────────────────────────
    const knownItems   = items.filter(i => i.currentMinPrice != null);
    const unknownItems = items.filter(i => i.currentMinPrice == null);
    const total        = knownItems.reduce((sum, i) => sum + (i.currentMinPrice! * i.qty), 0);
    const savings      = 0; // placeholder for future month-over-month comparison

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase())
    );

    if (!user) {
        return (
            <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center gap-4 p-6 text-center">
                <ShoppingBasket className="w-12 h-12 text-muted opacity-30" />
                <h2 className="font-black text-xl text-foreground">Connexion requise</h2>
                <Link href="/auth" className="bg-primary text-white px-6 py-3 rounded-full font-black text-sm">Se connecter</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-app pb-24">

            {/* ── Header ── */}
            <div className="bg-surface/90 backdrop-blur-xl border-b border-border-subtle px-4 py-4 sticky top-0 z-20 flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 text-muted hover:text-primary rounded-xl hover:bg-primary/5 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="font-black text-lg text-foreground">Mon Panier</h1>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                        {items.length} article{items.length > 1 ? 's' : ''} · prix au hanout
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {saving && <Loader2 className="w-4 h-4 text-muted animate-spin" />}
                    <button
                        onClick={() => setAdding(true)}
                        className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-xs font-black"
                    >
                        <Plus className="w-3.5 h-3.5" /> Ajouter
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

                {/* ── Total banner ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-foreground text-background rounded-[24px] p-6"
                >
                    <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Total estimé</p>
                    <div className="flex items-end justify-between">
                        <div>
                            <span className="text-4xl font-black">{total.toFixed(2)}</span>
                            <span className="text-lg font-black opacity-60 ml-1">DH</span>
                        </div>
                        {knownItems.length < items.length && (
                            <p className="text-[10px] opacity-50 font-bold text-right max-w-[120px]">
                                {unknownItems.length} article{unknownItems.length > 1 ? 's' : ''} sans prix connu
                            </p>
                        )}
                    </div>
                    {knownItems.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 opacity-60" />
                            <p className="text-[11px] opacity-60 font-bold">
                                Basé sur les meilleurs prix actuels dans les hanouts
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* ── Loading ── */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && items.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-surface rounded-[24px] border border-dashed border-border-subtle p-12 text-center"
                    >
                        <ShoppingBasket className="w-12 h-12 text-muted opacity-25 mx-auto mb-4" />
                        <h3 className="font-black text-foreground text-lg mb-1">Panier vide</h3>
                        <p className="text-muted text-sm mb-5">Ajoutez vos produits habituels pour suivre leur prix</p>
                        <button
                            onClick={() => setAdding(true)}
                            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-black text-sm shadow-lg shadow-primary/25"
                        >
                            <Plus className="w-4 h-4" /> Ajouter un article
                        </button>
                    </motion.div>
                )}

                {/* ── Items ── */}
                {!loading && items.length > 0 && (
                    <div className="space-y-2.5">
                        <p className="text-[11px] font-black text-muted uppercase tracking-widest px-1">Articles</p>
                        <AnimatePresence mode="popLayout">
                            {items.map(item => (
                                <BasketRow
                                    key={item.id}
                                    item={item}
                                    onQtyChange={handleQtyChange}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* ── Price breakdown ── */}
                {knownItems.length >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-surface rounded-[24px] border border-border-subtle p-5 space-y-3"
                    >
                        <p className="text-[11px] font-black text-muted uppercase tracking-widest">Détail des prix</p>
                        {knownItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-muted text-sm font-bold truncate max-w-[160px]">{item.name}</span>
                                    <span className="text-[10px] text-muted">×{item.qty}</span>
                                </div>
                                <span className="font-black text-foreground text-sm flex-shrink-0">
                                    {(item.currentMinPrice! * item.qty).toFixed(2)} DH
                                </span>
                            </div>
                        ))}
                        <div className="border-t border-border-subtle pt-3 flex items-center justify-between">
                            <span className="font-black text-foreground text-sm">Total</span>
                            <span className="font-black text-primary text-lg">{total.toFixed(2)} DH</span>
                        </div>
                    </motion.div>
                )}

                {/* ── CTA to share prices ── */}
                {unknownItems.length > 0 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
                        <Package className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-black text-foreground">
                                {unknownItems.length} article{unknownItems.length > 1 ? 's' : ''} sans prix
                            </p>
                            <p className="text-[11px] text-muted mt-0.5">Partagez leurs prix pour compléter le total</p>
                        </div>
                        <Link
                            href="/add/price"
                            className="bg-primary text-white text-[11px] font-black px-3 py-2 rounded-xl flex-shrink-0"
                        >
                            Partager
                        </Link>
                    </div>
                )}
            </div>

            {/* ── Add item drawer ── */}
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
                            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-[28px] shadow-2xl p-6 pb-10 max-h-[88vh] flex flex-col gap-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-foreground text-lg">Ajouter un article</h3>
                                <button onClick={() => setAdding(false)} className="p-2 text-muted hover:text-foreground rounded-xl hover:bg-surface-2">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {!selectedProd ? (
                                <>
                                    {/* Search existing products */}
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                        <input
                                            autoFocus type="text"
                                            placeholder="Chercher dans le catalogue…"
                                            value={search} onChange={e => setSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-border-subtle bg-surface focus:border-primary outline-none text-sm font-medium text-foreground placeholder:text-muted"
                                        />
                                    </div>

                                    {/* Custom name if not in catalogue */}
                                    {search && filteredProducts.length === 0 && (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Nom personnalisé"
                                                value={customName || search}
                                                onChange={e => setCustomName(e.target.value)}
                                                className="flex-1 px-4 py-3 rounded-2xl border-2 border-border-subtle bg-surface focus:border-primary outline-none text-sm font-medium text-foreground placeholder:text-muted"
                                            />
                                        </div>
                                    )}

                                    <div className="overflow-y-auto flex-1 space-y-1.5">
                                        {filteredProducts.slice(0, 15).map(p => (
                                            <button
                                                key={p.id} onClick={() => setSelectedProd(p)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors text-left"
                                            >
                                                <span className="text-2xl w-8 text-center">{getCategoryEmoji(p.category)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-foreground truncate">{p.name}</p>
                                                    <p className="text-xs text-muted">{p.brand}</p>
                                                </div>
                                                <span className="text-[10px] font-black text-muted bg-surface-2 px-2 py-1 rounded-lg">{p.category}</span>
                                            </button>
                                        ))}
                                        {search.length === 0 && (
                                            <p className="text-center text-muted text-sm py-4">Tapez pour chercher un produit</p>
                                        )}
                                    </div>

                                    {(customName || (search && filteredProducts.length === 0)) && (
                                        <button
                                            onClick={handleAddItem}
                                            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Ajouter "{customName || search}"
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-5">
                                    {/* Selected product */}
                                    <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl p-4">
                                        <span className="text-2xl">{getCategoryEmoji(selectedProd.category)}</span>
                                        <div className="flex-1">
                                            <p className="font-bold text-foreground">{selectedProd.name}</p>
                                            <p className="text-xs text-muted">{selectedProd.brand}</p>
                                        </div>
                                        <button onClick={() => setSelectedProd(null)} className="text-muted hover:text-foreground">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Qty + unit */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Quantité</label>
                                            <div className="flex items-center gap-3 bg-surface-2 rounded-2xl p-3">
                                                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center border border-border-subtle">
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="flex-1 text-center font-black text-foreground text-lg">{qty}</span>
                                                <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center border border-border-subtle">
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Unité</label>
                                            <select
                                                value={unit} onChange={e => setUnit(e.target.value)}
                                                className="w-full bg-surface-2 rounded-2xl p-3 font-bold text-foreground text-sm outline-none border-0"
                                            >
                                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddItem}
                                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                                    >
                                        <Check className="w-4 h-4" /> Ajouter au panier
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
