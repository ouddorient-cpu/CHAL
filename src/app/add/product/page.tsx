"use client";

import { useAuth } from "@/context/AuthContext";
import { addProduct, getStores, addStore, addPriceAndCalculateStats } from "@/services/dataService";
import { Unit, Store } from "@/types";
import { ArrowLeft, Camera, Check, Tag, Package, Barcode, ChevronRight, Sparkles, RefreshCcw, Store as StoreIcon, Search, MapPin, MapPinned, LocateFixed, SlidersHorizontal, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { getCameraStream, stopStream, captureFrame } from "@/services/cameraService";
import { analyzeProductImage } from "@/services/aiService";
import { MEKNES_NEIGHBORHOODS } from "@/lib/constants";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function AddProductPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { t, lang } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [analysisStep, setAnalysisStep] = useState("");
    const [cameraAvailable, setCameraAvailable] = useState(true);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [flashActive, setFlashActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [stores, setStores] = useState<Store[]>([]);
    const [storeSearchQuery, setStoreSearchQuery] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        brand: "",
        category: "Épicerie",
        unit: "pièce" as Unit,
        barcode: "",
        price: "",
        neighborhood: "",
        selectedStore: null as Store | null,
        customStoreName: "",
    });

    const [detectedLocation, setDetectedLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    useEffect(() => {
        // Handle AI detection results from Scanner
        const urlParams = new URLSearchParams(window.location.search);
        const detectedData = urlParams.get('detected');
        if (detectedData) {
            try {
                const result = JSON.parse(decodeURIComponent(detectedData));
                setFormData(prev => ({
                    ...prev,
                    name: result.name || "",
                    brand: result.brand || "",
                    price: result.price?.toString() || ""
                }));
            } catch (e) {
                console.error("CH7AL: Failed to parse detected data", e);
            }
        }

        startCamera();
        fetchStores();
        return () => stopStream(streamRef.current);
    }, []);

    const fetchStores = async () => {
        try {
            const s = await getStores();
            setStores(s);
        } catch (err) {
            console.error(err);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await getCameraStream();
            streamRef.current = stream;
            setCapturedImage(null);
            setCameraAvailable(true);

            // Wait for next render so videoRef is mounted, then assign stream
            await new Promise<void>(resolve => setTimeout(resolve, 50));

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                try {
                    await videoRef.current.play();
                } catch (playErr) {
                    console.warn("Camera: play() failed, autoPlay should handle it", playErr);
                }
            }
        } catch (err) {
            console.warn("Camera fallback triggered:", err);
            setCameraAvailable(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            setCapturedImage(base64);
            setIsCapturing(true);

            // Trigger AI analysis on uploaded file
            try {
                setAnalysisStep(t('analyseFichier'));
                const result = await analyzeProductImage(base64);
                if (result.confidence >= 0.3) {
                    setFormData(prev => ({
                        ...prev,
                        name: result.productName,
                        brand: result.brand,
                        category: (result.category as any) || prev.category,
                        price: result.price || prev.price
                    }));
                } else {
                    console.warn("CH7AL AI: confidence trop faible sur fichier importé", result.confidence);
                }
            } catch (err) {
                console.error("AI Analysis failed:", err);
            } finally {
                setIsCapturing(false);
                setAnalysisStep("");
            }
        };
        reader.readAsDataURL(file);
    };

    const handleCapture = async () => {
        if (!videoRef.current) return;

        // Countdown 3 → 2 → 1 before capture
        for (let i = 3; i >= 1; i--) {
            setCountdown(i);
            await new Promise<void>(resolve => setTimeout(resolve, 1000));
        }
        setCountdown(null);

        // Wait 600ms: lets the camera autofocus and stabilize exposure
        // Critical for sharp, well-exposed image before sending to AI
        await new Promise<void>(resolve => setTimeout(resolve, 600));

        // Flash effect
        setFlashActive(true);
        await new Promise<void>(resolve => setTimeout(resolve, 150));
        setFlashActive(false);

        const frame = captureFrame(videoRef.current);
        if (frame) {
            setCapturedImage(frame);
            setIsCapturing(true);
            stopStream(streamRef.current);

            const steps = [t('analyseVision'), t('detectionProduit'), t('extractionMarque'), t('finalisation')];
            let stepIdx = 0;
            const stepInterval = setInterval(() => {
                setAnalysisStep(steps[stepIdx % steps.length]);
                stepIdx++;
            }, 700);

            try {
                const result = await analyzeProductImage(frame);
                clearInterval(stepInterval);

                if (result.confidence >= 0.3) {
                    setFormData(prev => ({
                        ...prev,
                        name: result.productName,
                        brand: result.brand,
                        category: (result.category as any) || prev.category,
                        price: result.price || prev.price
                    }));
                } else {
                    console.warn("CH7AL AI: confidence trop faible", result.confidence);
                    setAnalysisStep(t('produitNonReconnu'));
                    setTimeout(() => setAnalysisStep(""), 2500);
                }

                setIsCapturing(false);
                if (result.confidence >= 0.3) setAnalysisStep("");
            } catch (err) {
                clearInterval(stepInterval);
                console.error("AI Analysis failed:", err);
                setIsCapturing(false);
                setAnalysisStep(t('echecAnalyse'));
            }
        }
    };

    const handleGetLocation = async () => {
        setIsDetectingLocation(true);
        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                })
            );
            setDetectedLocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            });
        } catch (err) {
            console.error("CH7AL: Geolocation error", err);
            alert(t('erreurPosition'));
        } finally {
            setIsDetectingLocation(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("CH7AL: Tentative de publication...", formData);

        if (!user) return alert(t('alertNonConnecte'));
        if (!formData.name) return alert(t('alertNomProduit'));
        if (!formData.selectedStore && !formData.customStoreName) return alert(t('alertSelectHanout'));
        if (!formData.price) return alert(t('alertSaisirPrix'));

        setLoading(true);
        try {
            // 1. Handle Store (Select or Create)
            let storeId = "";
            let neighborhood = formData.neighborhood;

            if (formData.selectedStore) {
                storeId = formData.selectedStore.id;
                neighborhood = neighborhood || formData.selectedStore.neighborhood || "";
            } else {
                // Create a temporary store entry
                const newStore = await addStore({
                    name: formData.customStoreName,
                    address: "Meknès",
                    city: "Meknès",
                    createdBy: user.uid,
                    neighborhood: formData.neighborhood || "Meknès"
                });
                storeId = newStore.id;
                neighborhood = formData.neighborhood || "Meknès";
            }

            // 2. Detect Geolocation
            let location = detectedLocation || undefined;
            if (!location) {
                try {
                    const pos = await new Promise<GeolocationPosition>((res, rej) =>
                        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
                    );
                    location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                } catch (e) {
                    console.warn("CH7AL: Geolocation failed", e);
                }
            }

            // 3. Create Product
            const productRef = await addProduct({
                name: formData.name,
                brand: formData.brand,
                category: formData.category,
                unit: formData.unit,
                barcode: formData.barcode,
                imageUrl: capturedImage || `https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400`
            }, user.uid);

            // 4. Create First Price Contribution
            await addPriceAndCalculateStats({
                productId: productRef.id,
                storeId: storeId,
                userId: user.uid,
                price: parseFloat(formData.price),
                currency: "MAD",
                sourceType: "ai_photo",
                neighborhood: neighborhood,
                location: location,
            });

            setDone(true);
            setTimeout(() => router.push("/"), 2500);
        } catch (error) {
            console.error(error);
            alert(t('erreurAjoutComplet'));
        } finally {
            setLoading(false);
        }
    };

    const filteredStores = stores.filter(s =>
        s.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(storeSearchQuery.toLowerCase())
    );

    if (done) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background animate-fade-in">
                <div className="bg-emerald-primary text-white p-6 rounded-[2.5rem] mb-8 animate-bounce shadow-2xl shadow-emerald-primary/20">
                    <Check size={48} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-black text-foreground mb-2 tracking-tighter uppercase font-sans">{t('produitPrixAjoutes')}</h2>
                <p className="text-muted font-bold uppercase text-[10px] tracking-[0.3em] mb-8">{t('contributionDirect')}</p>

                <button
                    onClick={() => router.push("/")}
                    className="bg-card px-8 py-4 rounded-2xl shadow-sm border border-border-subtle font-black text-xs uppercase tracking-widest text-emerald-primary active:scale-95 transition-all"
                >
                    {t('voirMonArticle')}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background font-sans">
            {/* Custom Header */}
            <div className="bg-background/90 backdrop-blur-xl px-6 py-5 border-b border-border-faint flex items-center justify-between sticky top-0 z-40">
                <button
                    onClick={() => router.back()}
                    title={t('retour')}
                    className="text-muted p-2 hover:bg-surface rounded-2xl transition-all active:scale-90"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="font-black text-lg tracking-tight text-foreground uppercase">
                        {t('nouveauProduit')}
                    </h1>
                </div>
                <div className="w-10"></div>
            </div>

            <main className="flex-1 p-4 max-w-lg mx-auto w-full relative">
                <form onSubmit={handleSubmit} className="space-y-6 pb-24">

                    {/* Camera / Capture Section */}
                    <div className="space-y-4">
                        {!capturedImage && cameraAvailable && (
                            <p className="text-center text-[10px] font-black text-muted uppercase tracking-widest">
                                {t('cadrezProduit')}
                            </p>
                        )}

                        <div className="relative aspect-video bg-[#111] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-border-faint">
                            {capturedImage ? (
                                <img src={capturedImage} className="w-full h-full object-cover" alt="Capture" />
                            ) : cameraAvailable ? (
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[#1a1a1a]">
                                    <div className="bg-[#2a2a2a] p-4 rounded-full">
                                        <Camera size={32} className="text-neutral-500" />
                                    </div>
                                    <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                        {t('accesCamera')}<br />({t('localhostRequis')})
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-emerald-primary/20 text-emerald-primary px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-primary/10"
                                    >
                                        {t('importerPhoto')}
                                    </button>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                title={t('galerie')}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />

                            {/* Viewfinder corners */}
                            {!capturedImage && cameraAvailable && !countdown && !isCapturing && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-52 h-36 relative">
                                        <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg"></span>
                                        <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg"></span>
                                        <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg"></span>
                                        <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg"></span>
                                    </div>
                                </div>
                            )}

                            {flashActive && <div className="absolute inset-0 bg-white z-30 pointer-events-none" />}

                            {countdown !== null && (
                                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                    <div className="w-24 h-24 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border-4 border-white/40">
                                        <span className="text-white font-black text-5xl">{countdown}</span>
                                    </div>
                                </div>
                            )}

                            {!capturedImage && cameraAvailable && !countdown && !isCapturing && (
                                <button
                                    type="button"
                                    onClick={handleCapture}
                                    title={t('prendrePhoto')}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 transition-all active:scale-90"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-white/60">
                                        <div className="w-11 h-11 rounded-full bg-white border-2 border-neutral-300 flex items-center justify-center">
                                            <Camera size={20} className="text-emerald-primary" />
                                        </div>
                                    </div>
                                </button>
                            )}

                            {capturedImage && !isCapturing && (
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 active:scale-90 transition-all z-10"
                                >
                                    <RefreshCcw size={14} className="inline mr-2" /> {t('reprendre')}
                                </button>
                            )}

                            {isCapturing && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                                    <div className="w-14 h-14 border-4 border-emerald-primary/30 border-t-emerald-primary rounded-full animate-spin"></div>
                                    <p className="text-white text-[10px] font-black uppercase tracking-[0.3em]">{analysisStep}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Details Card */}
                    <div className="bg-card rounded-3xl p-6 shadow-xl shadow-emerald-900/5 relative overflow-hidden border border-border-subtle">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-accent"></div>
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles size={18} className="text-emerald-primary" />
                            <span className="text-[10px] font-black text-emerald-primary uppercase tracking-[0.2em]">{t('ficheProduit')}</span>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-muted uppercase tracking-widest">{t('nom')}</p>
                                    <input
                                        aria-label={t('nom')}
                                        placeholder="Ex: Lait Centrale"
                                        className="w-full bg-transparent border-b border-border-subtle py-1 text-sm font-black focus:border-emerald-primary outline-none transition-all text-foreground placeholder:text-muted/50"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-muted uppercase tracking-widest">{t('marque')}</p>
                                    <input
                                        aria-label={t('marque')}
                                        placeholder="Ex: Centrale"
                                        className="w-full bg-transparent border-b border-border-subtle py-1 text-sm font-black focus:border-emerald-primary outline-none transition-all text-foreground placeholder:text-muted/50"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-muted uppercase tracking-widest leading-none mb-1">{t('categorie')}</p>
                                    <div className="relative">
                                        <select
                                            aria-label={t('categorie')}
                                            className="w-full bg-surface-2/50 border border-border-faint rounded-xl py-3 px-4 text-xs font-black appearance-none outline-none text-foreground focus:border-emerald-primary transition-all"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {['epicerie', 'cremerie', 'boissons', 'hygiene', 'entretien', 'autres'].map(key => (
                                                <option key={key} value={t(key as any)}>{t(key as any)}</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-muted rotate-90 pointer-events-none" size={14} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-muted uppercase tracking-widest leading-none mb-1">Quartier (Meknès)</p>
                                    <div className="relative">
                                        <select
                                            aria-label="Quartier"
                                            className="w-full bg-surface-2/50 border border-border-faint rounded-xl py-3 px-4 text-xs font-black appearance-none outline-none text-foreground focus:border-emerald-primary transition-all scrollbar-none"
                                            value={formData.neighborhood}
                                            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                        >
                                            <option value="">-- {lang === 'fr' ? 'Choisir' : 'اختر'} --</option>
                                            {MEKNES_NEIGHBORHOODS.map(n => (
                                                <option key={n} value={n}>{n}</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-muted rotate-90 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Price Input Section */}
                    <div className="flex flex-col items-center gap-4 py-8 bg-card rounded-3xl border border-border-subtle shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-primary"></div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">{t('prixObserve')}</p>
                        <div className="flex items-baseline gap-3">
                            <input
                                type="number"
                                step="0.01"
                                className="bg-transparent text-6xl font-black text-emerald-primary text-center w-full max-w-[200px] outline-none placeholder:text-emerald-primary/10"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                            <span className="text-xl font-black text-emerald-primary/40 italic">DH</span>
                        </div>
                    </div>

                    {/* Geolocation Section */}
                    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border-subtle">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                                <LocateFixed size={12} className="text-emerald-primary" /> {t('geolocalisation')}
                            </label>
                            {detectedLocation && (
                                <span className="text-[8px] font-black text-emerald-primary bg-emerald-primary/10 px-2 py-0.5 rounded-full uppercase">{t('precis')}</span>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={isDetectingLocation}
                            className={`w-full py-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98] ${detectedLocation
                                ? 'border-emerald-primary/30 bg-emerald-primary/5 text-emerald-primary'
                                : 'border-border-subtle bg-surface text-muted'
                                }`}
                        >
                            {isDetectingLocation ? (
                                <RefreshCcw size={20} className="animate-spin text-emerald-primary" />
                            ) : detectedLocation ? (
                                <>
                                    <MapPinned size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t('positionCapturee')}</span>
                                    <span className="text-[8px] font-bold opacity-60 tracking-tighter">
                                        {detectedLocation.latitude.toFixed(4)}, {detectedLocation.longitude.toFixed(4)}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <MapPin size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t('activerPosition')}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Store Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={12} className="text-emerald-primary" /> {t('nomHanout')}
                            </label>
                            <span className="w-1.5 h-1.5 bg-emerald-accent rounded-full animate-pulse"></span>
                        </div>

                        {/* Custom Hanout Input */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <StoreIcon size={16} className="text-muted group-focus-within:text-emerald-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder={lang === 'fr' ? "Nom d'un nouveau hanout..." : "اسم حانوت جديد..."}
                                className="w-full bg-card border border-border-faint rounded-2xl py-4 pl-12 pr-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-primary/20 focus:border-emerald-primary transition-all text-foreground placeholder:text-muted/50"
                                value={formData.customStoreName}
                                onChange={(e) => setFormData({ ...formData, customStoreName: e.target.value, selectedStore: null })}
                            />
                        </div>

                        <div className="grid gap-2">
                            {filteredStores.slice(0, 3).map(s => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, selectedStore: s, customStoreName: "" })}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${formData.selectedStore?.id === s.id
                                        ? 'bg-emerald-primary/10 border-emerald-primary/30 shadow-sm'
                                        : 'bg-card border-border-faint hover:border-emerald-primary/20'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.selectedStore?.id === s.id ? 'bg-emerald-primary text-white' : 'bg-surface text-muted'}`}>
                                        <StoreIcon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-xs text-foreground leading-none">{s.name}</h4>
                                        <p className="text-[9px] text-muted font-bold mt-1 uppercase tracking-tighter">{s.neighborhood} - {s.address}</p>
                                    </div>
                                    {formData.selectedStore?.id === s.id && <Check size={16} className="text-emerald-primary" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pb-32">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-primary text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-primary/20 active:scale-95 transition-all disabled:opacity-50 border-t border-white/20 flex items-center justify-center group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {t('publierPrix')} <Check className="ml-2 group-hover:scale-125 transition-transform" size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
