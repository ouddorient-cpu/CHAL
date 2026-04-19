"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAnnonceById, markAnnonceSold, deleteAnnonce } from "@/services/dataService";
import { Annonce, AnnonceCategory } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
    ArrowLeft, MessageCircle, MapPin, CheckCircle,
    Trash2, Smartphone, Shirt, Sofa, ShoppingBasket,
    Wrench, Package, Calendar, User2, Tag, Share2
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// ── Category config ───────────────────────────────────────────────

interface CatConfig {
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    labelKey: any;
}

const CATEGORY_CONFIG: Record<AnnonceCategory, CatConfig> = {
    'Électronique': { icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', labelKey: 'electroTab' },
    'Vêtements': { icon: Shirt, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100', labelKey: 'vetementsTab' },
    'Meubles': { icon: Sofa, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', labelKey: 'meublesTab' },
    'Alimentation': { icon: ShoppingBasket, color: 'text-emerald-primary', bg: 'bg-emerald-primary/10', border: 'border-emerald-primary/20', labelKey: 'alimentationTab' },
    'Services': { icon: Wrench, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100', labelKey: 'servicesTab' },
    'Autres': { icon: Package, color: 'text-gray-500', bg: 'bg-surface', border: 'border-border-subtle', labelKey: 'autresTab' },
};

function buildWhatsAppUrl(number: string): string {
    const cleaned = number.replace(/\s/g, '').replace(/^0/, '');
    return `https://wa.me/212${cleaned}`;
}

export default function AnnonceDetailClient() {
    const { t, lang } = useLanguage();
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { user } = useAuth();

    const [annonce, setAnnonce] = useState<Annonce | null>(null);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const isOwner = !!user && !!annonce && user.uid === annonce.userId;

    function formatDate(ts: any): string {
        if (!ts) return '';
        try {
            const date = ts.toDate ? ts.toDate() : new Date(ts);
            return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-MA', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch {
            return '';
        }
    }

    const handleShare = async () => {
        if (!annonce) return;
        const shareData = {
            title: `Ch7al: ${annonce.title}`,
            text: `Regarde cette annonce sur Ch7al Hanout Price : ${annonce.title}`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert(lang === 'fr' ? "Lien copié !" : "تم نسخ الرابط !");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    useEffect(() => {
        // In APK (static export), AnnonceCard navigates to /annonces/placeholder?id=REAL_ID
        // so useParams() returns 'placeholder'. Read real ID from ?id= search param first.
        // Fallback: pathname match for web deep links.
        let annonceId = id;
        if (!annonceId || annonceId === 'placeholder') {
            if (typeof window !== 'undefined') {
                const searchId = new URLSearchParams(window.location.search).get('id');
                if (searchId && searchId !== 'placeholder') {
                    annonceId = searchId;
                    history.replaceState(null, '', `/annonces/${annonceId}`);
                } else {
                    const m = window.location.pathname.match(/\/annonces\/([^/]+)/);
                    if (m?.[1] && m[1] !== 'placeholder') annonceId = m[1];
                }
            }
        }

        console.log("CH7AL: Annonce ID detected:", annonceId);

        if (!annonceId || annonceId === 'placeholder') {
            setLoading(false);
            return;
        }

        const fetch = async () => {
            try {
                const data = await getAnnonceById(annonceId as string);
                if (!data) {
                    console.warn("CH7AL: Annonce not found:", annonceId);
                    setNotFound(true);
                } else {
                    setAnnonce(data);
                }
            } catch (err) {
                console.error("CH7AL: AnnonceDetail fetch error:", err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    const handleMarkSold = async () => {
        if (!annonce || marking) return;
        setMarking(true);
        try {
            await markAnnonceSold(annonce.id);
            setAnnonce({ ...annonce, status: 'sold' });
        } catch (err) {
            console.error(err);
        } finally {
            setMarking(false);
        }
    };

    const handleDelete = async () => {
        if (!annonce || deleting) return;
        if (!window.confirm(t('confirmSupprimerAnnonce'))) return;
        setDeleting(true);
        try {
            await deleteAnnonce(annonce.id);
            router.push("/annonces");
        } catch (err) {
            console.error(err);
            setDeleting(false);
        }
    };

    // ── Loading state ─────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-background animate-pulse">
                <div className="bg-white h-16 border-b border-border-faint" />
                <div className="w-full aspect-video bg-surface" />
                <div className="p-6 space-y-4">
                    <div className="h-6 bg-surface rounded-full w-3/4" />
                    <div className="h-10 bg-surface rounded-2xl w-1/2" />
                    <div className="h-24 bg-surface rounded-2xl" />
                </div>
            </div>
        );
    }

    // ── Not found ─────────────────────────────────────────────────
    if (notFound || !annonce) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background gap-4">
                <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center">
                    <Tag size={32} className="text-muted" strokeWidth={1.5} />
                </div>
                <h2 className="font-black text-foreground text-xl">{t('annonceIntrouvable')}</h2>
                <p className="text-muted text-sm font-bold">{t('annonceSupprimeeDesc')}</p>
                <button
                    onClick={() => router.push("/annonces")}
                    className="bg-violet-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                    {t('voirToutesAnnonces')}
                </button>
            </div>
        );
    }

    const cfg = CATEGORY_CONFIG[annonce.category];
    const Icon = cfg.icon;
    const whatsappUrl = buildWhatsAppUrl(annonce.whatsapp);

    // ── Main render ───────────────────────────────────────────────
    return (
        <div className="flex flex-col min-h-screen bg-background font-sans">

            {/* Header */}
            <div className="bg-white/90 backdrop-blur-xl px-6 py-5 border-b border-border-faint flex items-center justify-between sticky top-0 z-40">
                <button
                    aria-label={t('retour')}
                    onClick={() => router.back()}
                    className="text-gray-400 p-2 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 overflow-hidden rounded-[0.7rem] border border-border-faint">
                        <img
                            src="https://res.cloudinary.com/dk93srhfb/image/upload/v1770560187/ChatGPT_Image_8_f%C3%A9vr._2026_14_34_34_1_in4sic.png"
                            alt="Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h1 className="font-black text-base tracking-tight text-foreground uppercase">{t('annonce')}</h1>
                </div>
                <button
                    onClick={handleShare}
                    aria-label={t('partager')}
                    className="text-gray-400 p-2 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
                >
                    <Share2 size={24} />
                </button>
            </div>

            {/* Hero — image or icon placeholder */}
            <div className={`w-full aspect-video flex items-center justify-center ${cfg.bg} border-b border-border-faint relative overflow-hidden`}>
                {annonce.imageUrl ? (
                    <img src={annonce.imageUrl} alt={annonce.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className={`w-24 h-24 ${cfg.bg} border-2 ${cfg.border} rounded-3xl flex items-center justify-center shadow-inner`}>
                            <Icon size={48} className={cfg.color} strokeWidth={1.5} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>{t(cfg.labelKey)}</span>
                    </div>
                )}
                {/* Sold overlay */}
                {annonce.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm px-8 py-4 rounded-2xl border border-red-200 shadow-xl">
                            <span className="font-black text-3xl text-red-500 uppercase tracking-tight">{t('venduUpper')}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-5 space-y-4 pb-36">

                {/* Title + price + category */}
                <div className="bg-white rounded-3xl p-5 shadow-xl shadow-emerald-900/5 border border-border-subtle space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <h2 className="font-black text-xl text-foreground leading-tight flex-1">{annonce.title}</h2>
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                            {t(cfg.labelKey)}
                        </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-emerald-primary">
                            {annonce.price === 0 ? t('gratuit') : annonce.price.toFixed(2)}
                        </span>
                        {annonce.price > 0 && (
                            <span className="text-lg font-black text-emerald-primary/60">DH</span>
                        )}
                        {annonce.priceType === 'negotiable' && annonce.price > 0 && (
                            <span className="text-[10px] font-black text-muted bg-surface px-2 py-0.5 rounded-full uppercase tracking-tight">{t('negociable')}</span>
                        )}
                    </div>
                </div>

                {/* Description */}
                {annonce.description && (
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-border-subtle">
                        <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">{t('descriptionLabel')}</p>
                        <p className="text-sm text-foreground font-medium leading-relaxed">{annonce.description}</p>
                    </div>
                )}

                {/* Location + Date */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-border-subtle space-y-3">
                    {annonce.neighborhood && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-primary/10 rounded-xl flex items-center justify-center">
                                <MapPin size={16} className="text-emerald-primary" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-muted uppercase tracking-widest">{t('quartierLabel')}</p>
                                <p className="text-sm font-black text-foreground">{annonce.neighborhood}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-surface rounded-xl flex items-center justify-center">
                            <Calendar size={16} className="text-muted" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-muted uppercase tracking-widest">{t('publieLe')}</p>
                            <p className="text-sm font-black text-foreground">{formatDate(annonce.createdAt)}</p>
                        </div>
                    </div>
                </div>

                {/* Seller info */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-border-subtle">
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-3">{t('vendeurLabel')}</p>
                    <div className="flex items-center gap-3">
                        {annonce.userPhoto ? (
                            <img src={annonce.userPhoto} alt={annonce.userName} className="w-12 h-12 rounded-2xl object-cover border border-border-faint" />
                        ) : (
                            <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center border border-border-faint">
                                <User2 size={20} className="text-muted" />
                            </div>
                        )}
                        <div>
                            <p className="font-black text-foreground text-sm">{annonce.userName}</p>
                            <p className="text-[9px] font-bold text-muted">{t('membreCH7AL')}</p>
                        </div>
                    </div>
                </div>

                {/* Owner-only actions */}
                {isOwner && (
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-border-subtle space-y-3">
                        <p className="text-[9px] font-black text-muted uppercase tracking-widest">{t('gererMonAnnonce')}</p>
                        {annonce.status === 'active' && (
                            <button
                                onClick={handleMarkSold}
                                disabled={marking}
                                className="w-full bg-emerald-primary/10 text-emerald-primary py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {marking ? (
                                    <div className="w-4 h-4 border-2 border-emerald-primary/30 border-t-emerald-primary rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle size={16} />
                                )}
                                {t('marquerCommeVendu')}
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="w-full text-red-500 py-3 font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            {deleting ? (
                                <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                            ) : (
                                <Trash2 size={14} />
                            )}
                            {t('supprimerAnnonce')}
                        </button>
                    </div>
                )}
            </div>

            {/* Fixed WhatsApp CTA — only if active */}
            {annonce.status === 'active' && (
                <div className="fixed bottom-20 left-0 right-0 p-4 z-40 max-w-md mx-auto">
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-green-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-[0.15em] border-t border-white/20"
                    >
                        <MessageCircle size={22} strokeWidth={2.5} />
                        {t('contacterWhatsApp')}
                    </a>
                </div>
            )}
        </div>
    );
}
