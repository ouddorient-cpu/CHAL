import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCf11Zlk9A9CDMFrTcOoAmjLCP2QRJzj2M",
  authDomain: "ch7al-hanouti.firebaseapp.com",
  projectId: "ch7al-hanouti",
  storageBucket: "ch7al-hanouti.firebasestorage.app",
  messagingSenderId: "446023373048",
  appId: "1:446023373048:web:725902859ea513b3146b0d"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Messaging may not be supported in all environments (e.g. server-side or some mobile browsers)
const messaging = async () => (await isSupported()) ? getMessaging(app) : null;

export { app, auth, db, storage, messaging };
