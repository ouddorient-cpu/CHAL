"use client";

import { useAuth } from "@/context/AuthContext";
import { addStore } from "@/services/dataService";
import { ArrowLeft, Check, MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MEKNES_NEIGHBORHOODS } from "@/lib/constants";
import { useLanguage } from "@/context/LanguageContext";

export default function AddStorePage() {
    const { t } = useLanguage();
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    // Geolocation state
    const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        address: "",
        city: "Meknès",
        neighborhood: "",
    });

    const CITIES = ["Meknès", "Fès", "Rabat", "Casablanca", "Marrakech", "Tanger", "Agadir", "Oujda"];

    // ── Geolocation + reverse geocoding ──────────────────────────
    const handleGetPosition = async () => {
        if (!navigator.geolocation) { setGeoStatus('error'); return; }
        setGeoStatus('loading');
        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000, enableHighAccuracy: true })
            );
            const { latitude, longitude } = pos.coords;
            setLocation({ latitude, longitude });

            try {
                const geoRes = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`,
                    { headers: { 'User-Agent': 'CH7AL-Hanouti/1.0' } }
                );
                const data = await geoRes.json();
                const addr = data.address || {};

                // Extraire tous les champs utiles
                const road     = addr.road || addr.pedestrian || addr.footway || addr.path || '';
                const suburb   = addr.suburb || addr.quarter || addr.neighbourhood || addr.city_district || addr.village || '';
                const cityRaw  = addr.city || addr.town || addr.municipality || addr.county || '';
                const postcode = addr.postcode || '';

                // Construire l'adresse complète
                const addressParts = [road, suburb, postcode].filter(Boolean);
                const addressStr = addressParts.length ? addressParts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',') || '';

                // Détecter la ville dans la liste
                const matchedCity = CITIES.find(c =>
                    cityRaw.toLowerCase().includes(c.toLowerCase()) ||
                    c.toLowerCase().includes(cityRaw.toLowerCase())
                ) || "Meknès";

                // Détecter le quartier dans la liste
                const suburbLower = suburb.toLowerCase();
                const matchedNeighborhood = MEKNES_NEIGHBORHOODS.find(n =>
                    n.toLowerCase().includes(suburbLower) || suburbLower.includes(n.toLowerCase())
                ) || '';

                setFormData(f => ({
                    ...f,
                    address: addressStr || f.address,
                    city: matchedCity,
                    neighborhood: matchedNeighborhood || f.neighborhood,
                }));
            } catch (geocodeErr) {
                console.warn('Reverse geocoding failed:', geocodeErr);
            }

            setGeoStatus('success');
        } catch (err) {
            console.warn('Geolocation error:', err);
            setGeoStatus('error');
        }
    };

    // ── Auto-déclencher la géolocalisation à l'ouverture ─────────
    useEffect(() => { handleGetPosition(); }, []);

    // ── Submit ────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert(t('alertNonConnecte'));

        setLoading(true);
        try {
            await addStore({
                name: formData.name,
                address: formData.address,
                city: formData.city,
                neighborhood: formData.neighborhood || undefined,
                location: location || undefined,
                createdBy: user.uid,
            });
            setDone(true);
            setTimeout(() => router.push("/add"), 2000);
        } catch (error) {
            console.error(error);
            alert(t('erreurAjout'));
        } finally {
            setLoading(false);
        }
    };

    // ── Success screen ────────────────────────────────────────────
    if (done) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background animate-fade-in">
                <div className="bg-emerald-primary text-white p-6 rounded-full mb-6 animate-bounce shadow-xl shadow-emerald-primary/20">
                    <Check size={48} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-black text-foreground mb-2 tracking-tighter uppercase">{t('hanoutAjoute')}</h2>
                <p className="text-muted font-bold uppercase text-[10px] tracking-widest text-emerald-primary/80">
                    {t('carteAgrandit')}
                </p>
            </div>
        );
    }

    // ── Form ──────────────────────────────────────────────────────
    return (
        <div className="flex flex-col min-h-screen bg-background">

            {/* Header */}
            <div className="bg-[#fefcf8]/90 backdrop-blur-xl px-4 py-4 border-b border-border-faint flex items-center justify-between sticky top-0 z-10">
                <button onClick={() => router.back()} title={t('retour')} className="text-muted p-2 hover:bg-surface rounded-2xl transition-all">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-black text-lg tracking-tight text-foreground uppercase">{t('nouveauHanout')}</h1>
                <div className="w-10" />
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-5 pb-10">

                {/* ── Geolocation card ── */}
                <div className={`rounded-[2.5rem] p-6 border relative overflow-hidden transition-all ${geoStatus === 'success'
                    ? 'bg-emerald-primary/5 border-emerald-primary/20'
                    : geoStatus === 'error'
                        ? 'bg-red-50 border-red-100'
                        : 'bg-emerald-primary/5 border-emerald-primary/10'
                    }`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-accent" />

                    {geoStatus === 'success' ? (
                        <div className="text-center">
                            <div className="bg-emerald-primary text-white w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-primary/20">
                                <CheckCircle2 size={28} />
                            </div>
                            <h3 className="font-black text-emerald-primary uppercase tracking-tighter text-lg">{t('positionCaptureeExcl')}</h3>
                            <p className="text-[10px] font-bold text-muted mt-1 font-mono">
                                {location?.latitude.toFixed(5)}, {location?.longitude.toFixed(5)}
                            </p>
                            <p className="text-[9px] font-black text-emerald-primary/60 uppercase tracking-widest mt-1">
                                {t('adresseQuartierAutoRemplis')} ↓
                            </p>
                            <button
                                type="button"
                                onClick={handleGetPosition}
                                className="mt-4 bg-white text-emerald-primary border border-emerald-primary/20 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] active:scale-95 transition-all shadow-sm"
                            >
                                {t('recalibrer')}
                            </button>
                        </div>
                    ) : geoStatus === 'error' ? (
                        <div className="text-center">
                            <div className="bg-red-100 text-red-500 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <AlertCircle size={28} />
                            </div>
                            <h3 className="font-black text-red-500 uppercase tracking-tighter">{t('geolocNonDispo')}</h3>
                            <p className="text-[10px] font-bold text-muted mt-2 max-w-[220px] mx-auto leading-relaxed">
                                {t('activezGeoloc')}
                            </p>
                            <button
                                type="button"
                                onClick={handleGetPosition}
                                className="mt-4 bg-white text-red-500 border border-red-200 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] active:scale-95 transition-all shadow-sm"
                            >
                                {t('reessayer')}
                            </button>
                        </div>
                    ) : geoStatus === 'loading' ? (
                        <div className="text-center">
                            <div className="bg-emerald-primary text-white w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-primary/20">
                                <Loader2 size={28} className="animate-spin" />
                            </div>
                            <h3 className="font-black text-emerald-primary uppercase tracking-tighter text-lg">{t('localisationPoints')}</h3>
                            <p className="text-[10px] font-bold text-muted mt-2 uppercase tracking-widest">
                                {t('recuperationGPS')}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="bg-emerald-primary text-white w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-primary/20">
                                <MapPin size={28} />
                            </div>
                            <h3 className="font-black text-emerald-primary uppercase tracking-tighter text-lg">{t('geolocalisation')}</h3>
                            <p className="text-xs font-bold text-muted mt-2 max-w-[220px] mx-auto uppercase tracking-widest leading-relaxed">
                                {t('autoRemplitAdresse')}
                            </p>
                            <button
                                type="button"
                                onClick={handleGetPosition}
                                className="mt-6 bg-white text-emerald-primary border border-emerald-primary/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all shadow-sm flex items-center gap-2 mx-auto"
                            >
                                <MapPin size={14} />
                                {t('maPosition')}
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Text fields ── */}
                <div className="bg-white rounded-3xl p-6 border border-border-faint shadow-sm space-y-4">

                    {/* Name */}
                    <div>
                        <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2 px-1">
                            {t('nomHanoutLabel')}
                        </label>
                        <input
                            required
                            className="w-full bg-surface border border-border-faint rounded-2xl py-4 px-5 text-sm font-bold focus:ring-8 focus:ring-emerald-primary/5 focus:border-emerald-primary outline-none transition-all text-foreground placeholder:text-faint"
                            placeholder="Ex: Épicerie Chez Ahmed"
                            value={formData.name}
                            onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2 px-1 flex items-center gap-2">
                            {t('adresseLabel')}
                            {geoStatus === 'success' && (
                                <span className="text-emerald-primary">● {t('autoRempli')}</span>
                            )}
                        </label>
                        <input
                            className="w-full bg-surface border border-border-faint rounded-2xl py-4 px-5 text-sm font-bold focus:ring-8 focus:ring-emerald-primary/5 focus:border-emerald-primary outline-none transition-all text-foreground placeholder:text-faint"
                            placeholder="Ex: Rue Sidi Baba, Meknès"
                            value={formData.address}
                            onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2 px-1">{t('villeLabel')}</label>
                        <div className="relative">
                            <select
                                aria-label={t('villeLabel')}
                                className="w-full bg-surface border border-border-faint rounded-2xl py-4 px-5 text-sm font-bold focus:ring-8 focus:ring-emerald-primary/5 focus:border-emerald-primary outline-none appearance-none transition-all text-foreground"
                                value={formData.city}
                                onChange={e => setFormData(f => ({ ...f, city: e.target.value }))}
                            >
                                {CITIES.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                                <ArrowLeft size={16} className="rotate-[270deg]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Neighborhood pills ── */}
                <div className="bg-white rounded-3xl p-6 border border-border-faint shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin size={14} className="text-emerald-primary" />
                        <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                            {t('quartierLabel')}
                        </span>
                        {geoStatus === 'success' && formData.neighborhood && (
                            <span className="text-[9px] font-black text-emerald-primary uppercase tracking-widest">● {t('detecteAuto')}</span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {MEKNES_NEIGHBORHOODS.map(n => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setFormData(f => ({ ...f, neighborhood: f.neighborhood === n ? '' : n }))}
                                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all active:scale-95 ${formData.neighborhood === n
                                    ? 'bg-emerald-primary text-white shadow-sm'
                                    : 'bg-surface text-muted border border-border-faint'
                                    }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Submit ── */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-primary text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-primary/20 active:scale-95 transition-all disabled:opacity-50 border-t border-white/20"
                >
                    {loading ? t('chargement') : t('ajouterLeHanoutBtn')}
                </button>

            </form>
        </div>
    );
}
