"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "vet-connect-active-user";

interface ProfileContextValue {
  userId: string | null;
  setUserId: (id: string | null) => void;
  ready: boolean;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // One-time read of localStorage on mount — can't happen during render since
    // window isn't available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserIdState(window.localStorage.getItem(STORAGE_KEY));
    setReady(true);
  }, []);

  function setUserId(id: string | null) {
    setUserIdState(id);
    if (id) {
      window.localStorage.setItem(STORAGE_KEY, id);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <ProfileContext.Provider value={{ userId, setUserId, ready }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
