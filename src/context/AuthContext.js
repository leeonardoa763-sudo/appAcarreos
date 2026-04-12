import React, { createContext, useContext } from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import { AppState } from "react-native";
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

  // ─── Inicialización de sesión ─────────────────────────────────────────────
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
          "[AuthContext] getSession resultado - session:",
          session ? "existe" : "null",
          "| error:",
          error?.message ?? null,
        );

        if (error) {
          console.error("[AuthContext] Error obteniendo sesion:", error);
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
            "[AuthContext] initializeAuth terminando - user:",
            session?.user?.id ?? "null",
          );
        }
      } catch (error) {
        console.error("[AuthContext] Error en initializeAuth:", error);
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
        "[AuthContext] onAuthStateChange - event:",
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

  // ─── Verificar token al volver a primer plano ─────────────────────────────
  useEffect(() => {
    const appStateRef = { current: AppState.currentState };

    const handleAppStateChange = async (nextAppState) => {
      const anterior = appStateRef.current;
      appStateRef.current = nextAppState;

      const vuelveAActivo =
        (anterior === "background" || anterior === "inactive") &&
        nextAppState === "active";

      if (!vuelveAActivo) return;
      if (!isMounted.current) return;

      console.log(
        "[AuthContext] App volvio a primer plano, verificando sesion...",
      );

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error(
            "[AuthContext] Error al obtener sesion en foreground:",
            error.message,
          );
          return;
        }

        // Sin sesion activa — onAuthStateChange ya lo maneja
        if (!data?.session) {
          console.log(
            "[AuthContext] Sin sesion activa al volver a primer plano",
          );
          return;
        }

        const expiresAt = data.session.expires_at * 1000;
        const ahora = Date.now();
        const tiempoRestanteMs = expiresAt - ahora;
        const cincoMinutosMs = 5 * 60 * 1000;

        console.log(
          "[AuthContext] Token expira en:",
          Math.round(tiempoRestanteMs / 1000 / 60),
          "minutos",
        );

        // Token vigente — no hacer nada
        if (tiempoRestanteMs >= cincoMinutosMs) return;

        // Token expirado o por expirar — refrescar
        console.log("[AuthContext] Refrescando token...");

        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError) {
          console.error(
            "[AuthContext] Error refrescando token:",
            refreshError.message,
          );
          // No se pudo refrescar — cerrar sesion limpiamente
          if (isMounted.current) {
            console.log("[AuthContext] Token invalido, cerrando sesion...");
            await signOut();
          }
          return;
        }

        console.log("[AuthContext] Token refrescado correctamente");

        // Si el perfil no esta cargado despues del refresh, recargarlo
        if (refreshData?.session?.user && !userProfile && isMounted.current) {
          console.log("[AuthContext] Recargando perfil tras refresh...");
          await loadProfile(refreshData.session.user.id);
        }
      } catch (e) {
        // Error inesperado — loguear pero no romper nada
        console.error(
          "[AuthContext] Error inesperado en verificacion de foreground:",
          e.message,
        );
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, [userProfile, loadProfile, signOut]);

  // ─── Sign out ─────────────────────────────────────────────────────────────
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
      console.error("[AuthContext] Error en signOut:", error);
      if (isMounted.current) {
        setUser(null);
        clearProfile();
      }
      return { error: null };
    }
  };

  // ─── Refresh de perfil ────────────────────────────────────────────────────
  const refreshProfile = async () => {
    if (user?.id) {
      return await refreshUserProfile(user.id);
    }
    return null;
  };

  // ─── Valores derivados ────────────────────────────────────────────────────
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
