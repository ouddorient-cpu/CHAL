"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, MapPin, ShoppingBasket, Utensils, Milk, Sparkles, History, Bell, ShoppingCart } from "lucide-react";

const NAV_ITEMS = [
    { href: '/', label: 'Le Feed', icon: Home },
    { href: '/ranking', label: 'Classement', icon: TrendingUp },
    { href: '/map', label: 'Ma Ville', icon: MapPin },
    { href: '/basket', label: 'Mon Panier', icon: ShoppingCart },
    { href: '/alerts', label: 'Alertes Prix', icon: Bell },
    { href: '/annonces', label: 'Petites Annonces', icon: ShoppingBasket },
];

const CATEGORIES = [
    { id: 'all', name: 'Tous', icon: ShoppingBasket },
    { id: 'Épicerie', name: 'Épicerie', icon: Utensils },
    { id: 'Boissons', name: 'Boissons', icon: Milk },
    { id: 'Crèmerie', name: 'Crèmerie', icon: History },
    { id: 'Hygiène', name: 'Hygiène', icon: Sparkles },
];

interface SidebarProps {
    selectedCategory: string;
    setSelectedCategory: (id: string) => void;
}

export default function Sidebar({ selectedCategory, setSelectedCategory }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex w-72 h-screen bg-surface border-r border-border-subtle p-8 flex-col sticky top-0 overflow-y-auto z-30 flex-shrink-0">
            <Link href="/" className="font-black text-3xl mb-12 flex items-center gap-0.5 no-underline">
                <span className="text-primary">Ch7al</span>
                <span className="text-foreground">?</span>
            </Link>

            <nav className="space-y-8">
                <div>
                    <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-4 opacity-60">
                        Menu Principal
                    </p>
                    <div className="space-y-1">
                        {NAV_ITEMS.map(item => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors no-underline ${
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted hover:bg-surface-2'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-4 opacity-60">
                        Catégories
                    </p>
                    <div className="space-y-1">
                        {CATEGORIES.map(cat => {
                            const Icon = cat.icon;
                            const isActive = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted hover:bg-surface-2'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 opacity-70" />
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </aside>
    );
}
