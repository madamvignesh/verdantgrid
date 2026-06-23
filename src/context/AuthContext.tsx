import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User as SupaUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "farmer" | "restaurant";

export type Profile = {
  user_id: string;
  full_name: string;
  city: string;
  role: Role | null;
  email: string;
};

type AuthCtx = {
  user: SupaUser | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (data: {
    email: string;
    password: string;
    full_name: string;
    city: string;
    role: Role;
    phone?: string;
    farm_capacity?: string;
    restaurant_type?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string, email: string) => {
    const [{ data: prof }, { data: roleRow }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, city").eq("user_id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
    ]);
    if (prof) {
      setProfile({
        user_id: uid,
        full_name: prof.full_name || "",
        city: prof.city || "",
        role: (roleRow?.role as Role) ?? null,
        email,
      });
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // defer to avoid deadlock
        setTimeout(() => loadProfile(sess.user.id, sess.user.email ?? ""), 0);
      } else {
        setProfile(null);
      }
    });

    // Then check current session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadProfile(sess.user.id, sess.user.email ?? "");
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const login: AuthCtx["login"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const signup: AuthCtx["signup"] = async (data) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: data.full_name,
          city: data.city,
          role: data.role,
          phone: data.phone ?? "",
          farm_capacity: data.farm_capacity ?? "",
          restaurant_type: data.restaurant_type ?? "",
        },
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id, user.email ?? "");
  };

  return (
    <Ctx.Provider value={{ user, session, profile, loading, login, signup, signInWithGoogle, logout, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
