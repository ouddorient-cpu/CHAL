"use client";

import { useAuth } from "@/context/AuthContext";
import { addStore } from "@/services/dataService";
import { ArrowLeft, Check, MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 pb-10 max-w-lg mx-auto w-full">

                {/* ── Nom du Hanout ── */}
                <div>
                    <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-3">
                        Nom du Hanout *
                    </label>
                    <input
                        required
                        autoFocus
                        className="w-full bg-surface border-2 border-border-subtle rounded-[20px] py-4 px-6 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-foreground placeholder:text-muted"
                        placeholder="Ex: Épicerie Chez Ahmed"
                        value={formData.name}
                        onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    />
                </div>

                {/* ── Géolocalisation ── */}
                <div className={`rounded-[24px] p-5 border-2 transition-all ${
                    geoStatus === 'success' ? 'border-primary bg-primary/5'
                    : geoStatus === 'error'  ? 'border-red-300 bg-red-50'
                    : geoStatus === 'loading' ? 'border-primary/30 bg-primary/5'
                    : 'border-border-subtle bg-surface'
                }`}>
                    {geoStatus === 'loading' && (
                        <div className="flex items-center gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin flex-shrink-0" />
                            <div>
                                <p className="font-black text-primary text-sm">Localisation en cours…</p>
                                <p className="text-[11px] text-muted mt-0.5">GPS + adresse automatique</p>
                            </div>
                        </div>
                    )}

                    {geoStatus === 'success' && (
                        <div className="flex items-center gap-4">
                            <CheckCircle2 className="w-8 h-8 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-primary text-sm">Position capturée ✓</p>
                                <p className="text-[11px] text-muted mt-0.5 truncate">{formData.address || `${location?.latitude.toFixed(4)}, ${location?.longitude.toFixed(4)}`}</p>
                                {formData.neighborhood && (
                                    <span className="inline-block mt-1 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                        {formData.neighborhood}
                                    </span>
                                )}
                            </div>
                            <button type="button" onClick={handleGetPosition} className="text-[10px] font-black text-primary underline underline-offset-2 flex-shrink-0">
                                Recalibrer
                            </button>
                        </div>
                    )}

                    {geoStatus === 'error' && (
                        <div className="flex items-center gap-4">
                            <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-black text-red-500 text-sm">Géoloc non disponible</p>
                                <p className="text-[11px] text-muted mt-0.5">Activez la localisation dans votre navigateur</p>
                            </div>
                            <button type="button" onClick={handleGetPosition} className="text-[10px] font-black text-red-400 underline underline-offset-2 flex-shrink-0">
                                Réessayer
                            </button>
                        </div>
                    )}

                    {geoStatus === 'idle' && (
                        <div className="flex items-center gap-4">
                            <MapPin className="w-8 h-8 text-muted flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-black text-foreground text-sm">Géolocalisation</p>
                                <p className="text-[11px] text-muted mt-0.5">Remplit l'adresse et le quartier automatiquement</p>
                            </div>
                            <button type="button" onClick={handleGetPosition} className="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-full flex-shrink-0">
                                Activer
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Submit ── */}
                <button
                    type="submit"
                    disabled={loading || !formData.name}
                    className="w-full bg-primary text-white py-5 rounded-full font-black text-sm shadow-xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-40"
                >
                    {loading ? 'Ajout en cours…' : 'Ajouter le Hanout'}
                </button>

            </form>
        </div>
    );
}
