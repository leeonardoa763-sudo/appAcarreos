import React, { createContext, useContext } from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../config/supabase";
import { clearSupabaseStorage } from "../utils/storageUtils";
import { useUserProfile } from "../hooks/useUserProfile";
import { clearCredentials } from "../utils/rememberAccount";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMounted = useRef(true);
  const isInitializing = useRef(false);

  const {
    userProfile,
    profileError,
    profileLoading,
    loadProfile,
    clearProfile,
    refreshProfile: refreshUserProfile,
    setIsMounted: setProfileMounted,
  } = useUserProfile();

  useEffect(() => {
    isMounted.current = true;

    const initializeAuth = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        console.log(
          "[useAuth] 📡 getSession resultado - session:",
          session ? "existe" : "null",
          "| error:",
          error?.message ?? null,
        );

        if (error) {
          console.error("[useAuth] Error obteniendo sesión:", error);
          if (isMounted.current) {
            setLoading(false);
            isInitializing.current = false;
          }
          return;
        }

        if (isMounted.current) {
          setUser(session?.user ?? null);
        }

        if (session?.user) {
          await loadProfile(session.user.id);
        }

        if (isMounted.current) {
          setLoading(false);
          isInitializing.current = false;
          console.log(
            "[useAuth] 🏁 initializeAuth terminando - user:",
            session?.user?.id ?? "null",
          );
        }
      } catch (error) {
        console.error("[useAuth] Error en initializeAuth:", error);
        if (isMounted.current) {
          setLoading(false);
          isInitializing.current = false;
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted.current) return;
      console.log(
        "[useAuth] 🔔 onAuthStateChange - event:",
        event,
        "| session:",
        session ? "existe" : "null",
      );

      if (event === "SIGNED_OUT") {
        if (isMounted.current) {
          setUser(null);
          clearProfile();
          setLoading(false);
        }
        return;
      }

      if (isInitializing.current) {
        if (isMounted.current) {
          setUser(session?.user ?? null);
        }
        return;
      }

      if (isMounted.current) {
        setUser(session?.user ?? null);
      }

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        if (isMounted.current) {
          clearProfile();
        }
      }

      if (isMounted.current) {
        setLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      setProfileMounted(false);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await clearCredentials();
      await clearSupabaseStorage();
      if (isMounted.current) {
        setUser(null);
        clearProfile();
      }
      await supabase.auth.signOut();
      return { error: null };
    } catch (error) {
      console.error("[useAuth] Error en signOut:", error);
      if (isMounted.current) {
        setUser(null);
        clearProfile();
      }
      return { error: null };
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      return await refreshUserProfile(user.id);
    }
    return null;
  };

  const derivedValues = useMemo(() => {
    return {
      isAuthenticated: !!user,
      userRole: userProfile?.roles?.role || null,
      hasProfile: !!userProfile,
      userName: userProfile
        ? `${userProfile.nombre} ${userProfile.primer_apellido}`.trim()
        : null,
      currentObra: userProfile?.obras?.obra || null,
      currentObraId: userProfile?.obras?.id_obra || null,
      currentCC: userProfile?.obras?.cc || null,
      userEmail: user?.email || null,
    };
  }, [user, userProfile]);

  const value = {
    user,
    userProfile,
    loading: loading || profileLoading,
    profileError,
    signOut,
    refreshProfile,
    ...derivedValues,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext debe usarse dentro de AuthProvider");
  }
  return context;
};
