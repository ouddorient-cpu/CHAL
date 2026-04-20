import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    updateDoc,
    increment,
    setDoc,
    deleteDoc,
    Timestamp,
    limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Store, PriceContribution, ProductStats, UserLevel, Annonce, AnnonceCategory } from '@/types';

export const USER_LEVELS: UserLevel[] = [
    { name: "Observateur", level: 1, badge: "👁️", color: "gray", minContributions: 0 },
    { name: "Éclaireur", level: 2, badge: "🔦", color: "blue", minContributions: 5 },
    { name: "Contributeur", level: 3, badge: "✍️", color: "green", minContributions: 15 },
    { name: "Expert Prix", level: 4, badge: "💎", color: "gold", minContributions: 40 },
    { name: "Vanguard", level: 5, badge: "🛡️", color: "terracotta", minContributions: 100 },
];

export const getLevelFromContributions = (count: number): UserLevel => {
    return [...USER_LEVELS].reverse().find(l => count >= l.minContributions) || USER_LEVELS[0];
};

// Products
export const getProductById = async (id: string): Promise<Product | null> => {
    const snap = await getDoc(doc(db, 'products', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Product;
};

export const getProducts = async () => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const getPopularProducts = async (limitCount: number = 4) => {
    const q = query(
        collection(db, 'products'),
        orderBy('upVotes', 'desc'),
        limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>, userId: string) => {
    const productRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: serverTimestamp()
    });

    // Increment user contribution count
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
        contributionsCount: increment(1)
    }, { merge: true });

    return productRef;
};

// Stores
export const getStores = async () => {
    const q = query(collection(db, 'stores'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
};

export const addStore = async (store: Omit<Store, 'id' | 'createdAt'>) => {
    return await addDoc(collection(db, 'stores'), {
        ...store,
        createdAt: serverTimestamp()
    });
};

// Prices
export const getPricesForProduct = async (productId: string) => {
    const q = query(
        collection(db, 'prices'),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PriceContribution));
};

export const getPricesForProductWithStores = async (productId: string) => {
    const q = query(
        collection(db, 'prices'),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc'),
        limit(200)
    );
    const snapshot = await getDocs(q);
    const prices = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PriceContribution));

    const storeIds = [...new Set(prices.map(p => p.storeId))];
    const storeSnaps = await Promise.all(storeIds.map(id => getDoc(doc(db, 'stores', id))));
    const storeMap: Record<string, Store> = {};
    storeSnaps.forEach(s => { if (s.exists()) storeMap[s.id] = { id: s.id, ...s.data() } as Store; });

    return prices.map(p => ({ ...p, store: storeMap[p.storeId] || null }));
};

export const addPriceAndCalculateStats = async (contribution: Omit<PriceContribution, 'id' | 'createdAt'>) => {
    // 1. Add the price document
    const priceRef = await addDoc(collection(db, 'prices'), {
        ...contribution,
        createdAt: serverTimestamp()
    });

    // 2. Increment user contribution count
    const userRef = doc(db, 'users', contribution.userId);
    await setDoc(userRef, {
        contributionsCount: increment(1)
    }, { merge: true });

    return priceRef;
};

export const calculateProductStats = (prices: PriceContribution[]): ProductStats => {
    if (prices.length === 0) return { minPrice: 0, maxPrice: 0, avgPrice: 0, count: 0 };

    const values = prices.map(p => p.price);
    const minPrice = Math.min(...values);
    const maxPrice = Math.max(...values);
    const avgPrice = values.reduce((a, b) => a + b, 0) / values.length;

    return { minPrice, maxPrice, avgPrice, count: prices.length };
};

// Voting & Comments
export const voteProduct = async (productId: string, userId: string, voteType: 'up' | 'down') => {
    const voteRef = doc(db, 'products', productId, 'votes', userId);
    const voteSnap = await getDoc(voteRef);
    const productRef = doc(db, 'products', productId);

    if (voteSnap.exists()) {
        const oldVote = voteSnap.data().type;
        if (oldVote === voteType) return; // Same vote, do nothing

        // Change vote
        await updateDoc(productRef, {
            [voteType === 'up' ? 'upVotes' : 'downVotes']: increment(1),
            [oldVote === 'up' ? 'upVotes' : 'downVotes']: increment(-1)
        });
    } else {
        // New vote
        await updateDoc(productRef, {
            [voteType === 'up' ? 'upVotes' : 'downVotes']: increment(1)
        });
    }

    await setDoc(voteRef, { type: voteType, createdAt: serverTimestamp() });
};

export const addComment = async (productId: string, userId: string, userName: string, userPhoto: string | undefined, content: string) => {
    return await addDoc(collection(db, 'products', productId, 'comments'), {
        productId,
        userId,
        userName,
        userPhoto: userPhoto || '',
        content,
        createdAt: serverTimestamp()
    });
};

export const getComments = async (productId: string) => {
    const q = query(collection(db, 'products', productId, 'comments'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
};

export const getRecentPrices = async (count: number = 5) => {
    const q = query(collection(db, 'prices'), orderBy('createdAt', 'desc'), limit(count));
    const snapshot = await getDocs(q);

    // Fetch product and store details for each price
    const prices = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as PriceContribution;

        const [productSnap, storeSnap] = await Promise.all([
            getDoc(doc(db, 'products', data.productId)),
            getDoc(doc(db, 'stores', data.storeId))
        ]);

        const product = productSnap.exists() ? { id: productSnap.id, ...productSnap.data() } as Product : null;
        const store = storeSnap.exists() ? { id: storeSnap.id, ...storeSnap.data() } as Store : null;

        return { ...data, id: docSnap.id, product, store };
    }));

    return prices.filter(p => p.product !== null);
};

export const getRecentStores = async (count: number = 20) => {
    const q = query(collection(db, 'stores'), orderBy('createdAt', 'desc'), limit(count));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
};

// Users & Ranking
export const getTopUsers = async (count: number = 10) => {
    const q = query(
        collection(db, 'users'),
        orderBy('contributionsCount', 'desc'),
        limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as any));
};

// ── Petites Annonces ──────────────────────────────────────────────

export const getAnnonces = async (
    category?: AnnonceCategory | 'all',
    status: 'active' | 'sold' | 'all' = 'active'
): Promise<Annonce[]> => {
    // Simple query with only orderBy — no composite index required.
    // Filtering by status/category is done client-side to avoid missing Firestore indexes.
    const q = query(collection(db, 'annonces'), orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Annonce));

    if (status !== 'all') {
        results = results.filter(a => a.status === status);
    }
    if (category && category !== 'all') {
        results = results.filter(a => a.category === category);
    }

    return results;
};

export const getAnnonceById = async (id: string): Promise<Annonce | null> => {
    const snap = await getDoc(doc(db, 'annonces', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Annonce;
};

export const getUserAnnonces = async (userId: string): Promise<Annonce[]> => {
    // Filter by userId client-side to avoid composite index on (userId, createdAt).
    const q = query(collection(db, 'annonces'), orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Annonce))
        .filter(a => a.userId === userId);
};

export const addAnnonce = async (
    annonce: Omit<Annonce, 'id' | 'createdAt' | 'status'>
): Promise<string> => {
    const ref = await addDoc(collection(db, 'annonces'), {
        ...annonce,
        status: 'active',
        createdAt: serverTimestamp(),
    });
    return ref.id;
};

export const markAnnonceSold = async (annonceId: string): Promise<void> => {
    await updateDoc(doc(db, 'annonces', annonceId), { status: 'sold' });
};

export const deleteAnnonce = async (annonceId: string): Promise<void> => {
    await deleteDoc(doc(db, 'annonces', annonceId));
};

export const deletePrice = async (priceId: string): Promise<void> => {
    await deleteDoc(doc(db, 'prices', priceId));
};

export const updateUserFCMToken = async (userId: string, token: string) => {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
        fcmToken: token,
        lastActive: serverTimestamp()
    }, { merge: true });
};
