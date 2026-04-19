"use client";

import { getTopUsers, getLevelFromContributions } from "@/services/dataService";
import { UserProfile } from "@/types";
import { Award, ChevronLeft, Zap, Crown, Medal, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function RankingPage() {
    const { t } = useLanguage();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const data = await getTopUsers(20);
                setUsers(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRanking();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-xl px-4 py-5 border-b border-border-faint flex items-center justify-between sticky top-0 z-10">
                <Link href="/" className="text-muted p-2 hover:bg-surface rounded-2xl transition-all">
                    <ChevronLeft size={24} />
                </Link>
                <div className="text-center">
                    <h1 className="font-black text-2xl tracking-tighter uppercase leading-none">{t('classement')}</h1>
                    <span className="text-[10px] font-black text-muted tracking-[0.3em] uppercase">{t('communauteCH7AL')}</span>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="p-4 space-y-6">
                {/* Top 3 Podium */}
                {!loading && users.length >= 3 && (
                    <section className="flex items-end justify-center gap-3 pt-6 pb-4">
                        {/* 2nd place */}
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-gray-300 shadow-lg mb-2 group-hover:scale-110 transition-transform">
                                <img src={users[1].photoURL || `https://ui-avatars.com/api/?name=${users[1].displayName}`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <Medal size={18} className="text-gray-400 mb-1" />
                            <span className="text-xs font-black text-foreground truncate max-w-[80px]">{users[1].displayName}</span>
                            <span className="text-[9px] font-black text-muted mt-0.5">{users[1].contributionsCount} EXP</span>
                        </div>

                        {/* 1st place */}
                        <div className="flex flex-col items-center text-center group -mt-8">
                            <Crown size={22} className="text-amber-500 mb-2 animate-bounce" fill="currentColor" />
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl shadow-amber-500/20 mb-2 group-hover:scale-110 transition-transform">
                                <img src={users[0].photoURL || `https://ui-avatars.com/api/?name=${users[0].displayName}`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-sm font-black text-foreground truncate max-w-[100px]">{users[0].displayName}</span>
                            <span className="text-[10px] font-black text-emerald-primary mt-0.5">{users[0].contributionsCount} EXP</span>
                        </div>

                        {/* 3rd place */}
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-amber-600/40 shadow-lg mb-2 group-hover:scale-110 transition-transform">
                                <img src={users[2].photoURL || `https://ui-avatars.com/api/?name=${users[2].displayName}`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <Medal size={18} className="text-amber-600 mb-1" />
                            <span className="text-xs font-black text-foreground truncate max-w-[80px]">{users[2].displayName}</span>
                            <span className="text-[9px] font-black text-muted mt-0.5">{users[2].contributionsCount} EXP</span>
                        </div>
                    </section>
                )}

                {/* Leaderboard Table */}
                <section className="bg-white rounded-3xl shadow-xl shadow-black/[0.03] border border-border-subtle overflow-hidden">
                    <div className="grid grid-cols-[50px_1fr_60px_60px] gap-2 px-6 py-4 bg-surface border-b border-border-faint text-[8px] font-black text-muted uppercase tracking-[0.3em]">
                        <div>{t('rang')}</div>
                        <div>{t('membre')}</div>
                        <div className="text-center">EXP</div>
                        <div className="text-right">{t('impact')}</div>
                    </div>

                    <div className="divide-y divide-border-faint">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-16 animate-pulse bg-surface/50"></div>
                            ))
                        ) : (
                            users.map((user, idx) => {
                                const level = getLevelFromContributions(user.contributionsCount);
                                return (
                                    <div key={user.uid} className="grid grid-cols-[50px_1fr_60px_60px] gap-2 px-6 py-4 items-center group hover:bg-emerald-primary/[0.02] transition-colors">
                                        <span className={`text-lg font-black ${idx < 3 ? 'text-emerald-primary' : 'text-muted'}`}>
                                            {idx + 1}
                                        </span>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-border-faint flex-shrink-0">
                                                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-sm text-foreground truncate">{user.displayName}</h4>
                                                <span className="text-[8px] font-black text-emerald-primary uppercase tracking-tighter">{level.badge} {level.name}</span>
                                            </div>
                                        </div>
                                        <span className="text-center text-sm font-black text-foreground">{user.contributionsCount}</span>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-emerald-primary bg-emerald-primary/10 px-2 py-0.5 rounded-full">
                                                {user.contributionsCount * 10}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
