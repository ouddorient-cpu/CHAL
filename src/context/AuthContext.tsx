"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '@/types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeProfile: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
            setUser(authUser);

            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = undefined;
            }

            if (authUser) {
                const profileRef = doc(db, 'users', authUser.uid);

                // Real-time listener for profile changes (badges/points/contributions)
                unsubscribeProfile = onSnapshot(profileRef, async (profileSnap) => {
                    if (profileSnap.exists()) {
                        setProfile(profileSnap.data() as UserProfile);
                    } else {
                        const newProfile = {
                            uid: authUser.uid,
                            displayName: authUser.displayName || 'Anonyme',
                            email: authUser.email || '',
                            photoURL: authUser.photoURL || '',
                            contributionsCount: 0,
                            createdAt: serverTimestamp(),
                        };
                        await setDoc(profileRef, newProfile);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Profile sync error:", error);
                    setLoading(false);
                });
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);



    const signUpWithEmail = async (email: string, pass: string, name: string) => {
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(userCredential.user, { displayName: name });
        } catch (error) {
            console.error("Error signing up", error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, pass: string) => {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            console.error("Error signing in", error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signUpWithEmail, signInWithEmail, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
