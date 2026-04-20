"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, PlusCircle, Trophy as TrayIcon, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { TranslationKey } from "@/lib/translations";

const navItems: { href: string; icon: typeof Home; labelKey: TranslationKey; isFAB?: boolean }[] = [
    { href: "/", icon: Home, labelKey: "accueil" },
    { href: "/basket", icon: ShoppingCart, labelKey: "panier" },
    { href: "/add/price", icon: PlusCircle, labelKey: "ajouter", isFAB: true },
    { href: "/ranking", icon: TrayIcon, labelKey: "classement" },
    { href: "/profile", icon: User, labelKey: "profil" },
];

// Routes where BottomNav should be hidden (focused flows with their own nav)
const HIDDEN_ROUTES = ['/add/price', '/add/store', '/add/product', '/basket', '/alerts', '/map'];

export default function BottomNav() {
    const pathname = usePathname();
    const { t } = useLanguage();

    if (HIDDEN_ROUTES.some(r => pathname.startsWith(r))) return null;

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/97 backdrop-blur-xl border-t border-border-faint px-2 py-1 flex justify-around items-center z-50 safe-area-bottom premium-shadow transition-colors duration-300">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                if (item.isFAB) {
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative -top-6 bg-emerald-primary text-white p-5 rounded-2xl shadow-xl shadow-emerald-900/40 border-4 border-background transition-all active:scale-90 hover:scale-105 group"
                        >
                            <PlusCircle size={28} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center justify-center p-3 transition-all active:scale-90 ${isActive ? "text-emerald-primary scale-110" : "text-muted"
                            }`}
                    >
                        <Icon size={22} strokeWidth={isActive ? 3 : 2} />
                        <span className={`text-[8px] mt-1 font-black uppercase tracking-widest ${isActive ? "opacity-100" : "opacity-0"}`}>{t(item.labelKey)}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
