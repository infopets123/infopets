import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE ---
// Para ativar a sincronização na nuvem, crie um projeto no Firebase Console,
// ative o Authentication e o Firestore, e cole as chaves abaixo.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "", // Cole sua apiKey aqui
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "", // Cole seu authDomain aqui
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || ""
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