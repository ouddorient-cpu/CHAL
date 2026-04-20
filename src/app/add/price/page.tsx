"use client";

import { useAuth } from "@/context/AuthContext";
import { getProducts, getStores, addPriceAndCalculateStats } from "@/services/dataService";
import { Product, Store } from "@/types";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    X,
    Camera,
    ChevronLeft,
    TrendingUp,
    TrendingDown,
    Store as StoreIcon,
    MapPin,
    Plus,
    Search,
    Sparkles,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeProductImage } from "@/services/aiService";

// ─── Step indicator ────────────────────────────────────────────────────────────
function Stepper({ step }: { step: number }) {
    return (
        <div className="flex gap-2 px-6 pt-4 pb-2">
            {[1, 2, 3].map(i => (
                <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-border-subtle'}`}
                />
            ))}
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
function AddPriceContent() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    // Camera
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);

    // AI analysis
    const [aiLoading, setAiLoading] = useState(false);
    const [aiConfidence, setAiConfidence] = useState<number | null>(null);
    const [aiSuccess, setAiSuccess] = useState(false);

    // Step 2 — details
    const [price, setPrice] = useState("");
    const [productName, setProductName] = useState("");
    const [trend, setTrend] = useState<"promotion" | "hausse" | null>("promotion");

    // Step 3 — store
    const [stores, setStores] = useState<Store[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [storeSearch, setStoreSearch] = useState("");
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    // ── Camera helpers ──────────────────────────────────────────────────────────
    const startCamera = async () => {
        setPhoto(null);
        setCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    };

    const takePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.85);
        setPhoto(dataUrl);
        stopCamera();

        // Analyse IA en arrière-plan
        setAiLoading(true);
        setAiSuccess(false);
        try {
            const result = await analyzeProductImage(dataUrl);
            const recognized = result.productName && result.productName !== "Produit non identifié";
            if (recognized) setProductName(result.productName);
            if (result.price && result.price !== "") {
                const parsed = parseFloat(result.price.replace(",", ".").replace(/[^\d.]/g, ""));
                if (!isNaN(parsed) && parsed > 0) setPrice(String(parsed));
            }
            setAiConfidence(result.confidence);
            if (recognized) setAiSuccess(true);
        } catch {
            // silencieux — l'utilisateur remplit manuellement
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        if (step === 1 && !photo) startCamera();
        return () => { if (cameraActive) stopCamera(); };
    }, [step]);

    // ── Fetch stores & products on step 3 ──────────────────────────────────────
    useEffect(() => {
        if (step !== 3) return;
        Promise.all([getStores(), getProducts()]).then(([s, p]) => {
            setStores(s);
            setProducts(p);
        });
    }, [step]);

    const filteredStores = stores.filter(s =>
        s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
        s.address?.toLowerCase().includes(storeSearch.toLowerCase())
    );

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!user || !selectedStore || !price) return;

        setSubmitting(true);
        try {
            // Find matching product or use first result
            const matchedProduct = products.find(p =>
                p.name.toLowerCase().includes(productName.toLowerCase())
            ) || products[0];

            let location: { latitude: number; longitude: number } | undefined;
            try {
                const pos = await new Promise<GeolocationPosition>((res, rej) =>
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
                );
                location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            } catch { /* geolocation optional */ }

            await addPriceAndCalculateStats({
                productId: matchedProduct?.id || "",
                storeId: selectedStore.id,
                userId: user.uid,
                price: parseFloat(price),
                currency: "MAD",
                sourceType: photo ? "ai_photo" : "manual",
                neighborhood: selectedStore.neighborhood || "",
                location,
            });

            setDone(true);
            setTimeout(() => router.push("/"), 2000);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success screen ─────────────────────────────────────────────────────────
    if (done) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-bg-app">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="bg-primary text-white p-6 rounded-full mb-6 shadow-xl shadow-primary/30"
                >
                    <Check className="w-12 h-12" strokeWidth={3} />
                </motion.div>
                <h2 className="text-3xl font-black text-foreground mb-2">Prix partagé !</h2>
                <p className="text-muted text-sm">Merci pour ta contribution à la communauté.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg-app">

            {/* ── Sticky header ── */}
            <div className="bg-surface/90 backdrop-blur-xl px-4 py-3 border-b border-border-subtle flex items-center justify-between sticky top-0 z-20">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : router.push("/")}
                    className="p-2 text-muted hover:text-primary transition-colors"
                >
                    {step > 1 ? <ChevronLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
                </button>
                <h2 className="font-black text-lg tracking-tight text-foreground">Partager un prix</h2>
                <div className="w-10" />
            </div>

            <Stepper step={step} />

            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">

                    {/* ════════════════════════ STEP 1 — PHOTO ══════════════════════════════ */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            className="p-6 space-y-6"
                        >
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-foreground mb-1">Prenez une photo</h3>
                                <p className="text-muted text-sm font-medium">Capturez l'étiquette de prix ou le produit au Hanout.</p>
                            </div>

                            {/* Camera / preview */}
                            <div className="relative aspect-square w-full max-w-md mx-auto rounded-[32px] overflow-hidden bg-gray-100 dark:bg-surface-2 border-2 border-dashed border-border-subtle">
                                {photo ? (
                                    <img src={photo} alt="Capture" className="w-full h-full object-cover" />
                                ) : (
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                )}

                                {!photo && cameraActive && (
                                    <button
                                        onClick={takePhoto}
                                        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-[6px] border-primary shadow-xl active:scale-95 transition-transform flex items-center justify-center"
                                    >
                                        <div className="w-8 h-8 bg-primary rounded-full" />
                                    </button>
                                )}

                                {!cameraActive && !photo && (
                                    <button
                                        onClick={startCamera}
                                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted"
                                    >
                                        <Camera className="w-12 h-12 opacity-40" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Activer la caméra</span>
                                    </button>
                                )}
                            </div>

                            <canvas ref={canvasRef} className="hidden" />

                            {/* Bannière analyse IA */}
                            {aiLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4"
                                >
                                    <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-black text-primary">IA Gemini en cours…</p>
                                        <p className="text-[11px] text-muted mt-0.5">Lecture du produit et du prix</p>
                                    </div>
                                </motion.div>
                            )}

                            {!aiLoading && aiSuccess && photo && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className="bg-primary text-white rounded-2xl px-5 py-4 flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-sm">✨ Produit reconnu par l'IA !</p>
                                        <p className="text-[11px] opacity-80 mt-0.5 truncate">Nom et prix pré-remplis — vérifiez et continuez</p>
                                    </div>
                                    <span className="text-[11px] font-black bg-white/20 px-2 py-1 rounded-lg flex-shrink-0">
                                        {Math.round((aiConfidence ?? 0) * 100)}%
                                    </span>
                                </motion.div>
                            )}

                            {!aiLoading && !aiSuccess && aiConfidence !== null && photo && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-3 text-yellow-700"
                                >
                                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm font-bold">Produit non reconnu — remplissez manuellement</span>
                                </motion.div>
                            )}

                            {photo ? (
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => { setPhoto(null); setAiConfidence(null); startCamera(); }}
                                        className="px-6 py-3 rounded-full border-2 border-border-subtle font-bold text-sm text-muted hover:border-foreground transition-all"
                                    >
                                        Refaire
                                    </button>
                                    <button
                                        onClick={() => { stopCamera(); setStep(2); }}
                                        disabled={aiLoading}
                                        className="px-8 py-3 rounded-full bg-primary text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
                                    >
                                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continuer <ArrowRight className="w-5 h-5" /></>}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { stopCamera(); setStep(2); }}
                                    className="w-full py-4 rounded-full border-2 border-border-subtle text-muted font-bold text-sm hover:border-primary hover:text-primary transition-all"
                                >
                                    Passer cette étape
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* ═══════════════════════ STEP 2 — DÉTAILS ═══════════════════════════ */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            className="p-6 space-y-8 max-w-lg mx-auto w-full"
                        >
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-foreground mb-1">Les détails du prix</h3>
                                <p className="text-muted text-sm font-medium">Saisissez le prix observé avec précision.</p>
                            </div>

                            {/* Big price input */}
                            <div className="relative">
                                <label className="text-[11px] font-black text-muted uppercase tracking-widest absolute -top-2.5 left-6 px-2 bg-bg-app flex items-center gap-2">
                                    Prix en Dirham
                                    {price && aiSuccess && (
                                        <motion.span
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="text-primary flex items-center gap-1"
                                        >
                                            <Sparkles className="w-3 h-3" /> IA
                                        </motion.span>
                                    )}
                                </label>
                                <motion.input
                                    animate={price && aiSuccess ? { borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 4%, transparent)' } : {}}
                                    type="number"
                                    step="0.1"
                                    inputMode="decimal"
                                    autoFocus
                                    placeholder="00.00"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full px-8 py-6 rounded-[24px] border-2 border-border-subtle bg-surface focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-black text-4xl text-center text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>

                            {/* Product name */}
                            <div className="relative">
                                <label className="text-[11px] font-black text-muted uppercase tracking-widest absolute -top-2.5 left-6 px-2 bg-bg-app flex items-center gap-2">
                                    Nom du produit
                                    {productName && aiSuccess && (
                                        <motion.span
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="text-primary flex items-center gap-1"
                                        >
                                            <Sparkles className="w-3 h-3" /> IA
                                        </motion.span>
                                    )}
                                </label>
                                <motion.input
                                    animate={productName && aiSuccess ? { borderColor: 'var(--color-primary)' } : {}}
                                    type="text"
                                    placeholder="Ex: Coca-Cola 1.5L, Lait Centrale..."
                                    value={productName}
                                    onChange={e => setProductName(e.target.value)}
                                    className="w-full px-6 py-4 rounded-[20px] border-2 border-border-subtle bg-surface focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold text-foreground placeholder:text-muted"
                                />
                            </div>

                            {/* Trend buttons */}
                            <div>
                                <p className="text-[11px] font-black text-muted uppercase tracking-widest mb-3">Tendance du prix</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setTrend("promotion")}
                                        className={`p-4 rounded-[20px] border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${
                                            trend === "promotion"
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border-subtle text-muted hover:border-primary/40"
                                        }`}
                                    >
                                        <TrendingDown className="w-6 h-6" />
                                        Promotion / Bas
                                    </button>
                                    <button
                                        onClick={() => setTrend("hausse")}
                                        className={`p-4 rounded-[20px] border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${
                                            trend === "hausse"
                                                ? "border-red-400 bg-red-50 text-red-500"
                                                : "border-border-subtle text-muted hover:border-red-300"
                                        }`}
                                    >
                                        <TrendingUp className="w-6 h-6" />
                                        Prix en hausse
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(3)}
                                disabled={!price}
                                className="w-full py-5 rounded-full bg-primary text-white font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/30 disabled:opacity-40 transition-all"
                            >
                                Étape suivante <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}

                    {/* ════════════════════════ STEP 3 — HANOUT ════════════════════════════ */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            className="p-6 space-y-6 max-w-lg mx-auto w-full"
                        >
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-foreground mb-1">Choisir le Hanout</h3>
                                <p className="text-muted text-sm font-medium">Indiquez où vous avez trouvé ce prix.</p>
                            </div>

                            {/* Search */}
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un Hanout..."
                                    value={storeSearch}
                                    onChange={e => setStoreSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-full border border-border-subtle bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm font-medium text-foreground placeholder:text-muted"
                                />
                            </div>

                            {/* Store list */}
                            <div className="space-y-3 max-h-[55vh] overflow-y-auto no-scrollbar pb-4">
                                {filteredStores.map(store => (
                                    <button
                                        key={store.id}
                                        onClick={() => setSelectedStore(store)}
                                        className={`w-full p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                            selectedStore?.id === store.id
                                                ? "border-primary bg-primary/5"
                                                : "border-border-subtle bg-surface hover:border-primary/30"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-surface border border-border-subtle rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                                                🏪
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-foreground text-sm">{store.name}</h4>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3 text-muted" />
                                                    <p className="text-[10px] font-bold text-muted uppercase tracking-wide">
                                                        {store.neighborhood || store.address}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedStore?.id === store.id && (
                                            <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                        )}
                                    </button>
                                ))}

                                {filteredStores.length === 0 && stores.length > 0 && (
                                    <p className="text-center text-muted text-sm py-6">Aucun Hanout trouvé</p>
                                )}

                                {stores.length === 0 && (
                                    Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="h-16 bg-surface rounded-2xl animate-pulse" />
                                    ))
                                )}

                                <Link
                                    href="/add/store"
                                    className="w-full p-4 border-2 border-dashed border-primary/20 rounded-2xl text-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Créer un nouveau Hanout
                                </Link>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !selectedStore}
                                className="w-full py-5 rounded-full bg-foreground text-background font-black flex items-center justify-center gap-3 shadow-xl overflow-hidden relative group disabled:opacity-40 transition-all"
                            >
                                <span className="relative z-10">
                                    {submitting ? "Publication..." : "Publier le prix"}
                                </span>
                                <Check className="w-5 h-5 relative z-10 group-hover:scale-125 transition-transform" />
                                <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}

export default function AddPricePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-bg-app">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AddPriceContent />
        </Suspense>
    );
}
