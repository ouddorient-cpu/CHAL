"use client";

import { useAuth } from "@/context/AuthContext";
import { getProducts, getStores, addPriceAndCalculateStats } from "@/services/dataService";
import { Product, Store } from "@/types";
import {
    ArrowRight, Check, X, ChevronLeft,
    TrendingUp, TrendingDown, MapPin, Plus, Search, Sparkles, Loader2, ScanLine,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeProductImage } from "@/services/aiService";

// ─── Step indicator ────────────────────────────────────────────────────────────
function Stepper({ step }: { step: number }) {
    return (
        <div className="flex gap-2 px-6 pt-4 pb-2">
            {[1, 2, 3].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-border-subtle'}`} />
            ))}
        </div>
    );
}

// ─── Scan overlay corners ──────────────────────────────────────────────────────
function ScanCorners({ active }: { active: boolean }) {
    const c = "absolute w-8 h-8 border-primary";
    return (
        <>
            <div className={`${c} top-4 left-4 border-t-4 border-l-4 rounded-tl-lg transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`} />
            <div className={`${c} top-4 right-4 border-t-4 border-r-4 rounded-tr-lg transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`} />
            <div className={`${c} bottom-4 left-4 border-b-4 border-l-4 rounded-bl-lg transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`} />
            <div className={`${c} bottom-4 right-4 border-b-4 border-r-4 rounded-br-lg transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`} />
        </>
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
    const videoRef  = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);

    // Scan loop
    const scanTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isAnalyzingRef  = useRef(false);
    const attemptCountRef = useRef(0);
    const MAX_ATTEMPTS    = 10; // ~25s
    const SCAN_INTERVAL   = 2500;

    // Scan UI state
    type ScanStatus = 'scanning' | 'detected' | 'failed' | 'manual';
    const [scanStatus, setScanStatus]       = useState<ScanStatus>('scanning');
    const [detectedName, setDetectedName]   = useState('');
    const [aiConfidence, setAiConfidence]   = useState<number | null>(null);
    const [aiSuccess, setAiSuccess]         = useState(false);

    // Step 2 — details
    const [price, setPrice]           = useState('');
    const [productName, setProductName] = useState('');
    const [trend, setTrend]           = useState<'promotion' | 'hausse' | null>('promotion');

    // Step 3 — store
    const [stores, setStores]               = useState<Store[]>([]);
    const [products, setProducts]           = useState<Product[]>([]);
    const [storeSearch, setStoreSearch]     = useState('');
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    // ── Camera helpers ─────────────────────────────────────────────────────────
    const stopCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    }, []);

    const stopScanLoop = useCallback(() => {
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
    }, []);

    const captureFrame = (): string | null => {
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return null;
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.75);
    };

    const startScanLoop = useCallback(() => {
        stopScanLoop();
        setScanStatus('scanning');
        attemptCountRef.current = 0;

        const tick = async () => {
            if (isAnalyzingRef.current) {
                scanTimerRef.current = setTimeout(tick, SCAN_INTERVAL);
                return;
            }

            if (attemptCountRef.current >= MAX_ATTEMPTS) {
                setScanStatus('failed');
                return;
            }

            attemptCountRef.current++;
            const frame = captureFrame();
            if (!frame) {
                scanTimerRef.current = setTimeout(tick, SCAN_INTERVAL);
                return;
            }

            isAnalyzingRef.current = true;
            try {
                const result = await analyzeProductImage(frame);
                const recognized = result.productName && result.productName !== 'Produit non identifié';

                if (recognized && result.confidence > 0.55) {
                    // ✅ Product detected — fill fields, advance
                    stopScanLoop();
                    setPhoto(frame);
                    setDetectedName(result.productName);
                    setProductName(result.productName);
                    setAiConfidence(result.confidence);
                    setAiSuccess(true);
                    if (result.price) {
                        const parsed = parseFloat(result.price.replace(',', '.').replace(/[^\d.]/g, ''));
                        if (!isNaN(parsed) && parsed > 0) setPrice(String(parsed));
                    }
                    setScanStatus('detected');
                    // Auto-advance after letting user see the result
                    setTimeout(() => { stopCamera(); setStep(2); }, 2000);
                } else {
                    scanTimerRef.current = setTimeout(tick, SCAN_INTERVAL);
                }
            } catch {
                scanTimerRef.current = setTimeout(tick, SCAN_INTERVAL);
            } finally {
                isAnalyzingRef.current = false;
            }
        };

        scanTimerRef.current = setTimeout(tick, 800);
    }, [stopScanLoop, stopCamera]);

    const startCamera = useCallback(async () => {
        setPhoto(null);
        setScanStatus('scanning');
        setDetectedName('');
        setAiSuccess(false);
        setAiConfidence(null);
        attemptCountRef.current = 0;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraActive(true);
            setTimeout(startScanLoop, 1000); // let camera stabilize
        } catch {
            setCameraActive(false);
            setScanStatus('manual');
        }
    }, [startScanLoop]);

    // Manual capture fallback
    const manualCapture = () => {
        const frame = captureFrame();
        if (!frame) return;
        stopScanLoop();
        stopCamera();
        setPhoto(frame);
        setScanStatus('manual');
        setAiSuccess(false);
        setAiConfidence(null);
    };

    useEffect(() => {
        if (step === 1) startCamera();
        return () => { stopScanLoop(); stopCamera(); };
    }, [step]); // eslint-disable-line

    // Step 3 — fetch data
    useEffect(() => {
        if (step !== 3) return;
        Promise.all([getStores(), getProducts()]).then(([s, p]) => { setStores(s); setProducts(p); });
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
            const matchedProduct = products.find(p =>
                p.name.toLowerCase().includes(productName.toLowerCase())
            ) || products[0];

            let location: { latitude: number; longitude: number } | undefined;
            try {
                const pos = await new Promise<GeolocationPosition>((res, rej) =>
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
                );
                location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            } catch { /* optional */ }

            await addPriceAndCalculateStats({
                productId: matchedProduct?.id || '',
                storeId: selectedStore.id,
                userId: user.uid,
                price: parseFloat(price),
                currency: 'MAD',
                sourceType: aiSuccess ? 'ai_photo' : 'manual',
                neighborhood: selectedStore.neighborhood || '',
                location,
            });
            setDone(true);
            setTimeout(() => router.push('/'), 2000);
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
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
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

            {/* Header */}
            <div className="bg-surface/90 backdrop-blur-xl px-4 py-3 border-b border-border-subtle flex items-center justify-between sticky top-0 z-20">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : router.push('/')}
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

                    {/* ══════════════════ STEP 1 — SCAN LIVE ════════════════════════════════ */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                            className="p-5 space-y-4"
                        >
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-foreground mb-1">
                                    {scanStatus === 'detected' ? '✨ Produit reconnu !' : 'Scanner le produit'}
                                </h3>
                                <p className="text-muted text-sm font-medium">
                                    {scanStatus === 'detected'
                                        ? 'Passage automatique à l\'étape suivante…'
                                        : 'Pointez la caméra vers le produit ou l\'étiquette'}
                                </p>
                            </div>

                            {/* ── Camera viewfinder ── */}
                            <div className="relative aspect-square w-full max-w-md mx-auto rounded-[28px] overflow-hidden bg-black">
                                {/* Video / photo */}
                                {photo && scanStatus === 'detected' ? (
                                    <img src={photo} alt="Capture" className="w-full h-full object-cover" />
                                ) : (
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                )}

                                {/* Dark overlay when not active */}
                                {!cameraActive && !photo && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
                                        <ScanLine className="w-10 h-10 text-white opacity-40" />
                                        <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Caméra inactive</span>
                                    </div>
                                )}

                                {/* Scan corners */}
                                {cameraActive && scanStatus !== 'detected' && (
                                    <ScanCorners active={scanStatus === 'scanning'} />
                                )}

                                {/* Scanning line animation */}
                                {cameraActive && scanStatus === 'scanning' && (
                                    <motion.div
                                        animate={{ y: ['0%', '85%', '0%'] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                        className="absolute left-4 right-4 h-0.5 bg-primary/70 shadow-[0_0_8px_2px_rgba(0,208,132,0.4)]"
                                        style={{ top: '7%' }}
                                    />
                                )}

                                {/* Detected overlay */}
                                {scanStatus === 'detected' && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="absolute inset-0 bg-primary/20 flex flex-col items-center justify-end pb-6"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: 'spring', stiffness: 300 }}
                                            className="bg-primary text-white px-5 py-3 rounded-2xl shadow-xl max-w-[85%] text-center"
                                        >
                                            <p className="font-black text-sm truncate">{detectedName}</p>
                                            <p className="text-[11px] opacity-75 mt-0.5">
                                                Confiance {Math.round((aiConfidence ?? 0) * 100)}%
                                            </p>
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* Manual capture button */}
                                {cameraActive && scanStatus !== 'detected' && (
                                    <button
                                        onClick={manualCapture}
                                        className="absolute bottom-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-full flex items-center justify-center transition-all active:scale-90"
                                        title="Capture manuelle"
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full" />
                                    </button>
                                )}
                            </div>

                            <canvas ref={canvasRef} className="hidden" />

                            {/* Status badge */}
                            <AnimatePresence mode="wait">
                                {scanStatus === 'scanning' && (
                                    <motion.div
                                        key="scanning"
                                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-3 bg-primary/8 border border-primary/20 rounded-2xl px-5 py-3"
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ duration: 1.2, repeat: Infinity }}
                                            className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0"
                                        />
                                        <div>
                                            <p className="text-sm font-black text-primary">Scan IA en cours…</p>
                                            <p className="text-[10px] text-muted mt-0.5">
                                                Tentative {attemptCountRef.current}/{MAX_ATTEMPTS} · Gemini analyse chaque image
                                            </p>
                                        </div>
                                        <Loader2 className="w-4 h-4 text-primary animate-spin ml-auto flex-shrink-0" />
                                    </motion.div>
                                )}

                                {scanStatus === 'detected' && (
                                    <motion.div
                                        key="detected"
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                        className="flex items-center gap-3 bg-primary text-white rounded-2xl px-5 py-4"
                                    >
                                        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-sm">✨ Produit reconnu !</p>
                                            <p className="text-[11px] opacity-75 truncate mt-0.5">{detectedName}</p>
                                        </div>
                                        <span className="bg-white/20 text-white text-[11px] font-black px-2 py-1 rounded-lg flex-shrink-0">
                                            {Math.round((aiConfidence ?? 0) * 100)}%
                                        </span>
                                    </motion.div>
                                )}

                                {scanStatus === 'failed' && (
                                    <motion.div
                                        key="failed"
                                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3"
                                    >
                                        <ScanLine className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-amber-700">Produit non détecté</p>
                                            <p className="text-[10px] text-amber-600 mt-0.5">Appuyez sur ⚪ pour capturer manuellement</p>
                                        </div>
                                    </motion.div>
                                )}

                                {scanStatus === 'manual' && photo && (
                                    <motion.div
                                        key="manual"
                                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 bg-surface border border-border-subtle rounded-2xl px-5 py-3"
                                    >
                                        <ScanLine className="w-5 h-5 text-muted flex-shrink-0" />
                                        <p className="text-sm font-bold text-muted">Photo capturée — remplissez manuellement</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Actions */}
                            {(scanStatus === 'failed' || scanStatus === 'manual') && photo && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setPhoto(null); startCamera(); }}
                                        className="flex-1 py-3.5 rounded-full border-2 border-border-subtle font-bold text-sm text-muted hover:border-foreground transition-all"
                                    >
                                        Réessayer
                                    </button>
                                    <button
                                        onClick={() => { stopCamera(); setStep(2); }}
                                        className="flex-1 py-3.5 rounded-full bg-primary text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                    >
                                        Continuer <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {scanStatus !== 'detected' && (
                                <button
                                    onClick={() => { stopScanLoop(); stopCamera(); setStep(2); }}
                                    className="w-full py-3 text-muted text-sm font-bold hover:text-primary transition-colors"
                                >
                                    Passer cette étape
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* ══════════════════ STEP 2 — DÉTAILS ══════════════════════════════════ */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                            className="p-6 space-y-8 max-w-lg mx-auto w-full"
                        >
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-foreground mb-1">Les détails du prix</h3>
                                <p className="text-muted text-sm font-medium">Saisissez le prix observé avec précision.</p>
                            </div>

                            {/* Price input */}
                            <div className="relative">
                                <label className="text-[11px] font-black text-muted uppercase tracking-widest absolute -top-2.5 left-6 px-2 bg-bg-app flex items-center gap-2">
                                    Prix en Dirham
                                    {price && aiSuccess && (
                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-primary flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> IA
                                        </motion.span>
                                    )}
                                </label>
                                <motion.input
                                    animate={price && aiSuccess ? { borderColor: 'var(--color-primary)' } : {}}
                                    type="number" step="0.1" inputMode="decimal" autoFocus placeholder="00.00"
                                    value={price} onChange={e => setPrice(e.target.value)}
                                    className="w-full px-8 py-6 rounded-[24px] border-2 border-border-subtle bg-surface focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-black text-4xl text-center text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>

                            {/* Product name */}
                            <div className="relative">
                                <label className="text-[11px] font-black text-muted uppercase tracking-widest absolute -top-2.5 left-6 px-2 bg-bg-app flex items-center gap-2">
                                    Nom du produit
                                    {productName && aiSuccess && (
                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-primary flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> IA
                                        </motion.span>
                                    )}
                                </label>
                                <motion.input
                                    animate={productName && aiSuccess ? { borderColor: 'var(--color-primary)' } : {}}
                                    type="text" placeholder="Ex: Coca-Cola 1.5L, Lait Centrale..."
                                    value={productName} onChange={e => setProductName(e.target.value)}
                                    className="w-full px-6 py-4 rounded-[20px] border-2 border-border-subtle bg-surface focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold text-foreground placeholder:text-muted"
                                />
                            </div>

                            {/* Trend */}
                            <div>
                                <p className="text-[11px] font-black text-muted uppercase tracking-widest mb-3">Tendance du prix</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { val: 'promotion' as const, icon: TrendingDown, label: 'Promotion / Bas', activeClass: 'border-primary bg-primary/10 text-primary' },
                                        { val: 'hausse' as const, icon: TrendingUp, label: 'Prix en hausse', activeClass: 'border-red-400 bg-red-50 text-red-500' },
                                    ].map(({ val, icon: Icon, label, activeClass }) => (
                                        <button key={val} onClick={() => setTrend(val)}
                                            className={`p-4 rounded-[20px] border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${trend === val ? activeClass : 'border-border-subtle text-muted hover:border-primary/40'}`}
                                        >
                                            <Icon className="w-6 h-6" /> {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => setStep(3)} disabled={!price}
                                className="w-full py-5 rounded-full bg-primary text-white font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/30 disabled:opacity-40 transition-all"
                            >
                                Étape suivante <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}

                    {/* ══════════════════ STEP 3 — HANOUT ═══════════════════════════════════ */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                            className="p-6 space-y-6 max-w-lg mx-auto w-full"
                        >
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-foreground mb-1">Choisir le Hanout</h3>
                                <p className="text-muted text-sm font-medium">Indiquez où vous avez trouvé ce prix.</p>
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input type="text" placeholder="Rechercher un Hanout..." value={storeSearch}
                                    onChange={e => setStoreSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-full border border-border-subtle bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm font-medium text-foreground placeholder:text-muted"
                                />
                            </div>

                            <div className="space-y-3 max-h-[55vh] overflow-y-auto no-scrollbar pb-4">
                                {filteredStores.map(store => (
                                    <button key={store.id} onClick={() => setSelectedStore(store)}
                                        className={`w-full p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedStore?.id === store.id ? 'border-primary bg-primary/5' : 'border-border-subtle bg-surface hover:border-primary/30'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-surface border border-border-subtle rounded-xl flex items-center justify-center text-xl flex-shrink-0">🏪</div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-foreground text-sm">{store.name}</h4>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3 text-muted" />
                                                    <p className="text-[10px] font-bold text-muted uppercase tracking-wide">{store.neighborhood || store.address}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedStore?.id === store.id && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                                    </button>
                                ))}
                                {filteredStores.length === 0 && stores.length > 0 && (
                                    <p className="text-center text-muted text-sm py-6">Aucun Hanout trouvé</p>
                                )}
                                {stores.length === 0 && Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="h-16 bg-surface rounded-2xl animate-pulse" />
                                ))}
                                <Link href="/add/store" className="w-full p-4 border-2 border-dashed border-primary/20 rounded-2xl text-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
                                    <Plus className="w-4 h-4" /> Créer un nouveau Hanout
                                </Link>
                            </div>

                            <button onClick={handleSubmit} disabled={submitting || !selectedStore}
                                className="w-full py-5 rounded-full bg-foreground text-background font-black flex items-center justify-center gap-3 shadow-xl overflow-hidden relative group disabled:opacity-40 transition-all"
                            >
                                <span className="relative z-10">{submitting ? 'Publication...' : 'Publier le prix'}</span>
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
