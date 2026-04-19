"use client";

import { Award, LogOut, Settings, Star, TrendingUp, Shield, Zap, ChevronRight, Share2 } from "lucide-react";
import { getLevelFromContributions } from "@/services/dataService";
import Link from 'next/link';
import Header from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function ProfilePage() {
    const { profile, signOut, loading } = useAuth();
    const { t } = useLanguage();

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-8 h-8 border-4 border-emerald-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!profile) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                    <div className="relative mb-10">
                        <div className="absolute inset-0 bg-emerald-primary/20 rounded-full blur-[40px] animate-pulse"></div>
                        <div className="bg-gradient-to-tr from-surface-green to-white w-28 h-28 rounded-full flex items-center justify-center relative z-10 border border-emerald-primary/10 shadow-xl">
                            <Star size={56} className="text-emerald-primary" fill="currentColor" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">{t('devenezContributeur')}</h2>
                    <p className="text-muted font-bold mb-10 max-w-[280px] leading-relaxed">
                        {t('rejoignezCommunaute')}
                    </p>
                    <Link
                        href="/login"
                        className="w-full max-w-[280px] bg-emerald-primary text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all uppercase tracking-widest text-sm border-t border-white/20 text-center block"
                    >
                        {t('seConnecter')}
                    </Link>
                    <p className="mt-6 text-[10px] text-faint font-black uppercase tracking-widest">{t('calculeParCH7AL')}</p>
                </div>
            </div>
        );
    }

    const level = getLevelFromContributions(profile.contributionsCount);
    const progress = (profile.contributionsCount / (level.minContributions + 20)) * 100;

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            <Header />

            <div className="p-4 space-y-6 pt-6">
                {/* Premium Profile Card */}
                <section className="relative overflow-hidden bg-white p-8 rounded-[3rem] shadow-xl shadow-black/[0.03] border border-border-faint flex flex-col items-center text-center group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-primary/10 transition-colors"></div>

                    <div className="relative mb-6">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-[6px] border-[#fefcf8] shadow-2xl p-1 relative z-10">
                            <img
                                src={profile.photoURL || "https://ui-avatars.com/api/?name=" + profile.displayName}
                                alt={profile.displayName}
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-[#fefcf8] text-emerald-primary w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-border-faint z-20">
                            <span className="text-xl">{level.badge}</span>
                        </div>
                    </div>

                    <div className="space-y-1 relative z-10">
                        <h2 className="text-2xl font-black text-foreground tracking-tight">{profile.displayName}</h2>
                        <div className="flex items-center justify-center gap-1.5 text-muted font-bold text-xs">
                            <Zap size={12} className="text-emerald-primary fill-emerald-primary" />
                            <span>Meknès, Maroc</span>
                        </div>
                    </div>

                    <div className="mt-6 w-full space-y-3">
                        <div className="flex justify-between items-end px-2">
                            <div className="text-left">
                                <span className="text-[10px] font-black text-emerald-primary uppercase tracking-[0.2em]">{level.name}</span>
                                <p className="text-xs font-black text-muted">{t('niveau')} {level.level}</p>
                            </div>
                            <span className="text-[10px] font-black text-faint uppercase tracking-widest">{profile.contributionsCount} / {level.minContributions + 50} EXP</span>
                        </div>
                        <div className="h-3 w-full bg-surface rounded-full p-0.5 border border-border-faint">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                style={{ width: `${Math.min(100, progress)}%` }}
                            ></div>
                        </div>
                    </div>
                </section>

                {/* Impact Grid */}
                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-border-faint shadow-sm flex flex-col items-center text-center active:scale-95 transition-all">
                        <div className="w-12 h-12 bg-surface-green text-emerald-primary rounded-2xl flex items-center justify-center mb-4">
                            <Share2 size={24} />
                        </div>
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-1">{t('contributions')}</span>
                        <span className="text-3xl font-black text-foreground">{profile.contributionsCount}</span>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border border-border-faint shadow-sm flex flex-col items-center text-center active:scale-95 transition-all">
                        <div className="w-12 h-12 bg-surface-green text-emerald-primary rounded-2xl flex items-center justify-center mb-4">
                            <Award size={24} />
                        </div>
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-1">{t('pointHonor')}</span>
                        <span className="text-3xl font-black text-foreground">{profile.contributionsCount * 10}</span>
                    </div>
                </section>

                {/* Custom Menu Actions */}
                <section className="bg-white rounded-[2.5rem] shadow-sm border border-border-faint overflow-hidden divide-y divide-border-faint">
                    <Link href="/history" className="w-full px-8 py-5 flex items-center gap-4 active:bg-surface group transition-all">
                        <div className="w-10 h-10 bg-surface-green text-emerald-primary rounded-xl flex items-center justify-center group-hover:bg-emerald-primary group-hover:text-white transition-all">
                            <TrendingUp size={20} />
                        </div>
                        <span className="flex-1 text-left font-black text-sm text-foreground tracking-tight">{t('historiquePrix')}</span>
                        <ChevronRight size={18} className="text-faint group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/ranking" className="w-full px-8 py-5 flex items-center gap-4 active:bg-surface group transition-all">
                        <div className="w-10 h-10 bg-surface-green text-emerald-primary rounded-xl flex items-center justify-center group-hover:bg-emerald-primary group-hover:text-white transition-all">
                            <Award size={20} />
                        </div>
                        <span className="flex-1 text-left font-black text-sm text-foreground tracking-tight">{t('classementMeknes')}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-emerald-primary bg-surface-green px-2 py-0.5 rounded-md uppercase tracking-tighter">{t('bientot')}</span>
                            <ChevronRight size={18} className="text-faint group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                    <button className="w-full px-8 py-5 flex items-center gap-4 active:bg-surface group transition-all">
                        <div className="w-10 h-10 bg-surface-green text-emerald-primary rounded-xl flex items-center justify-center group-hover:bg-emerald-primary group-hover:text-white transition-all">
                            <Settings size={20} />
                        </div>
                        <span className="flex-1 text-left font-black text-sm text-foreground tracking-tight">{t('parametresCompte')}</span>
                        <ChevronRight size={18} className="text-faint group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={signOut}
                        className="w-full px-8 py-6 flex items-center gap-4 active:bg-red-50 group transition-all"
                    >
                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                            <LogOut size={20} />
                        </div>
                        <span className="flex-1 text-left font-black text-sm text-red-500 tracking-tight uppercase tracking-widest">{t('seDeconnecter')}</span>
                    </button>
                </section>

                <div className="text-center py-4">
                    <p className="text-[10px] font-black text-faint uppercase tracking-[0.4em]">Hanout Price v1.2.14</p>
                </div>
            </div>
        </div>
    );
}
