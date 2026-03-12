import type { User, UserRole } from "../types";

export type SignUpMetadata = {
  fullName?: string;
  role?: UserRole;
  phone?: string;
  companyName?: string;
};

export type AuthSession = {
  token: string;
  user: User;
};

export function signInWithEmail(email: string, password: string): Promise<AuthSession>;
export function signUpWithEmail(email: string, password: string, metadata?: SignUpMetadata): Promise<AuthSession>;
export function signOut(): Promise<void>;
export function getCurrentUser(): Promise<User | null>;
export function onAuthStateChange(callback: (user: User | null) => void): () => void;
export function getCurrentSession(): Promise<{ token: string | null; user: User | null }>;
