"use client";

import Header from "@/components/layout/Header";
import { MapPin, Plus, Tag } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { TranslationKey } from "@/lib/translations";

export default function AddPage() {
    const { t } = useLanguage();

    const actions: { titleKey: TranslationKey; descKey: TranslationKey; icon: typeof Tag; href: string; color: string }[] = [
        {
            titleKey: "partagerPrix",
            descKey: "partagerPrixDesc",
            icon: Tag,
            href: "/add/price",
            color: "bg-emerald-primary",
        },
        {
            titleKey: "nouveauProduit",
            descKey: "nouveauProduitDesc",
            icon: Plus,
            href: "/add/product",
            color: "bg-emerald-accent",
        },
        {
            titleKey: "nouveauHanout",
            descKey: "nouveauHanoutDesc",
            icon: MapPin,
            href: "/add/store",
            color: "bg-emerald-primary",
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />

            <div className="p-4 space-y-4">
                <h2 className="text-xl font-bold text-foreground mb-6">{t('queSouhaitez')}</h2>

                <div className="grid gap-4">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.titleKey}
                                href={action.href}
                                className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-border-faint active:scale-[0.98] transition-all"
                            >
                                <div className={`${action.color} text-white p-3 rounded-xl shadow-inner`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-foreground">{t(action.titleKey)}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{t(action.descKey)}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-8 bg-surface-green border border-emerald-primary/10 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-accent opacity-50"></div>
                    <p className="text-xs font-black text-emerald-primary/80 italic text-center uppercase tracking-widest leading-relaxed">
                        {t('chaqueContribution')}
                    </p>
                </div>
            </div>
        </div>
    );
}
