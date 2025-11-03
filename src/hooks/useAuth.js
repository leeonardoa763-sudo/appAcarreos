// src/hooks/useAuth.js
import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 🆕 Flag para ignorar sesiones durante logout

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        // 🆕 Ignorar si estamos haciendo logout
        if (isLoggingOut) {
          console.log("⏸️ Ignorando sesión inicial durante logout");
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Error obteniendo sesión:", error);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Error en getInitialSession:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 🆕 Ignorar TODOS los eventos durante logout
      if (isLoggingOut) {
        console.log("⏸️ Ignorando evento durante logout:", event);
        return;
      }

      setUser(session?.user ?? null);
      setProfileError(null);

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoggingOut]); // 🆕 Dependencia agregada

  const fetchUserProfile = async (authUserId) => {
    try {
      const { data, error } = await supabase
        .from("persona")
        .select(
          `
          *,
          roles:id_role (
            id_roles,
            role
          ),
          obras:id_current_obra (
            id_obra,
            obra,
            cc
          )
        `
        )
        .eq("auth_user_id", authUserId)
        .single();

      if (error) {
        console.error("❌ Error cargando perfil:", error);

        if (error.code === "PGRST116") {
          const errorMsg = new Error(
            "Tu usuario no está registrado en el sistema. Contacta al administrador."
          );
          errorMsg.code = "NO_PROFILE";
          setProfileError(errorMsg);
        } else {
          setProfileError(error);
        }
      } else if (data) {
        setUserProfile(data);
        setProfileError(null);
      }
    } catch (error) {
      console.error("❌ Error inesperado en fetchUserProfile:", error);
      setProfileError(error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("🚪 Iniciando cierre de sesión...");

      // 🆕 PASO 1: Activar flag de logout PRIMERO
      setIsLoggingOut(true);
      setLoading(true);

      // 🆕 PASO 2: Limpiar AsyncStorage ANTES de signOut
      try {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;
        const allKeys = await AsyncStorage.getAllKeys();
        const supabaseKeys = allKeys.filter((key) => key.includes("supabase"));

        if (supabaseKeys.length > 0) {
          await AsyncStorage.multiRemove(supabaseKeys);
          console.log(
            "✅ AsyncStorage limpiado:",
            supabaseKeys.length,
            "claves eliminadas"
          );
        }
      } catch (storageError) {
        console.error("❌ Error limpiando AsyncStorage:", storageError);
      }

      // 🆕 PASO 3: Limpiar estados
      setUser(null);
      setUserProfile(null);
      setProfileError(null);

      // 🆕 PASO 4: SignOut de Supabase (ahora sin sesión en storage)
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.log("ℹ️ Error en signOut (ignorado):", signOutError.message);
      }

      return { error: null };
    } catch (error) {
      console.error("❌ Error crítico en signOut:", error);

      // Limpiar estados de todas formas
      setUser(null);
      setUserProfile(null);
      setProfileError(null);

      return { error: null };
    } finally {
      setLoading(false);
      // 🆕 Desactivar flag después de un pequeño delay
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 500);
    }
  };

  return {
    user,
    userProfile,
    loading,
    profileError,
    signOut,
    isAuthenticated: !!user && !isLoggingOut, // 🆕 Considerar flag de logout
    userRole: userProfile?.roles?.role,
    hasProfile: !!userProfile,
    userName: userProfile
      ? `${userProfile.nombre} ${userProfile.primer_apellido}`.trim()
      : null,
    currentObra: userProfile?.obras?.obra || null,
  };
};
