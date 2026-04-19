"use client";

import { useEffect, useState } from "react";
import {
    ArrowRight,
    Megaphone,
    Camera,
    CheckCircle,
    TrendingDown,
    MapPin,
    Tag,
    Smartphone,
    Shirt,
    MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";



// ── Slide Illustrations (pure JSX, no external images) ────────────

function Slide0Illustration() {
    return (
        <div className="relative w-52 h-52 mx-auto flex items-center justify-center">
            <div className="absolute -inset-10 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="w-40 h-40 bg-emerald-primary rounded-full flex items-center justify-center shadow-2xl shadow-emerald-primary/30 relative z-10">
                <div className="text-white text-center">
                    <span className="font-black text-3xl tracking-tight">CH7AL</span>
                    <p className="text-[10px] font-black tracking-[0.3em] opacity-80 uppercase mt-0.5">Hanouti</p>
                </div>
            </div>
            <div className="absolute -top-1 -right-1 bg-white rounded-2xl px-3 py-2 shadow-xl border border-border-subtle z-20 rotate-3">
                <span className="text-xs font-black text-emerald-primary">3.50 DH</span>
            </div>
            <div className="absolute -bottom-2 -left-4 bg-white rounded-2xl px-3 py-2 shadow-xl border border-border-subtle z-20 -rotate-2">
                <span className="text-xs font-black text-foreground">Lait 1L</span>
            </div>
            <div className="absolute top-6 -left-6 bg-emerald-primary/10 rounded-2xl px-3 py-1.5 border border-emerald-primary/20 z-20">
                <span className="text-[10px] font-black text-emerald-primary">Meknès</span>
            </div>
            <div className="absolute bottom-8 -right-5 bg-surface rounded-2xl px-3 py-1.5 border border-border-faint z-20 rotate-1">
                <span className="text-[10px] font-black text-muted">Hamria</span>
            </div>
        </div>
    );
}

function Slide1Illustration() {
    return (
        <div className="relative mx-auto" style={{ width: 176, height: 288 }}>
            <div className="w-full h-full bg-foreground rounded-[2.5rem] p-2.5 shadow-2xl border-4 border-foreground relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-foreground rounded-b-2xl z-10" />
                <div className="w-full h-full bg-[#fefcf8] rounded-[2rem] overflow-hidden flex flex-col">
                    <div className="bg-white px-3 py-2.5 border-b border-border-faint flex items-center justify-between flex-shrink-0">
                        <TrendingDown size={11} className="text-emerald-primary" />
                        <span className="text-[6px] font-black text-foreground uppercase tracking-widest">Comparatif Prix</span>
                        <MapPin size={11} className="text-muted" />
                    </div>
                    <div className="flex gap-1 px-2 py-1.5 overflow-hidden flex-shrink-0">
                        <span className="bg-emerald-primary text-white text-[5px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter whitespace-nowrap">Tout</span>
                        <span className="bg-surface text-muted text-[5px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter whitespace-nowrap">Épicerie</span>
                        <span className="bg-surface text-muted text-[5px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter whitespace-nowrap">Boissons</span>
                    </div>
                    <div className="flex-1 overflow-hidden space-y-1 px-2 pb-2">
                        {[
                            { name: "Pain 200g", price: "1.50", low: true },
                            { name: "Lait UHT 1L", price: "7.50", low: false },
                            { name: "Huile d'Olive", price: "18.00", low: true },
                            { name: "Eau Sidi Ali", price: "3.00", low: false },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1.5 border border-border-faint">
                                <div className="w-5 h-5 bg-surface rounded-md flex-shrink-0" />
                                <span className="text-[6px] font-black text-foreground flex-1 leading-tight">{item.name}</span>
                                <span className={`text-[7px] font-black flex-shrink-0 ${item.low ? 'text-emerald-primary' : 'text-foreground'}`}>{item.price} DH</span>
                            </div>
                        ))}
                        <div className="bg-emerald-primary/10 rounded-lg px-2 py-1.5 mt-0.5">
                            <span className="text-[5.5px] font-black text-emerald-primary uppercase leading-tight block">
                                ↓ Meilleur prix: Hanout Sidi Baba
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Slide2Illustration() {
    return (
        <div className="space-y-3 mx-auto" style={{ maxWidth: 200 }}>
            <div className="relative w-28 h-28 mx-auto">
                <div className="w-full h-full rounded-[1.8rem] bg-[#111] flex items-center justify-center border-4 border-white/80 shadow-2xl">
                    <Camera size={28} className="text-white/50" />
                    <span className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-lg" />
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-lg" />
                    <span className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-lg" />
                    <span className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-lg" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <div className="w-5 h-5 bg-white rounded-full" />
                </div>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-lg border border-border-subtle space-y-1.5">
                {["Nom du produit...", "Prix en DH...", "Hanout..."].map((ph, i) => (
                    <div key={i} className="bg-surface rounded-xl px-3 py-2">
                        <span className="text-[8px] text-faint font-bold">{ph}</span>
                    </div>
                ))}
                <div className="bg-emerald-primary rounded-xl px-3 py-2 flex items-center justify-center gap-1.5">
                    <CheckCircle size={10} className="text-white" />
                    <span className="text-[8px] text-white font-black uppercase tracking-widest">Publier</span>
                </div>
            </div>
        </div>
    );
}

function Slide3Illustration() {
    return (
        <div className="relative mx-auto" style={{ width: 200, height: 210 }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-violet-500 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30 z-10">
                <Megaphone size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute bg-white rounded-2xl p-3 shadow-xl border border-border-subtle" style={{ top: 56, left: 0, width: 130 }}>
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Smartphone size={14} className="text-blue-500" />
                    </div>
                    <span className="text-[8px] font-black text-foreground leading-tight">iPhone XS Max</span>
                </div>
                <span className="text-[11px] font-black text-emerald-primary">1 200 DH</span>
                <div className="mt-1.5 bg-emerald-primary/10 rounded-lg px-2 py-1 flex items-center gap-1">
                    <MessageCircle size={8} className="text-emerald-primary" />
                    <span className="text-[7px] font-black text-emerald-primary uppercase tracking-tight">WhatsApp</span>
                </div>
            </div>
            <div className="absolute bg-white rounded-2xl p-3 shadow-xl border border-border-subtle" style={{ bottom: 0, right: 0, width: 130 }}>
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 bg-pink-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shirt size={14} className="text-pink-500" />
                    </div>
                    <span className="text-[8px] font-black text-foreground leading-tight">Veste Nike L</span>
                </div>
                <span className="text-[11px] font-black text-emerald-primary">Gratuit</span>
                <div className="mt-1.5 bg-violet-100 rounded-lg px-2 py-1 flex items-center gap-1">
                    <Tag size={8} className="text-violet-500" />
                    <span className="text-[7px] font-black text-violet-500 uppercase tracking-tight">Don</span>
                </div>
            </div>
        </div>
    );
}

const illustrations = [
    <Slide0Illustration key="s0" />,
    <Slide1Illustration key="s1" />,
    <Slide2Illustration key="s2" />,
    <Slide3Illustration key="s3" />,
];

export default function Onboarding() {
    const router = useRouter();
    const { t } = useLanguage();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [animating, setAnimating] = useState(false);

    const slideData = [
        {
            title: t('bienvenueTitle'),
            description: t('bienvenueDesc'),
            bgFrom: "from-emerald-400/20",
            bgTo: "to-emerald-600/10",
        },
        {
            title: t('parcourezTitle'),
            description: t('parcourezDesc'),
            bgFrom: "from-blue-400/15",
            bgTo: "to-emerald-400/10",
        },
        {
            title: t('partagezTitle'),
            description: t('partagezDesc'),
            bgFrom: "from-amber-400/15",
            bgTo: "to-emerald-400/10",
        },
        {
            title: t('annoncesTitle'),
            description: t('annoncesDesc'),
            bgFrom: "from-violet-400/15",
            bgTo: "to-pink-400/10",
        },
    ];

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
        if (!hasSeenOnboarding) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (animating) return;
        if (currentSlide < slideData.length - 1) {
            setAnimating(true);
            setTimeout(() => {
                setCurrentSlide(s => s + 1);
                setAnimating(false);
            }, 180);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        localStorage.setItem("hasSeenOnboarding", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const slide = slideData[currentSlide];

    return (
        <div className="fixed inset-0 z-[100] bg-[#fefcf8] flex flex-col overflow-hidden">
            {/* Per-slide gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgFrom} via-transparent ${slide.bgTo} pointer-events-none transition-all duration-700`} />

            {/* Skip button */}
            <div className="relative z-10 flex justify-end px-6 pt-5">
                <button
                    onClick={handleComplete}
                    className="text-muted text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-3 rounded-xl hover:text-foreground transition-colors active:scale-95"
                >
                    {t('passer')}
                </button>
            </div>

            {/* Illustration */}
            <div className={`flex-1 flex items-center justify-center px-6 transition-all duration-200 ${animating ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
                {illustrations[currentSlide]}
            </div>

            {/* Text */}
            <div className={`px-8 pb-2 text-center space-y-3 transition-all duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>
                <h2 className="text-3xl font-black text-foreground tracking-tight leading-[1.1]">
                    {slide.title}
                </h2>
                <p className="text-muted leading-relaxed font-bold text-sm px-2">
                    {slide.description}
                </p>
            </div>

            {/* Bottom bar */}
            <div className="relative z-10 w-full p-8 pb-10 space-y-6 bg-[#fefcf8]/80 backdrop-blur-xl border-t border-border-faint mt-4">
                {/* Dot indicators */}
                <div className="flex justify-center gap-2">
                    {slideData.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => !animating && setCurrentSlide(i)}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-emerald-primary' : 'w-2 bg-border-subtle'}`}
                        />
                    ))}
                </div>

                {/* CTA */}
                <button
                    onClick={handleNext}
                    className="w-full bg-emerald-primary text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-emerald-900/20 flex items-center justify-center gap-3 active:scale-95 hover:brightness-110 transition-all text-base uppercase tracking-[0.12em] border-t border-white/20"
                >
                    {currentSlide === slideData.length - 1 ? t('decouvrirCH7AL') : t('continuer')}
                    <ArrowRight size={22} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
