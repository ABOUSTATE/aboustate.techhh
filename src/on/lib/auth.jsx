import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";

const AuthContext = createContext(null);

// One place that knows who is signed in and what their ON profile is.
// `profile` is null for a signed-in account that hasn't onboarded yet
// (e.g. someone who already has an aboustate.tech client account).
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(undefined);

  const loadProfile = useCallback(async (s) => {
    if (!s) {
      setProfile(null);
      return null;
    }
    const { data } = await supabase.from("on_profiles").select("*").eq("id", s.user.id).maybeSingle();
    setProfile(data || null);
    return data || null;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadProfile(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      loadProfile(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = {
    session,
    user: session?.user || null,
    profile,
    loading: session === undefined || (session && profile === undefined),
    refresh: () => loadProfile(session),
    signOut: () => supabase.auth.signOut(),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function isApprovedDirector(profile) {
  return profile?.role === "director" && profile?.director_status === "approved";
}
