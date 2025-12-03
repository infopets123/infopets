
export enum AppTab {
  HOME = 'home',
  MAP = 'map',
  ASSISTANT = 'assistant',
  TOOLS = 'tools',
  PREMIUM = 'premium'
}

export interface UsageStats {
  aiQuestions: number;
  calcTests: number;
}

export interface User {
  uid: string;
  nome: string;
  email: string;
  fotoPerfil?: string;
  plano: 'free' | 'mensal' | 'anual';
  planExpiresAt?: number; // Timestamp for plan expiration
  criadoEm: number;
  ultimoLogin?: number;
  usageStats?: UsageStats;
}

export interface Pet {
  petId: string;
  donoId: string;
  nome: string;
  especie: 'cachorro' | 'gato' | 'cavalo' | 'hamster' | 'coelho' | 'pássaro' | 'peixe' | 'outros';
  raca: string;
  dataNascimento: string;
  pesoKg: number;
  fotoUrl?: string;
  criadoEm: number;
}

export interface Vaccine {
  vacinaId: string;
  petId: string;
  dataPrimeiraDose: string;
  dataProximaDose?: string;
  aplicada: boolean;
  observacoes: string;
  fotoCarteira?: string;
}

export interface Clinic {
  id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
  };
  geometry: {
    location: any;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
  timestamp: number;
}
