import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Helper para ler variáveis de ambiente (Vite ou Node)
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[`VITE_${key}`] || '';
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY"),
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("FIREBASE_APP_ID")
};

// Verifica se a configuração existe antes de inicializar
const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    console.log("🔥 Firebase conectado com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
  }
} else {
  console.warn("⚠️ Firebase não configurado. Usando modo LocalStorage (sem sincronização entre dispositivos).");
}

export { auth, db, googleProvider, isFirebaseConfigured };