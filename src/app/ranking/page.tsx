"use client";

import { getTopUsers, getLevelFromContributions } from "@/services/dataService";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Crown, Medal, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RankUser {
    uid: string;
    displayName: string;
    photoURL?: string;
    contributionsCount: number;
}

const BADGE_CONFIG: Record<number, { bg: string; ring: string; shadow: string }> = {
    0: { bg: 'bg-amber-400',    ring: 'ring-amber-400',    shadow: 'shadow-amber-400/30' },
    1: { bg: 'bg-gray-300',     ring: 'ring-gray-300',     shadow: 'shadow-gray-300/20' },
    2: { bg: 'bg-amber-600/80', ring: 'ring-amber-600/50', shadow: 'shadow-amber-600/20' },
};

export default function RankingPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<RankUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTopUsers(20).then(setUsers).finally(() => setLoading(false));
    }, []);

    const myRank = users.findIndex(u => u.uid === user?.uid);

    return (
        <div className="min-h-screen bg-bg-app pb-24">

            {/* Header */}
            <div className="bg-surface/90 backdrop-blur-xl border-b border-border-subtle px-4 py-4 sticky top-0 z-20 flex items-center gap-3">
                <Link href="/" className="p-2 text-muted hover:text-primary rounded-xl hover:bg-primary/5 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="font-black text-lg text-foreground tracking-tight">Classement</h1>
                    <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Communauté CH7AL · Meknès</p>
                </div>
                {myRank >= 0 && (
                    <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-black">
                        Ton rang #{myRank + 1}
                    </div>
                )}
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                {/* Podium Top 3 */}
                {!loading && users.length >= 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface rounded-[28px] border border-border-subtle p-6"
                    >
                        <div className="flex items-end justify-center gap-4">
                            {/* 2nd */}
                            <PodiumCard user={users[1]} rank={1} isMe={users[1].uid === user?.uid} />
                            {/* 1st */}
                            <PodiumCard user={users[0]} rank={0} isMe={users[0].uid === user?.uid} />
                            {/* 3rd */}
                            <PodiumCard user={users[2]} rank={2} isMe={users[2].uid === user?.uid} />
                        </div>
                    </motion.div>
                )}

                {/* My position banner (if not in top 3) */}
                {!loading && myRank > 2 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-primary text-white rounded-2xl px-5 py-4 flex items-center gap-4"
                    >
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-lg">
                            #{myRank + 1}
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-sm">Ta position dans le classement</p>
                            <p className="text-[11px] opacity-75 mt-0.5">
                                {users[myRank]?.contributionsCount} contributions · encore {(users[myRank - 1]?.contributionsCount ?? 0) - (users[myRank]?.contributionsCount ?? 0) + 1} pour monter
                            </p>
                        </div>
                        <Zap className="w-6 h-6 opacity-75" />
                    </motion.div>
                )}

                {/* Full leaderboard */}
                <div className="bg-surface rounded-[24px] border border-border-subtle overflow-hidden">
                    <div className="px-5 py-3 border-b border-border-subtle">
                        <p className="text-[11px] font-black text-muted uppercase tracking-widest">Top contributeurs</p>
                    </div>
                    <div className="divide-y divide-border-subtle">
                        {loading
                            ? Array(6).fill(0).map((_, i) => <div key={i} className="h-16 animate-pulse bg-surface/50" />)
                            : users.map((u, idx) => {
                                const level = getLevelFromContributions(u.contributionsCount);
                                const isMe = u.uid === user?.uid;
                                return (
                                    <motion.div
                                        key={u.uid}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                                            isMe ? 'bg-primary/5' : 'hover:bg-surface-2'
                                        }`}
                                    >
                                        {/* Rank */}
                                        <div className={`w-8 text-center font-black text-sm flex-shrink-0 ${
                                            idx === 0 ? 'text-amber-500' :
                                            idx === 1 ? 'text-gray-400' :
                                            idx === 2 ? 'text-amber-700' :
                                            'text-muted'
                                        }`}>
                                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                        </div>

                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border-2 ${isMe ? 'border-primary' : 'border-border-subtle'}`}>
                                            <img
                                                src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=00D084&color=fff`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Name + badge */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-foreground truncate">{u.displayName}</span>
                                                {isMe && <span className="text-[9px] bg-primary text-white font-black px-1.5 py-0.5 rounded-full">Toi</span>}
                                            </div>
                                            <span className="text-[10px] text-primary font-black">{level.badge} {level.name}</span>
                                        </div>

                                        {/* Score */}
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-black text-foreground text-sm">{u.contributionsCount}</p>
                                            <p className="text-[9px] text-muted uppercase tracking-wider">contributions</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                    </div>
                </div>

                {/* Levels legend */}
                <div className="bg-surface rounded-[24px] border border-border-subtle p-5">
                    <p className="text-[11px] font-black text-muted uppercase tracking-widest mb-4">Niveaux & Badges</p>
                    <div className="space-y-3">
                        {[
                            { badge: '👁️', name: 'Observateur',  min: 0,   color: 'text-gray-500' },
                            { badge: '🔦', name: 'Éclaireur',    min: 5,   color: 'text-blue-500' },
                            { badge: '✍️', name: 'Contributeur', min: 15,  color: 'text-green-600' },
                            { badge: '💎', name: 'Expert Prix',  min: 40,  color: 'text-amber-500' },
                            { badge: '🛡️', name: 'Vanguard',     min: 100, color: 'text-purple-600' },
                        ].map(l => (
                            <div key={l.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl w-8 text-center">{l.badge}</span>
                                    <span className={`font-black text-sm ${l.color}`}>{l.name}</span>
                                </div>
                                <span className="text-[11px] text-muted font-bold">{l.min}+ contributions</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PodiumCard({ user, rank, isMe }: { user: RankUser; rank: number; isMe: boolean }) {
    const cfg = BADGE_CONFIG[rank] ?? BADGE_CONFIG[2];
    const sizes = rank === 0
        ? { avatar: 'w-20 h-20', base: 'h-20', mt: '' }
        : { avatar: 'w-14 h-14', base: 'h-12', mt: 'mt-8' };

    return (
        <div className={`flex flex-col items-center gap-2 flex-1 ${sizes.mt}`}>
            {rank === 0 && <Crown className="w-6 h-6 text-amber-400" fill="currentColor" />}
            <div className={`${sizes.avatar} rounded-full overflow-hidden ring-4 ${cfg.ring} shadow-xl ${cfg.shadow} ${isMe ? 'ring-primary' : ''}`}>
                <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=00D084&color=fff`}
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>
            <div className={`w-full ${sizes.base} ${cfg.bg} rounded-t-xl flex items-end justify-center pb-2`}>
                <span className="font-black text-white text-lg">{rank === 0 ? '1' : rank === 1 ? '2' : '3'}</span>
            </div>
            <p className="font-bold text-foreground text-xs truncate max-w-[80px] text-center">{user.displayName}</p>
            <p className="text-[10px] text-primary font-black">{user.contributionsCount} pts</p>
        </div>
    );
}
