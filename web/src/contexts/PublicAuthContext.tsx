import { createContext, useContext, useState, type ReactNode } from "react";

export const PUBLIC_USER_KEY = "bl_public_user";
/** 7 days in milliseconds */
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export interface PublicUser {
  id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  belongs_to: string;
  purok: string;
  email: string;
  phone: string;
  login_code: string;
}

interface StoredSession {
  user: PublicUser;
  expires_at: number;
}

interface PublicAuthContextValue {
  publicUser: PublicUser | null;
  setPublicUser: (user: PublicUser | null) => void;
  logout: () => void;
}

const PublicAuthContext = createContext<PublicAuthContextValue>({
  publicUser: null,
  setPublicUser: () => {},
  logout: () => {},
});

export function usePublicAuth() {
  return useContext(PublicAuthContext);
}

function loadSession(): PublicUser | null {
  try {
    const raw = localStorage.getItem(PUBLIC_USER_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    if (Date.now() > session.expires_at) {
      localStorage.removeItem(PUBLIC_USER_KEY);
      return null;
    }
    return session.user;
  } catch {
    localStorage.removeItem(PUBLIC_USER_KEY);
    return null;
  }
}

export function PublicAuthProvider({ children }: { children: ReactNode }) {
  const [publicUser, setPublicUserState] = useState<PublicUser | null>(loadSession);

  const setPublicUser = (user: PublicUser | null) => {
    if (user) {
      const session: StoredSession = { user, expires_at: Date.now() + SESSION_TTL };
      localStorage.setItem(PUBLIC_USER_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(PUBLIC_USER_KEY);
    }
    setPublicUserState(user);
  };

  const logout = () => setPublicUser(null);

  return (
    <PublicAuthContext.Provider value={{ publicUser, setPublicUser, logout }}>
      {children}
    </PublicAuthContext.Provider>
  );
}
