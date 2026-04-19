"use client";

import { Store } from "@/types";
import { MapPin, Navigation } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function StoreCard({ store }: { store: Store }) {
    const { t } = useLanguage();

    return (
        <div className="glass-card p-4 rounded-3xl border border-emerald-primary/10 flex items-center justify-between active:scale-[0.98] transition-all group hover:border-emerald-primary/30 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-primary/10 text-emerald-primary rounded-2xl flex items-center justify-center border border-emerald-primary/20 group-hover:scale-110 transition-transform">
                    <MapPin size={26} />
                </div>
                <div>
                    <h4 className="font-bold text-foreground text-sm tracking-tight">{store.name}</h4>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{store.address}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-accent animate-pulse"></div>
                        <span className="text-[9px] font-black text-emerald-accent uppercase tracking-tighter">{t('hanoutOuvert')}</span>
                    </div>
                </div>
            </div>
            <button
                aria-label={t('itineraire')}
                title={t('itineraire')}
                className="p-3 text-emerald-primary bg-emerald-primary/5 rounded-2xl border border-emerald-primary/10 hover:bg-emerald-primary hover:text-white transition-all shadow-sm"
            >
                <Navigation size={18} />
            </button>
        </div>
    );
}
