/**
 * useAuth.js
 *
 * Hook para manejo de autenticación y sesión de usuario
 *
 * PROPÓSITO:
 * - Gestionar estado de autenticación con Supabase
 * - Cargar perfil de usuario desde tabla persona
 * - Implementar timeouts automáticos para prevenir sesiones colgadas
 * - Limpiar sesión cuando la carga excede límites de tiempo
 *
 * TIMEOUTS IMPLEMENTADOS:
 * - Carga inicial: 15 segundos
 * - Carga de perfil: 8 segundos
 * - Si se excede, cierra sesión automáticamente
 */

import { useState, useEffect, useRef } from "react";
import { supabase } from "../config/supabase";
import {
  createTimeout,
  promiseWithTimeout,
  TIMEOUT_DURATIONS,
} from "../utils/sessionTimeout";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [timeoutError, setTimeoutError] = useState(null);

  // Referencias para manejar timeouts
  const initialLoadTimeoutRef = useRef(null);
  const profileFetchTimeoutRef = useRef(null);

  // Referencia para trackear si ya estamos fetching el perfil
  const isFetchingProfile = useRef(false);

  useEffect(() => {
    // Timeout para carga inicial de la app
    initialLoadTimeoutRef.current = createTimeout(() => {
      console.error("Timeout: La carga inicial excedió el límite de tiempo");
      setTimeoutError({
        message: "La carga está tardando demasiado. Verifica tu conexión.",
        action: "initial_load",
      });
      handleTimeoutCleanup();
    }, TIMEOUT_DURATIONS.INITIAL_LOAD);

    const getInitialSession = async () => {
      try {
        if (isLoggingOut) {
          console.log("Ignorando sesión inicial durante logout");
          return;
        }

        // Obtener sesión con timeout
        const sessionPromise = supabase.auth.getSession();
        const {
          data: { session },
          error,
        } = await promiseWithTimeout(
          sessionPromise,
          TIMEOUT_DURATIONS.SESSION_CHECK,
          "Timeout verificando sesión existente"
        );

        if (error) {
          console.error("Error obteniendo sesión:", error);
          // Cancelar timeout si hay error
          if (initialLoadTimeoutRef.current) {
            initialLoadTimeoutRef.current.clear();
          }
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }

        // Cancelar timeout si todo fue exitoso
        if (initialLoadTimeoutRef.current) {
          initialLoadTimeoutRef.current.clear();
        }
      } catch (error) {
        console.error("Error en getInitialSession:", error);

        // Si es error de timeout, mostrar mensaje específico
        if (error.message.includes("Timeout")) {
          setTimeoutError({
            message:
              "No se pudo conectar con el servidor. Verifica tu conexión.",
            action: "session_check",
          });
        }

        setLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Evento de autenticación:", event);

      // Ignorar eventos durante logout
      if (isLoggingOut) {
        console.log("Ignorando evento durante logout:", event);
        return;
      }

      setUser(session?.user ?? null);
      setProfileError(null);
      setTimeoutError(null);

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Cleanup al desmontar
    return () => {
      subscription.unsubscribe();

      // Limpiar timeouts activos
      if (initialLoadTimeoutRef.current) {
        initialLoadTimeoutRef.current.clear();
      }
      if (profileFetchTimeoutRef.current) {
        profileFetchTimeoutRef.current.clear();
      }
    };
  }, [isLoggingOut]);

  /**
   * Obtiene el perfil del usuario desde la tabla persona con timeout
   */
  const fetchUserProfile = async (authUserId) => {
    // Prevenir múltiples fetches simultáneos del mismo perfil
    if (isFetchingProfile.current) {
      console.log(
        "Fetch de perfil ya en progreso, ignorando llamada duplicada"
      );
      return;
    }

    try {
      isFetchingProfile.current = true;
      console.log("Buscando perfil para auth_user_id:", authUserId);

      // CRÍTICO: Cancelar timeout anterior si existe
      if (profileFetchTimeoutRef.current) {
        profileFetchTimeoutRef.current.clear();
        profileFetchTimeoutRef.current = null;
      }

      // Crear nuevo timeout para este fetch
      profileFetchTimeoutRef.current = createTimeout(() => {
        console.error("Timeout: La carga del perfil excedió el límite");
        setTimeoutError({
          message: "No se pudo cargar tu perfil. Verifica tu conexión.",
          action: "profile_fetch",
        });
        handleTimeoutCleanup();
      }, TIMEOUT_DURATIONS.PROFILE_FETCH);

      // Query con timeout
      const profilePromise = supabase
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

      const { data, error } = await promiseWithTimeout(
        profilePromise,
        TIMEOUT_DURATIONS.PROFILE_FETCH,
        "Timeout cargando perfil de usuario"
      );

      // Cancelar timeout si la operación completó
      if (profileFetchTimeoutRef.current) {
        profileFetchTimeoutRef.current.clear();
        profileFetchTimeoutRef.current = null;
      }

      if (error) {
        console.error("Error cargando perfil:", error);

        // Error específico: usuario no tiene perfil
        if (error.code === "PGRST116") {
          const errorMsg = new Error(
            "Tu usuario no está registrado en el sistema. Contacta al administrador."
          );
          errorMsg.code = "NO_PROFILE";
          setProfileError(errorMsg);
        } else if (error.message.includes("Timeout")) {
          // Error de timeout
          setTimeoutError({
            message: "La carga del perfil tardó demasiado. Intenta de nuevo.",
            action: "profile_fetch",
          });
        } else {
          setProfileError(error);
        }
      } else if (data) {
        console.log("Perfil cargado exitosamente");
        setUserProfile(data);
        setProfileError(null);
        setTimeoutError(null);
      }
    } catch (error) {
      console.error("Error inesperado en fetchUserProfile:", error);

      if (error.message.includes("Timeout")) {
        setTimeoutError({
          message: "La conexión está tardando demasiado. Intenta de nuevo.",
          action: "profile_fetch",
        });
      } else {
        setProfileError(error);
      }
    } finally {
      setLoading(false);
      isFetchingProfile.current = false;
    }
  };

  /**
   * Limpia la sesión cuando hay timeout
   */
  const handleTimeoutCleanup = async () => {
    console.log("Limpiando sesión por timeout");
    setLoading(false);

    // Limpiar estados
    setUser(null);
    setUserProfile(null);
    setProfileError(null);

    // Limpiar AsyncStorage
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      const allKeys = await AsyncStorage.getAllKeys();
      const supabaseKeys = allKeys.filter((key) => key.includes("supabase"));

      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
        console.log("AsyncStorage limpiado después de timeout");
      }
    } catch (error) {
      console.error("Error limpiando AsyncStorage:", error);
    }

    // Intentar cerrar sesión en Supabase
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log(
        "Error en signOut después de timeout (ignorado):",
        error.message
      );
    }
  };

  /**
   * Cierra la sesión del usuario
   */
  const signOut = async () => {
    try {
      console.log("Iniciando cierre de sesión");

      // Limpiar timeouts activos
      if (initialLoadTimeoutRef.current) {
        initialLoadTimeoutRef.current.clear();
      }
      if (profileFetchTimeoutRef.current) {
        profileFetchTimeoutRef.current.clear();
      }

      // Activar flag de logout
      setIsLoggingOut(true);
      setLoading(true);

      // Limpiar AsyncStorage antes de signOut
      try {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;
        const allKeys = await AsyncStorage.getAllKeys();
        const supabaseKeys = allKeys.filter((key) => key.includes("supabase"));

        if (supabaseKeys.length > 0) {
          await AsyncStorage.multiRemove(supabaseKeys);
          console.log(
            "AsyncStorage limpiado:",
            supabaseKeys.length,
            "claves eliminadas"
          );
        }
      } catch (storageError) {
        console.error("Error limpiando AsyncStorage:", storageError);
      }

      // Limpiar estados
      setUser(null);
      setUserProfile(null);
      setProfileError(null);
      setTimeoutError(null);

      // SignOut de Supabase
      try {
        await supabase.auth.signOut();
        console.log("SignOut de Supabase exitoso");
      } catch (signOutError) {
        console.log("Error en signOut (ignorado):", signOutError.message);
      }

      console.log("Sesión cerrada completamente");
      return { error: null };
    } catch (error) {
      console.error("Error crítico en signOut:", error);

      // Limpiar estados de todas formas
      setUser(null);
      setUserProfile(null);
      setProfileError(null);
      setTimeoutError(null);

      return { error: null };
    } finally {
      setLoading(false);
      // Desactivar flag después de un pequeño delay
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 500);
    }
  };

  /**
   * Reintenta cargar la sesión después de un timeout
   */
  const retryLoad = async () => {
    setTimeoutError(null);
    setLoading(true);
    setProfileError(null);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error reintentando carga:", error);
      setTimeoutError({
        message: "No se pudo reconectar. Verifica tu conexión.",
        action: "retry_failed",
      });
      setLoading(false);
    }
  };

  return {
    user,
    userProfile,
    loading,
    profileError,
    timeoutError,
    signOut,
    retryLoad,
    isAuthenticated: !!user && !isLoggingOut,
    userRole: userProfile?.roles?.role,
    hasProfile: !!userProfile,
    userName: userProfile
      ? `${userProfile.nombre} ${userProfile.primer_apellido}`.trim()
      : null,
    currentObra: userProfile?.obras?.obra || null,
  };
};
