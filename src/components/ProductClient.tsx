"use client";

import { getPricesForProduct, calculateProductStats, voteProduct, addComment, getComments } from "@/services/dataService";
import { PriceContribution, Product, ProductStats, ProductComment } from "@/types";
import { ArrowLeft, MapPin, Share2, Tag, TrendingDown, TrendingUp, ThumbsUp, ThumbsDown, MessageSquare, Send, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import dynamic from 'next/dynamic';
import { useLanguage } from "@/context/LanguageContext";

// Dynamic import for Leaflet to avoid SSR issues
const MapContainerComponent = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false }) as any;
const TileLayerComponent = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false }) as any;
const MarkerComponent = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false }) as any;
const PopupComponent = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false }) as any;

export default function ProductClient() {
    const { t, lang } = useLanguage();
    const params = useParams();
    const rawId = params?.id as string | undefined;
    const router = useRouter();
    const { user, profile } = useAuth();

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<Product | null>(null);
    const [prices, setPrices] = useState<PriceContribution[]>([]);
    const [stats, setStats] = useState<ProductStats | null>(null);
    const [comments, setComments] = useState<ProductComment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [showMapPopup, setShowMapPopup] = useState(false);
    const [selectedStore, setSelectedStore] = useState<{ lat: number, lng: number, name: string } | null>(null);

    useEffect(() => {
        setMounted(true);

        // In APK (static export), ProductCard navigates to /product/placeholder?id=REAL_ID
        // so useParams() returns 'placeholder'. Read real ID from ?id= search param first.
        // Fallback: pathname match for web deep links.
        let id = rawId;
        if (!id || id === 'placeholder') {
            if (typeof window !== 'undefined') {
                const searchId = new URLSearchParams(window.location.search).get('id');
                if (searchId && searchId !== 'placeholder') {
                    id = searchId;
                    history.replaceState(null, '', `/product/${id}`);
                } else {
                    const m = window.location.pathname.match(/\/product\/([^/]+)/);
                    if (m?.[1] && m[1] !== 'placeholder') id = m[1];
                }
            }
        }

        console.log("CH7AL: Product ID detected:", id);

        if (!id || id === 'placeholder') {
            // If we still don't have an ID, don't just stay in loading. 
            // Try to wait a bit or show a specific error.
            if (mounted) setLoading(false);
            return;
        }

        setLoading(true);
        const fetchData = async () => {
            try {
                const productSnap = await getDoc(doc(db, "products", id as string));
                if (productSnap.exists()) {
                    const productData = { id: productSnap.id, ...productSnap.data() } as Product;
                    setProduct(productData);

                    const [priceData, commentData] = await Promise.all([
                        getPricesForProduct(id as string),
                        getComments(id as string)
                    ]);

                    setPrices(priceData);
                    setComments(commentData);
                    setStats(calculateProductStats(priceData));
                } else {
                    console.warn("CH7AL: Product not found in Firestore:", id);
                }
            } catch (error) {
                console.error("CH7AL: Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [rawId, mounted]);

    const handleDeletePrice = async (priceId: string) => {
        if (!window.confirm(t('confirmSupprimerContribution'))) return;
        try {
            const { deletePrice } = await import("@/services/dataService");
            await deletePrice(priceId);
            // Update local state
            const updatedPrices = prices.filter(p => p.id !== priceId);
            setPrices(updatedPrices);
            setStats(calculateProductStats(updatedPrices));
        } catch (err) {
            console.error("Error deleting price:", err);
        }
    };

    const handleVote = async (type: 'up' | 'down') => {
        if (!user || !product) return router.push("/login");
        try {
            await voteProduct(product.id, user.uid, type);
            setProduct({
                ...product,
                [type === 'up' ? 'upVotes' : 'downVotes']: (product[type === 'up' ? 'upVotes' : 'downVotes'] || 0) + 1
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile || !newComment.trim() || !product) return;

        setIsSubmittingComment(true);
        try {
            await addComment(product.id, user.uid, profile.displayName, profile.photoURL, newComment);
            setNewComment("");
            const updatedComments = await getComments(product.id);
            setComments(updatedComments);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const openMap = (name: string) => {
        setSelectedStore({ lat: 33.8935, lng: -5.5473, name });
        setShowMapPopup(true);
    };

    const handleShare = async () => {
        if (!product) return;
        const shareData = {
            title: `Ch7al: ${product.name}`,
            text: `Regarde le prix de ${product.name} sur Ch7al Hanout Price à Meknès !`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert(lang === 'fr' ? "Lien copié dans le presse-papier !" : "تم نسخ الرابط !");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    if (loading) return <div className="p-10 text-center text-muted">{t('chargement')}...</div>;
    if (!product) return <div className="p-10 text-center text-muted">{t('produitNonTrouve')}</div>;

    const formatDateShort = (ts: any) => {
        if (!ts) return '';
        try {
            const date = ts.toDate ? ts.toDate() : new Date(ts);
            return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-MA');
        } catch {
            return '';
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#fefcf8]/90 backdrop-blur px-4 py-3 border-b border-border-faint flex items-center justify-between">
                <button aria-label={t('retour')} onClick={() => router.back()} className="text-muted p-1 hover:text-emerald-primary transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
                    <div className="w-8 h-8 overflow-hidden rounded-xl border border-border-faint shadow-sm flex-shrink-0">
                        <img
                            src="https://res.cloudinary.com/dk93srhfb/image/upload/v1770560187/ChatGPT_Image_8_f%C3%A9vr._2026_14_34_34_1_in4sic.png"
                            alt="Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="font-bold text-foreground line-clamp-1 text-sm">{product.name}</span>
                </div>
                <button
                    onClick={handleShare}
                    aria-label={t('partager')}
                    className="text-muted p-2 hover:bg-surface rounded-2xl transition-all active:scale-90"
                >
                    <Share2 size={24} />
                </button>
            </div>

            <div className="mt-14 pb-32">
                {/* Hero section */}
                <section className="bg-white p-6 premium-shadow-sm border-b border-border-faint">
                    <div className="aspect-square bg-surface rounded-[3rem] overflow-hidden mb-6 flex items-center justify-center border border-border-faint shadow-inner group relative">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <Tag size={80} className="text-border-subtle" />
                        )}
                        <div className="absolute bottom-4 right-4 flex gap-2">
                            <button
                                aria-label={t('jaime')}
                                onClick={() => handleVote('up')}
                                className="bg-white/90 backdrop-blur-md p-4 rounded-2xl premium-shadow border border-border-faint flex items-center gap-2 active:scale-90 transition-all text-emerald-primary font-black"
                            >
                                <ThumbsUp size={20} />
                                <span className="text-sm">{product.upVotes || 0}</span>
                            </button>
                            <button
                                aria-label={t('jeNaimePas')}
                                onClick={() => handleVote('down')}
                                className="bg-white/90 backdrop-blur-md p-4 rounded-2xl premium-shadow border border-border-faint flex items-center gap-2 active:scale-90 transition-all text-red-500 font-black"
                            >
                                <ThumbsDown size={20} />
                                <span className="text-sm">{product.downVotes || 0}</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-emerald-primary bg-emerald-primary/10 px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                            {product.category}
                        </span>
                        <h2 className="text-3xl font-black text-foreground leading-tight">{product.name}</h2>
                        <p className="text-muted font-bold flex items-center gap-2">
                            <Tag size={14} />
                            {product.brand} • {product.unit}
                        </p>
                    </div>
                </section>

                {/* Stats */}
                <section className="p-4 pt-6">
                    {stats && stats.count > 0 && typeof stats.avgPrice === 'number' ? (
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-emerald-primary/5 border border-emerald-primary/10 p-3 rounded-2xl flex flex-col items-center shadow-sm">
                                <span className="text-[8px] font-black text-muted underline decoration-emerald-primary/30 underline-offset-4 uppercase tracking-tighter mb-2 text-center leading-none">{t('prixMoyen')}</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-lg font-black text-emerald-primary">{stats.avgPrice.toFixed(2)}</span>
                                    <span className="text-[8px] font-bold text-emerald-primary italic ml-0.5">DH</span>
                                </div>
                            </div>
                            <div className="bg-emerald-primary/5 border border-emerald-primary/10 p-3 rounded-2xl flex flex-col items-center shadow-sm">
                                <TrendingDown size={12} className="text-emerald-primary mb-2" />
                                <span className="text-[8px] font-black text-muted uppercase tracking-tighter mb-1">{t('minimum')}</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-lg font-black text-emerald-primary">{(stats.minPrice || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-2xl flex flex-col items-center shadow-sm">
                                <TrendingUp size={12} className="text-red-500 mb-2" />
                                <span className="text-[8px] font-black text-muted uppercase tracking-tighter mb-1">{t('maximum')}</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-lg font-black text-red-500">{(stats.maxPrice || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-dashed border-border-subtle p-10 rounded-[2.5rem] text-center shadow-sm group">
                            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Tag size={32} className="text-border-subtle" />
                            </div>
                            <p className="text-muted text-sm font-bold">{t('aucunPrixDeclare')}...</p>
                            <Link href="/add/price" className="text-emerald-primary font-black text-xs mt-3 inline-flex items-center gap-1 uppercase tracking-widest hover:underline">
                                {t('contribuerMaintenant')} <ArrowLeft size={14} className="rotate-180" />
                            </Link>
                        </div>
                    )}
                </section>

                {/* Price list */}
                {prices.length > 0 && (
                    <section className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
                                <MapPin size={18} className="text-emerald-primary" />
                                {t('comparatifLocal')} ({prices.length})
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {prices.map((p, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-[2.5rem] premium-shadow-sm border border-border-faint flex items-center justify-between group hover:border-emerald-primary/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <button
                                            aria-label={t('voirSurCarte')}
                                            onClick={() => openMap(`Hanout ${p.storeId.substring(0, 5)}`)}
                                            className="w-14 h-14 bg-emerald-primary/5 text-emerald-primary rounded-3xl flex items-center justify-center group-hover:bg-emerald-primary group-hover:text-white transition-all shadow-inner border border-emerald-primary/10"
                                        >
                                            <MapPin size={28} />
                                        </button>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-foreground text-sm truncate max-w-[150px]">{t('hanout')} {p.storeId.substring(0, 5)}...</h4>
                                            <p className="text-[10px] text-muted font-bold uppercase tracking-wider">{formatDateShort(p.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <div className="flex items-baseline justify-end gap-1">
                                            <span className="text-2xl font-black text-foreground leading-none">{(p.price || 0).toFixed(2)}</span>
                                            <span className="text-[10px] font-black text-emerald-primary italic mb-1">DH</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {user && user.uid === p.userId && (
                                                <button
                                                    onClick={() => handleDeletePrice(p.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t('supprimerContribution')}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.1em] ${p.price <= stats!.minPrice ? "bg-emerald-primary text-white" : "bg-surface-2 text-muted"}`}>
                                                {p.price <= stats!.minPrice ? t('moinsCher') : t('moyenLabel')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Comments Section */}
                <section className="p-4 mt-4 space-y-6">
                    <h3 className="font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
                        <MessageSquare size={18} className="text-emerald-primary" />
                        {t('avisCommunautaires')} ({comments.length})
                    </h3>

                    <form onSubmit={handleCommentSubmit} className="relative">
                        <input
                            type="text"
                            placeholder={t('partagezAvis')}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full bg-white border border-border-subtle rounded-2xl py-4 pl-5 pr-14 text-sm focus:border-emerald-primary outline-none shadow-sm transition-all text-foreground"
                        />
                        <button
                            aria-label={t('envoyerCommentaire')}
                            type="submit"
                            disabled={isSubmittingComment || !newComment.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-primary text-white p-2.5 rounded-xl shadow-md disabled:opacity-50 active:scale-90 transition-all"
                        >
                            <Send size={18} />
                        </button>
                    </form>

                    <div className="space-y-6 pt-2">
                        {comments.length > 0 ? comments.map((c) => (
                            <div key={c.id} className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-surface-2 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                                    {c.userPhoto ? <img src={c.userPhoto} alt={c.userName} /> : <div className="w-full h-full flex items-center justify-center font-bold text-muted">{c.userName[0]}</div>}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground text-sm">{c.userName}</span>
                                        <span className="text-[10px] text-muted">{formatDateShort(c.createdAt)}</span>
                                    </div>
                                    <p className="text-foreground text-sm leading-relaxed bg-white p-4 rounded-2xl rounded-tl-none border border-border-faint shadow-sm">
                                        {c.content}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-muted text-xs py-4 italic">{t('pasEncoreCommentaires')}</p>
                        )}
                    </div>
                </section>
            </div>

            {/* Fab button */}
            <div className="fixed bottom-24 left-4 right-4 z-40">
                <Link
                    href="/add/price"
                    className="w-full bg-emerald-primary text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-emerald-900/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg uppercase tracking-widest border-t border-white/20"
                >
                    <TrendingUp size={22} strokeWidth={3} />
                    {t('declarerNouveauPrix')}
                </Link>
            </div>

            {/* Map Popup */}
            {showMapPopup && selectedStore && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden flex flex-col h-[80vh] sm:h-auto shadow-2xl border border-border-faint">
                        <div className="p-6 flex justify-between items-center border-b border-border-faint">
                            <div>
                                <h3 className="font-black text-xl text-foreground">{selectedStore.name}</h3>
                                <p className="text-xs text-muted font-bold uppercase tracking-widest">{t('localisationPrecise')}</p>
                            </div>
                            <button aria-label={t('fermerCarte')} onClick={() => setShowMapPopup(false)} className="p-3 bg-surface rounded-2xl text-muted active:scale-90 transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 min-h-[300px] relative">
                            <div className="absolute inset-0 flex items-center justify-center text-muted font-bold text-center p-10 z-0">
                                <div className="space-y-4">
                                    <MapPin size={48} className="mx-auto opacity-20" />
                                    <p>{t('carteInteractive')}<br /><span className="text-[10px] opacity-60">Utilisant OpenStreetMap / Leaflet</span></p>
                                </div>
                            </div>
                            {mounted && (
                                <MapContainerComponent aria-label={t('carteInteractive')} center={[selectedStore.lat, selectedStore.lng] as any} zoom={15} className="h-full w-full relative z-10" {...{ center: [selectedStore.lat, selectedStore.lng], zoom: 15 } as any}>
                                    <TileLayerComponent
                                        aria-label="Couche de tuiles OpenStreetMap"
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        {...{ url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; contributors' } as any}
                                    />
                                    <MarkerComponent position={[selectedStore.lat, selectedStore.lng] as any} {...{ position: [selectedStore.lat, selectedStore.lng] } as any}>
                                        <PopupComponent>
                                            <div className="font-bold text-sm">{selectedStore.name}</div>
                                        </PopupComponent>
                                    </MarkerComponent>
                                </MapContainerComponent>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
