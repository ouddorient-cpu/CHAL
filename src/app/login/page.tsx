"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Mail, Lock, User, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function AuthPage() {
    const router = useRouter();
    const { signUpWithEmail, signInWithEmail } = useAuth();
    const { t } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (isLogin) {
                await signInWithEmail(formData.email, formData.password);
            } else {
                await signUpWithEmail(formData.email, formData.password, formData.name);
            }
            router.push("/profile");
        } catch (err: any) {
            setError(err.message || t('erreurSurvenue'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <div className="p-4 flex items-center gap-4 border-b border-border-faint">
                <button
                    aria-label={t('retour')}
                    onClick={() => router.back()}
                    className="text-muted p-1"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-lg text-foreground">{isLogin ? t('connexionTitle') : t('inscription')}</h1>
            </div>

            <div className="flex-1 p-6 flex flex-col justify-center max-w-sm mx-auto w-full">
                <div className="text-center mb-12">
                    <div className="w-24 h-24 bg-emerald-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-emerald-primary/10 shadow-xl shadow-emerald-primary/5 relative">
                        <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-accent rounded-full animate-pulse border-2 border-[#fefcf8]"></div>
                        <CheckCircle2 size={48} className="text-emerald-primary" />
                    </div>
                    <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase font-sans">Hanout Price</h2>
                    <p className="text-muted font-bold text-[10px] uppercase tracking-[0.3em] mt-3 leading-relaxed">
                        {t('intelligenceCollective')}<br />{t('auProfitCouffin')}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold mb-6 border border-red-100 italic">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-primary transition-colors" size={18} />
                            <input
                                required
                                type="text"
                                placeholder={t('nomComplet')}
                                className="w-full bg-surface border border-border-faint rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground focus:ring-8 focus:ring-emerald-primary/5 focus:border-emerald-primary outline-none transition-all placeholder:text-faint"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-primary transition-colors" size={18} />
                        <input
                            required
                            type="email"
                            placeholder={t('email')}
                            className="w-full bg-surface border border-border-faint rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground focus:ring-8 focus:ring-emerald-primary/5 focus:border-emerald-primary outline-none transition-all placeholder:text-faint"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-primary transition-colors" size={18} />
                        <input
                            required
                            type="password"
                            placeholder={t('motDePasse')}
                            className="w-full bg-surface border border-border-faint rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground focus:ring-8 focus:ring-emerald-primary/5 focus:border-emerald-primary outline-none transition-all placeholder:text-faint"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-primary/20 active:scale-95 transition-all disabled:opacity-50 border-t border-white/20 mt-4"
                    >
                        {loading ? t('chargement') : isLogin ? t('seConnecter') : t('creerCompte')}
                    </button>
                </form>

                <p className="text-center text-[10px] font-bold text-muted uppercase tracking-widest mt-12">
                    {isLogin ? t('pasDeCompte') : t('dejaMembre')}{" "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-emerald-primary font-black underline decoration-2 underline-offset-4"
                    >
                        {isLogin ? t('sInscrire') : t('seConnecter')}
                    </button>
                </p>
            </div>
        </div>
    );
}
