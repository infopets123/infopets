import { User, Pet, Vaccine, ChatMessage } from '../types';
import { auth, db, googleProvider, isFirebaseConfigured } from './firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';

// Keys for LocalStorage Fallback
const USERS_KEY = 'infopets_users';
const PETS_KEY = 'infopets_pets';
const VACCINES_KEY = 'infopets_vaccines';
const SESSION_KEY = 'infopets_session';

// --- HELPERS PARA LOCAL STORAGE (FALLBACK) ---
const getStorage = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};
const setStorage = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- AUTHENTICATION ---

export const registerUser = async (email: string, password: string, name: string): Promise<User> => {
  if (isFirebaseConfigured && auth && db) {
    // FIREBASE MODE
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      const newUser: User = {
        uid: fbUser.uid,
        nome: name,
        email: email,
        plano: 'free',
        criadoEm: Date.now(),
        ultimoLogin: Date.now(),
        usageStats: { aiQuestions: 0, calcTests: 0 }
      };

      // Salvar dados do usuário no Firestore: Users/{userId}
      await setDoc(doc(db, "users", fbUser.uid), newUser);
      
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      return newUser;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("Este e-mail já está em uso.");
      }
      throw error;
    }
  } else {
    // LOCAL STORAGE MODE
    const users = getStorage<any>(USERS_KEY);
    if (users.find((u: any) => u.email === email)) throw new Error("E-mail já cadastrado (Local).");
    
    const newUser = {
      uid: 'uid_' + Date.now(),
      nome: name,
      email: email,
      plano: 'free' as const,
      password: password,
      fotoPerfil: '',
      criadoEm: Date.now(),
      ultimoLogin: Date.now(),
      usageStats: { aiQuestions: 0, calcTests: 0 }
    };
    users.push(newUser);
    setStorage(USERS_KEY, users);
    
    const { password: _, ...sessionUser } = newUser;
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  if (isFirebaseConfigured && auth && db) {
    // FIREBASE MODE
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Buscar dados do Firestore
      const userDocRef = doc(db, "users", fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as User;
        // Atualizar último login
        await updateDoc(userDocRef, { ultimoLogin: Date.now() });
        localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        return userData;
      } else {
        // Caso raro: Auth existe mas Doc não (cria doc básico)
        const userData: User = {
            uid: fbUser.uid,
            nome: fbUser.displayName || 'Usuário',
            email: email,
            plano: 'free',
            criadoEm: Date.now(),
            ultimoLogin: Date.now(),
            usageStats: { aiQuestions: 0, calcTests: 0 }
        };
        await setDoc(userDocRef, userData);
        localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        return userData;
      }
    } catch (error: any) {
      console.error("Firebase Login Error:", error.code, error.message);
      throw error; // Let UI handle exact error
    }
  } else {
    // LOCAL STORAGE MODE
    const users = getStorage<any>(USERS_KEY);
    const user = users.find((u: any) => u.email === email && u.password === password);
    if (!user) throw new Error("E-mail ou senha inválidos (Local).");
    
    user.ultimoLogin = Date.now();
    if (!user.usageStats) user.usageStats = { aiQuestions: 0, calcTests: 0 };
    setStorage(USERS_KEY, users);
    
    const { password: _, ...sessionUser } = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  }
};

export const loginWithSocial = async (provider: 'google' | 'apple'): Promise<User> => {
  if (isFirebaseConfigured && auth && provider === 'google') {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let userData: User;

        if (userDocSnap.exists()) {
           userData = userDocSnap.data() as User;
           await updateDoc(userDocRef, { ultimoLogin: Date.now() });
        } else {
           userData = {
              uid: fbUser.uid,
              nome: fbUser.displayName || 'Usuário',
              email: fbUser.email || '',
              plano: 'free',
              criadoEm: Date.now(),
              ultimoLogin: Date.now(),
              fotoPerfil: fbUser.photoURL || undefined,
              usageStats: { aiQuestions: 0, calcTests: 0 }
           };
           await setDoc(userDocRef, userData);
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        return userData;
    } catch (error: any) {
        console.error("Social Login Error", error);
        throw error;
    }
  }

  if (isFirebaseConfigured) {
    throw new Error("Login Social requer configuração correta ou provedor suportado.");
  }

  // Local Storage Demo Simulation
  return loginUser(`demo@${provider}.com`, '123456');
};

export const resetPassword = async (email: string): Promise<void> => {
  if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
  } else {
      const users = getStorage<any>(USERS_KEY);
      const user = users.find((u: any) => u.email === email);
      if (!user) throw new Error("E-mail não encontrado.");
  }
};

export const logoutUser = async () => {
  localStorage.removeItem(SESSION_KEY);
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
};

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  const user = JSON.parse(session);
  if (!user.usageStats) user.usageStats = { aiQuestions: 0, calcTests: 0 };
  return user;
};

export const updateUserPlan = async (uid: string, plan: 'mensal' | 'anual') => {
  const durationDays = plan === 'mensal' ? 30 : 365;
  const expiresAt = Date.now() + (durationDays * 24 * 60 * 60 * 1000);

  if (isFirebaseConfigured && db) {
     const userRef = doc(db, "users", uid);
     await updateDoc(userRef, {
        plano: plan,
        planExpiresAt: expiresAt
     });
     // Atualiza sessão local
     const currentUser = getCurrentUser();
     if (currentUser && currentUser.uid === uid) {
         currentUser.plano = plan;
         currentUser.planExpiresAt = expiresAt;
         localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
     }
  } else {
      const users = getStorage<any>(USERS_KEY);
      const idx = users.findIndex((u: any) => u.uid === uid);
      if (idx > -1) {
          users[idx].plano = plan;
          users[idx].planExpiresAt = expiresAt;
          setStorage(USERS_KEY, users);
          // Atualiza sessão
          const currentUser = getCurrentUser();
          if (currentUser) {
              currentUser.plano = plan;
              currentUser.planExpiresAt = expiresAt;
              localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
          }
      }
  }
};

// --- CHAT HISTORY PERSISTENCE ---

export const saveChatMessage = async (uid: string, message: ChatMessage) => {
    if (isFirebaseConfigured && db) {
        await setDoc(doc(db, "users", uid, "chatHistory", message.id), message);
    } else {
        const key = `chat_${uid}`;
        const history = getStorage<ChatMessage>(key);
        history.push(message);
        setStorage(key, history);
    }
};

export const getChatHistory = async (uid: string): Promise<ChatMessage[]> => {
    if (isFirebaseConfigured && db) {
        const q = query(collection(db, "users", uid, "chatHistory"));
        const snapshot = await getDocs(q);
        const msgs = snapshot.docs.map(d => d.data() as ChatMessage);
        return msgs.sort((a,b) => a.timestamp - b.timestamp);
    } else {
        const key = `chat_${uid}`;
        return getStorage<ChatMessage>(key).sort((a,b) => a.timestamp - b.timestamp);
    }
};

// --- USAGE LIMITS ---

export const incrementUsage = async (type: 'aiQuestions' | 'calcTests') => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  if (isFirebaseConfigured && db) {
     const userRef = doc(db, "users", currentUser.uid);
     const snap = await getDoc(userRef);
     if (snap.exists()) {
        const data = snap.data();
        const currentStats = data.usageStats || { aiQuestions: 0, calcTests: 0 };
        currentStats[type]++;
        await updateDoc(userRef, { usageStats: currentStats });
        
        currentUser.usageStats = currentStats;
        localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
     }
  } else {
     const users = getStorage<any>(USERS_KEY);
     const idx = users.findIndex((u: any) => u.uid === currentUser.uid);
     if (idx > -1) {
         if (!users[idx].usageStats) users[idx].usageStats = { aiQuestions: 0, calcTests: 0 };
         users[idx].usageStats[type]++;
         setStorage(USERS_KEY, users);
         currentUser.usageStats = users[idx].usageStats;
         localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
     }
  }
};

export const checkLimit = (type: 'ai' | 'calc'): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.plano !== 'free') return true;

  const stats = user.usageStats || { aiQuestions: 0, calcTests: 0 };
  if (type === 'ai') return stats.aiQuestions < 2;
  if (type === 'calc') return stats.calcTests < 1;
  return false;
};

// --- DATA MANAGEMENT (PETS & VACCINES) ---

export const getPets = async (donoId: string): Promise<Pet[]> => {
  if (isFirebaseConfigured && db) {
    const petsRef = collection(db, "users", donoId, "pets");
    const snapshot = await getDocs(petsRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), petId: doc.id } as Pet));
  } else {
    const pets = getStorage<Pet>(PETS_KEY);
    return pets.filter(p => p.donoId === donoId);
  }
};

export const addPet = async (pet: Pet) => {
  if (isFirebaseConfigured && db) {
      const petsRef = collection(db, "users", pet.donoId, "pets");
      await setDoc(doc(petsRef, pet.petId), pet);
  } else {
      const pets = getStorage<Pet>(PETS_KEY);
      pets.push(pet);
      setStorage(PETS_KEY, pets);
  }
};

export const deletePet = async (petId: string) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, "users", currentUser.uid, "pets", petId));
  } else {
      let pets = getStorage<Pet>(PETS_KEY);
      pets = pets.filter(p => p.petId !== petId);
      setStorage(PETS_KEY, pets);
  }
};

export const getVaccines = async (petId: string): Promise<Vaccine[]> => {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  if (isFirebaseConfigured && db) {
      const vaccinesRef = collection(db, "users", currentUser.uid, "pets", petId, "vaccines");
      const snapshot = await getDocs(vaccinesRef);
      return snapshot.docs.map(doc => ({ ...doc.data(), vacinaId: doc.id } as Vaccine));
  } else {
      const vaccines = getStorage<Vaccine>(VACCINES_KEY);
      return vaccines.filter(v => v.petId === petId);
  }
};

export const addVaccine = async (vaccine: Vaccine) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  if (isFirebaseConfigured && db) {
      const vaccinesRef = collection(db, "users", currentUser.uid, "pets", vaccine.petId, "vaccines");
      await setDoc(doc(vaccinesRef, vaccine.vacinaId), vaccine);
  } else {
      const vaccines = getStorage<Vaccine>(VACCINES_KEY);
      vaccines.push(vaccine);
      setStorage(VACCINES_KEY, vaccines);
  }
};

export const deleteVaccine = async (petId: string, vacinaId: string) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
  
    if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, "users", currentUser.uid, "pets", petId, "vaccines", vacinaId));
    } else {
        let vaccines = getStorage<Vaccine>(VACCINES_KEY);
        vaccines = vaccines.filter(v => v.vacinaId !== vacinaId);
        setStorage(VACCINES_KEY, vaccines);
    }
};

// --- Compatibilidade síncrona para a interface atual ---
export const getPetsSync = (donoId: string): Pet[] => {
    // Hack: Se for Firebase, retorna vazio inicial e deixa o useEffect carregar via getPets (async)
    if (isFirebaseConfigured) return [];
    const pets = getStorage<Pet>(PETS_KEY);
    return pets.filter(p => p.donoId === donoId);
};