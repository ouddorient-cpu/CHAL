"use client";

import { useAuth } from "@/context/AuthContext";
import { Bell, Search, MapPin, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";

export default function Header() {
    const { profile } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { lang, toggleLanguage } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const city = profile?.city || 'Meknès';

    return (
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="relative w-full max-w-xl group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Rechercher un produit (Lait, Farine, Huile...)"
                    className="block w-full pl-12 pr-5 py-3 bg-surface border border-border-subtle rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-foreground placeholder:text-muted"
                    onClick={() => router.push('/search')}
                    readOnly
                />
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto flex-shrink-0">
                {mounted && (
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-full bg-surface border border-border-subtle text-muted hover:text-foreground transition-colors"
                        aria-label="Changer le thème"
                    >
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </button>
                )}

                <button
                    onClick={toggleLanguage}
                    className="px-3 py-2 rounded-full bg-surface border border-border-subtle text-muted hover:text-foreground transition-colors text-[10px] font-black uppercase tracking-tight"
                >
                    {lang === 'fr' ? 'دارجة' : 'FR'}
                </button>

                <div className="bg-foreground text-background px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    {city}
                </div>

                <button
                    onClick={() => router.push('/ranking')}
                    className="p-2.5 rounded-full bg-surface border border-border-subtle text-muted hover:text-foreground hover:border-foreground transition-colors relative"
                    aria-label="Notifications"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-surface" />
                </button>

                {profile ? (
                    <Link
                        href="/profile"
                        className="w-9 h-9 rounded-full overflow-hidden border-2 border-border-subtle flex-shrink-0 hover:border-primary transition-colors"
                    >
                        {profile.photoURL ? (
                            <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                {profile.displayName?.substring(0, 1) || 'H'}
                            </div>
                        )}
                    </Link>
                ) : (
                    <Link
                        href="/login"
                        className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-primary-dark transition-colors"
                    >
                        Connexion
                    </Link>
                )}
            </div>
        </header>
    );
}
