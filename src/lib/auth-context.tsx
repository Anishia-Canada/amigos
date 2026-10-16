import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { fetchMyProfile, friendlyAuthError, signOut, type Profile } from './auth';
import { supabase } from './supabase';

/** Result of loading the profile for one user id. */
type ProfileResult =
  | { userId: string; profile: Profile; error?: undefined }
  | { userId: string; profile?: undefined; error: string };

type AuthContextValue = {
  /** Only set once the matching profile is loaded, so routing never sees a session without a role. */
  session: Session | null;
  profile: Profile | null;
  /** True only during the first boot (splash screen stays up). */
  loading: boolean;
  /** Signed in, but the profile couldn't be loaded. */
  profileError: string | null;
  retryProfile: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profileResult, setProfileResult] = useState<ProfileResult | null>(null);
  // Becomes true once we know the first screen to show (signed out, or first profile load done).
  const [booted, setBooted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Fires INITIAL_SESSION right away, then every sign-in/out/refresh.
    // Don't await Supabase calls inside this callback; the profile is fetched in the effect below.
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'INITIAL_SESSION' && !nextSession) setBooted(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchMyProfile(userId).then(
      (profile) => {
        if (cancelled) return;
        setProfileResult({ userId, profile });
        setBooted(true);
      },
      (error: unknown) => {
        if (cancelled) return;
        setProfileResult({ userId, error: friendlyAuthError(error) });
        setBooted(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId, retryCount]);

  // Session and profile are exposed together, and only when they belong to the same user.
  const current = userId && profileResult?.userId === userId ? profileResult : null;
  const profile = current?.profile ?? null;

  const value: AuthContextValue = {
    session: profile ? session : null,
    profile,
    loading: !booted,
    profileError: current?.error ?? null,
    retryProfile: () => setRetryCount((n) => n + 1),
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
