export const MOROCCO_CITIES: Record<string, string[]> = {
    "Casablanca": [
        "Aïn Diab", "Aïn Sebaa", "Anfa", "Belvedere", "Ben M'Sik",
        "Bernoussi", "Bourgogne", "Bouskoura", "Californie", "CIL",
        "Derb Ghallef", "Derb Sultan", "El Fida", "Gauthier", "Hay El Farah",
        "Hay Hassani", "Hay Mohammadi", "Maârif", "Médina", "Mohammédia",
        "Oulfa", "Palmier", "Racine", "Roches Noires", "Sbata",
        "Sidi Bernoussi", "Sidi Moumen", "Sidi Othmane", "2 Mars", "Châabia",
    ].sort(),

    "Rabat": [
        "Agdal", "Akkari", "Aviation", "Barraka", "Diour Jamaa",
        "Hassan", "Hay Riad", "Hay Salam", "Les Ambassadeurs", "Médina",
        "Moulay Ismail", "Océan", "Orangers", "Qamra", "Ryad",
        "Souissi", "Takaddoum", "Yacoub El Mansour", "Youssoufia",
    ].sort(),

    "Salé": [
        "Bettana", "Hay Karima", "Hay Salam", "Kariat Arroumane",
        "Médina", "Sidi Moussa", "Tabriquet", "Tabriquet Nord",
    ].sort(),

    "Témara": [
        "Harhoura", "Hay Moulay Abdallah", "Hay Riad", "Mandarona",
        "Ouled Mtaa", "Sabbah", "Val Fleuri",
    ].sort(),

    "Meknès": [
        "Agdal", "Anfa", "Bassatine", "Belle Vue", "Berradi",
        "Bni M'Hamed", "Hamria", "Koulouch", "Mansour", "Marjane",
        "Nahda", "Ouislane", "Plaisance", "Riad", "Rouamzine",
        "Salam", "Sidi Baba", "Sidi Bouzekri", "Sidi Said", "Toulal",
        "Wafae", "Zeitoune", "Zitoune",
    ].sort(),

    "Fès": [
        "Agdal", "Aouinat Hajjaj", "Bensouda", "Bouanane", "Dokkarat",
        "Fès El Bali", "Fès El Jdid", "Hamria", "Les Orangers",
        "Narjiss", "Oued Fès", "Route Imouzzer", "Saiss",
        "Sidi Ibrahim",
    ].sort(),

    "Marrakech": [
        "Azli", "Azzouzia", "Bab Doukkala", "Daoudiate", "Guéliz",
        "Hay Hassani", "Hay Mohammadi", "Hivernage", "M'Hamid",
        "Massira", "Médina", "Mellah", "Oulad Hassoune", "Semlalia",
        "Sidi Youssef Ben Ali", "Targa",
    ].sort(),

    "Tanger": [
        "Beni Makada", "Boukhalef", "Branes", "Charf", "Cité Bahnini",
        "Dradeb", "Grand Socco", "Iberia", "Malabata", "Médina",
        "Mesnana", "Moujahidine", "Souani", "Val Fleuri",
    ].sort(),

    "Tétouan": [
        "Azla", "Bouhout", "Ensanche", "Hay Salam", "M'Diq",
        "Martil", "Médina", "Mellah",
    ].sort(),

    "Agadir": [
        "Anza", "Aourir", "Bensergao", "Cité Suisse", "Dcheira",
        "Hay Almassira", "Hay El Fath", "Hay Hassani", "Hay Mohammadi",
        "Inezgane", "Secteur Touristique", "Talborjt", "Tikiouine",
    ].sort(),

    "Oujda": [
        "Hay Andalous", "Hay El Qods", "Hay Moulay Slimane",
        "Hay Rabia", "Hay Salam", "Isly", "Lazaret", "Médina",
        "Nasr City", "Sidi Maafa",
    ].sort(),

    "Kenitra": [
        "Centre Ville", "Hay Essamir", "Hay Mohammadi", "Hay Salam",
        "Mehdia", "Ville Nouvelle",
    ].sort(),

    "El Jadida": [
        "Azemmour", "Cité El Amal", "El Jadida Centre", "Hay Al Massar",
        "Hay Essalam", "Hay Mohammadi", "Sidi Bouzid",
    ].sort(),

    "Settat": [
        "Ain Tizit", "Centre Ville", "Hay El Fath", "Hay Salam",
        "Hay Mohammadi", "Ouled Hriz",
    ].sort(),

    "Béni Mellal": [
        "Aït Mhamed", "Centre Ville", "Hay Al Majd", "Hay Mohammadi",
        "Hay Salam", "Souk Lqadim",
    ].sort(),

    "Nador": [
        "Afsou", "Bni Nsar", "Centre Ville", "Hay El Matar",
        "Hay Mohammadi", "Médina",
    ].sort(),

    "Errachidia": [
        "Centre Ville", "Hay El Bied", "Hay Salam", "Ksar Assaka",
    ].sort(),

    "Laâyoune": [
        "Centre Ville", "Hay Chabab", "Hay El Amal", "Hay Mohammadi",
        "Quartier El Wahda",
    ].sort(),

    "Safi": [
        "Asfi Centre", "Hay Al Andalous", "Hay Mohammadi", "Jrifat",
        "Médina", "Sidi Bouzid",
    ].sort(),

    "Khénifra": [
        "Centre Ville", "Hay El Massira", "Hay Salam",
    ].sort(),
};

export const MOROCCO_CITY_NAMES = Object.keys(MOROCCO_CITIES).sort();

// Kept for backward compatibility
export const MEKNES_NEIGHBORHOODS = MOROCCO_CITIES["Meknès"];
