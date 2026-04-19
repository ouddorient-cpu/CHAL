"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { addAnnonce } from "@/services/dataService";
import { AnnonceCategory, AnnoncePriceType } from "@/types";
import {
    ArrowLeft, Camera, Check, Image as ImageIcon, RefreshCcw,
    Smartphone, Shirt, Sofa, ShoppingBasket, Wrench, Package,
    Phone, MapPin, Megaphone
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MEKNES_NEIGHBORHOODS } from "@/lib/constants";
import { getCameraStream, stopStream, captureFrame } from "@/services/cameraService";
import { useLanguage } from "@/context/LanguageContext";
import { TranslationKey } from "@/lib/translations";

// ── Category config ───────────────────────────────────────────────

interface CatConfig {
    icon: React.ElementType;
    color: string;
    bg: string;
    labelKey: TranslationKey;
}

const CATEGORIES: Array<{ key: AnnonceCategory } & CatConfig> = [
    { key: 'Électronique', labelKey: 'electroTab', icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-50' },
    { key: 'Vêtements', labelKey: 'vetementsTab', icon: Shirt, color: 'text-pink-500', bg: 'bg-pink-50' },
    { key: 'Meubles', labelKey: 'meublesTab', icon: Sofa, color: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'Alimentation', labelKey: 'alimentationTab', icon: ShoppingBasket, color: 'text-emerald-primary', bg: 'bg-emerald-primary/10' },
    { key: 'Services', labelKey: 'servicesTab', icon: Wrench, color: 'text-violet-500', bg: 'bg-violet-50' },
    { key: 'Autres', labelKey: 'autresTab', icon: Package, color: 'text-gray-500', bg: 'bg-surface' },
];

// ── WhatsApp validation ───────────────────────────────────────────
const WHATSAPP_REGEX = /^0[67]\d{8}$/;

export default function AddAnnoncePage() {
    const { t } = useLanguage();
    const router = useRouter();
    const { user, profile } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraAvailable, setCameraAvailable] = useState(true);
    const [whatsappError, setWhatsappError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        priceType: "fixed" as AnnoncePriceType,
        category: "Autres" as AnnonceCategory,
        whatsapp: "",
        neighborhood: "",
    });

    // Auto-fill WhatsApp with profile phone if available — users can override
    useEffect(() => {
        return () => stopStream(streamRef.current);
    }, []);

    // ── Camera ────────────────────────────────────────────────────
    const startCamera = async () => {
        try {
            const stream = await getCameraStream();
            streamRef.current = stream;
            setCapturedImage(null);
            setCameraAvailable(true);
            setShowCamera(true);
            await new Promise<void>(resolve => setTimeout(resolve, 50));
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                try { await videoRef.current.play(); } catch { /* autoPlay handles it */ }
            }
        } catch (err) {
            console.warn("Camera error:", err);
            setCameraAvailable(false);
            setShowCamera(false);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current) return;
        const frame = captureFrame(videoRef.current);
        if (frame) {
            setCapturedImage(frame);
            stopStream(streamRef.current);
            setShowCamera(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const b64 = ev.target?.result as string;
            setCapturedImage(b64);
        };
        reader.readAsDataURL(file);
    };

    // ── Validation ────────────────────────────────────────────────
    const validateWhatsapp = (val: string) => {
        const clean = val.replace(/\s/g, '');
        if (!clean) { setWhatsappError(t('numeroRequis')); return false; }
        if (!WHATSAPP_REGEX.test(clean)) { setWhatsappError(t('formatInvalideWhatsapp')); return false; }
        setWhatsappError("");
        return true;
    };

    // ── Submit ────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) {
            alert(t('alertNonConnecte'));
            router.push("/login");
            return;
        }
        if (!formData.title.trim()) return alert(t('titreRequis'));
        if (!validateWhatsapp(formData.whatsapp)) return;
        if (formData.priceType !== 'free' && (!formData.price || parseFloat(formData.price) <= 0)) {
            return alert(t('prixValideRequis'));
        }

        setLoading(true);
        try {
            await addAnnonce({
                title: formData.title.trim(),
                description: formData.description.trim(),
                price: formData.priceType === 'free' ? 0 : parseFloat(formData.price),
                priceType: formData.priceType,
                category: formData.category,
                imageUrl: capturedImage || undefined,
                userId: user.uid,
                userName: profile.displayName || user.displayName || 'Anonyme',
                userPhoto: profile.photoURL || user.photoURL || undefined,
                whatsapp: formData.whatsapp.replace(/\s/g, ''),
                neighborhood: formData.neighborhood || undefined,
            });
            setDone(true);
            setTimeout(() => router.push("/annonces"), 2000);
        } catch (err) {
            console.error("addAnnonce error:", err);
            alert(t('erreurPublication'));
        } finally {
            setLoading(false);
        }
    };

    // ── Success screen ────────────────────────────────────────────
    if (done) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
                <div className="bg-violet-500 text-white p-6 rounded-[2.5rem] mb-8 animate-bounce shadow-2xl shadow-violet-500/20">
                    <Check size={48} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-black text-foreground mb-2 tracking-tighter uppercase">{t('annoncePublieeSuccess')}</h2>
                <p className="text-muted font-bold text-sm">{t('annonceVisibleCommunaute')}</p>
            </div>
        );
    }

    // ── Main form ─────────────────────────────────────────────────
    return (
        <div className="flex flex-col min-h-screen bg-background font-sans">

            {/* Header */}
            <div className="bg-background/90 backdrop-blur-xl px-6 py-5 border-b border-border-faint flex items-center justify-between sticky top-0 z-40">
                <button
                    aria-label={t('retour')}
                    onClick={() => router.back()}
                    className="text-gray-400 p-2 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <Megaphone size={18} className="text-violet-500" />
                    <h1 className="font-black text-base tracking-tight text-foreground uppercase">{t('nouvelleAnnonceHeader')}</h1>
                </div>
                <div className="w-10" />
            </div>

            <main className="flex-1 p-4 max-w-lg mx-auto w-full">
                <form onSubmit={handleSubmit} className="space-y-5 pb-32">

                    {/* ── Image section ── */}
                    <div className="space-y-3">
                        {/* Camera view or image preview */}
                        {showCamera ? (
                            <div className="relative aspect-video bg-[#111] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                {/* Capture button */}
                                <button
                                    type="button"
                                    onClick={handleCapture}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-white/60 active:scale-90 transition-all"
                                >
                                    <div className="w-11 h-11 rounded-full bg-white border-2 border-neutral-300 flex items-center justify-center">
                                        <Camera size={20} className="text-violet-500" />
                                    </div>
                                </button>
                                {/* Cancel camera */}
                                <button
                                    type="button"
                                    onClick={() => { stopStream(streamRef.current); setShowCamera(false); }}
                                    className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                >
                                    {t('annuler')}
                                </button>
                            </div>
                        ) : capturedImage ? (
                            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                                <img src={capturedImage} alt={t('photoAnnonce')} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setCapturedImage(null); stopStream(streamRef.current); }}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 active:scale-90 transition-all"
                                >
                                    <RefreshCcw size={14} className="inline mr-1.5" />{t('reprendre')}
                                </button>
                            </div>
                        ) : (
                            // Photo placeholder
                            <div className="aspect-video rounded-[2.5rem] overflow-hidden border-2 border-dashed border-border-subtle bg-surface flex flex-col items-center justify-center gap-3">
                                <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center">
                                    <ImageIcon size={24} className="text-violet-400" />
                                </div>
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">{t('photoOptionnelle')}</p>
                            </div>
                        )}

                        {/* Image action buttons — only show when no image yet and camera not active */}
                        {!showCamera && !capturedImage && (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-surface border border-border-faint text-[10px] font-black uppercase tracking-widest text-muted active:scale-95 transition-all"
                                >
                                    <Camera size={16} className="text-violet-500" />
                                    {t('prendrePhoto')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-surface border border-border-faint text-[10px] font-black uppercase tracking-widest text-muted active:scale-95 transition-all"
                                >
                                    <ImageIcon size={16} className="text-violet-500" />
                                    {t('galerie')}
                                </button>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </div>

                    {/* ── Category ── */}
                    <div className="bg-card rounded-3xl p-5 shadow-xl shadow-emerald-900/5 border border-border-subtle">
                        <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-4">{t('categorieLabel')}</p>
                        <div className="grid grid-cols-3 gap-2.5">
                            {CATEGORIES.map(({ key, labelKey, icon: Icon, color, bg }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setFormData(f => ({ ...f, category: key }))}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95 ${formData.category === key
                                        ? 'border-violet-400 shadow-md bg-violet-50/50'
                                        : 'border-border-faint bg-white'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                                        <Icon size={20} className={color} />
                                    </div>
                                    <span className="text-[8px] font-black text-foreground uppercase tracking-tighter leading-tight text-center">{t(labelKey)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Title + Description ── */}
                    <div className="bg-card rounded-3xl p-5 shadow-xl shadow-emerald-900/5 border border-border-subtle space-y-5">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('titreLabelAnnonce')} *</p>
                            <input
                                type="text"
                                placeholder={t('titrePlaceholderAnnonce')}
                                className="w-full bg-transparent border-b border-border-subtle py-1.5 text-sm font-black text-foreground focus:border-violet-400 outline-none transition-all placeholder:text-faint"
                                value={formData.title}
                                onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                                maxLength={80}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('descriptionLabel')}</p>
                            <textarea
                                placeholder={t('descriptionPlaceholderAnnonce')}
                                rows={3}
                                className="w-full bg-surface rounded-2xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-violet-400/30 placeholder:text-faint resize-none transition-all"
                                value={formData.description}
                                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                                maxLength={400}
                            />
                        </div>
                    </div>

                    {/* ── Price ── */}
                    <div className="bg-card rounded-3xl p-5 shadow-xl shadow-emerald-900/5 border border-border-subtle space-y-4">
                        <p className="text-[9px] font-black text-muted uppercase tracking-widest">{t('prixLabel')}</p>

                        {/* Price type toggle */}
                        <div className="grid grid-cols-3 gap-2">
                            {(['fixed', 'negotiable', 'free'] as AnnoncePriceType[]).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData(f => ({
                                        ...f,
                                        priceType: type,
                                        price: type === 'free' ? '' : f.price
                                    }))}
                                    className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${formData.priceType === type
                                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                                        : 'bg-surface text-muted border border-border-faint'
                                        }`}
                                >
                                    {type === 'fixed' ? t('fixe') : type === 'negotiable' ? t('negociable') : t('gratuit')}
                                </button>
                            ))}
                        </div>

                        {/* Price number input — hidden when free */}
                        {formData.priceType !== 'free' && (
                            <div className="flex items-baseline justify-center gap-3 py-4">
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    placeholder="0"
                                    className="bg-transparent text-5xl font-black text-violet-500 text-center w-40 outline-none placeholder:text-violet-200"
                                    value={formData.price}
                                    onChange={e => setFormData(f => ({ ...f, price: e.target.value }))}
                                    required
                                />
                                <span className="text-xl font-black text-violet-300 italic">DH</span>
                            </div>
                        )}
                    </div>

                    {/* ── WhatsApp ── */}
                    <div className="bg-card rounded-3xl p-5 shadow-xl shadow-emerald-900/5 border border-border-subtle space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Phone size={14} className="text-[#25D366]" />
                            <p className="text-[9px] font-black text-muted uppercase tracking-widest">{t('numeroWhatsAppLabel')} *</p>
                        </div>
                        <input
                            type="tel"
                            placeholder="0612345678"
                            className={`w-full bg-surface rounded-2xl px-4 py-3 text-sm font-black text-foreground outline-none focus:ring-2 transition-all placeholder:text-faint ${whatsappError ? 'ring-2 ring-red-400' : 'focus:ring-[#25D366]/30'
                                }`}
                            value={formData.whatsapp}
                            onChange={e => { setFormData(f => ({ ...f, whatsapp: e.target.value })); setWhatsappError(""); }}
                            onBlur={() => formData.whatsapp && validateWhatsapp(formData.whatsapp)}
                            maxLength={10}
                            required
                        />
                        {whatsappError ? (
                            <p className="text-[9px] font-black text-red-500">{whatsappError}</p>
                        ) : (
                            <p className="text-[9px] font-bold text-muted">{t('whatsappAcheteursDesc')}</p>
                        )}
                    </div>

                    {/* ── Neighborhood ── */}
                    <div className="bg-card rounded-3xl p-5 shadow-xl shadow-emerald-900/5 border border-border-subtle">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin size={14} className="text-emerald-primary" />
                            <p className="text-[9px] font-black text-muted uppercase tracking-widest">{t('quartierOptionnel')}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {MEKNES_NEIGHBORHOODS.map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setFormData(f => ({ ...f, neighborhood: f.neighborhood === n ? '' : n }))}
                                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all active:scale-95 ${formData.neighborhood === n
                                        ? 'bg-emerald-primary text-white shadow-sm'
                                        : 'bg-surface text-muted border border-border-faint'
                                        }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Submit ── */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-violet-500 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-violet-500/20 active:scale-95 transition-all disabled:opacity-50 border-t border-white/20 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Megaphone size={20} strokeWidth={2.5} />
                                {t('publierAnnonce')}
                            </>
                        )}
                    </button>

                </form>
            </main>
        </div>
    );
}
