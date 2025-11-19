/**
 * useAuth.js - VERSIÓN FINAL REFACTORIZADA (B1+B2+B3)
 *
 * CAMBIOS B3:
 * - ✅ Usa useUserProfile hook separado
 * - ✅ useAuth más simple y enfocado en autenticación
 * - ✅ Lógica de perfil aislada y reutilizable
 *
 * TOTAL DE MEJORAS PASO B:
 * - ✅ B1: Utilidad clearSupabaseStorage
 * - ✅ B2: Optimización con useMemo
 * - ✅ B3: Hook useUserProfile separado
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../config/supabase";
import { clearSupabaseStorage } from "../utils/storageUtils";
import { useUserProfile } from "./useUserProfile";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMounted = useRef(true);

  // 🆕 B3: Hook separado para perfil
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
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[useAuth] Error obteniendo sesión:", error);
          if (isMounted.current) {
            setLoading(false);
          }
          return;
        }

        if (isMounted.current) {
          setUser(session?.user ?? null);
        }

        if (session?.user) {
          // 🆕 Usar loadProfile del hook
          await loadProfile(session.user.id);
        }

        if (isMounted.current) {
          setLoading(false);
        }
      } catch (error) {
        console.error("[useAuth] Error en initializeAuth:", error);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted.current) return;

      if (event === "SIGNED_OUT") {
        if (isMounted.current) {
          setUser(null);
          clearProfile();
          setLoading(false);
        }
        return;
      }

      if (isMounted.current) {
        setUser(session?.user ?? null);
      }

      if (session?.user) {
        // 🆕 Usar loadProfile del hook
        await loadProfile(session.user.id);
      } else {
        if (isMounted.current) {
          clearProfile();
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted.current = false;
      setProfileMounted(false);
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Cierra la sesión del usuario
   */
  const signOut = async () => {
    try {
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

  /**
   * Recarga el perfil del usuario actual
   */
  const refreshProfile = async () => {
    if (user?.id) {
      return await refreshUserProfile(user.id);
    }
    return null;
  };

  // Valores derivados optimizados con useMemo
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

  return {
    // Estados base
    user,
    userProfile,
    loading: loading || profileLoading,
    profileError,

    // Funciones
    signOut,
    refreshProfile,

    // Valores derivados optimizados
    ...derivedValues,
  };
};
