// src/hooks/useAuth.js
import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
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
      console.log("🔄 Evento de autenticación:", event);

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
  }, []);

  // Función para obtener el perfil del usuario desde la tabla persona
  const fetchUserProfile = async (authUserId) => {
    try {
      console.log("🔍 Buscando perfil para auth_user_id:", authUserId);

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

        // Error específico: usuario no tiene perfil en persona
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
        console.log("✅ Perfil cargado exitosamente:");
        console.log("   - Nombre:", data.nombre, data.primer_apellido);
        console.log("   - Role:", data.roles?.role);
        console.log("   - Obra actual:", data.obras?.obra);

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
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("❌ Error al cerrar sesión:", error);
        return { error };
      }

      // Limpiar estados
      setUser(null);
      setUserProfile(null);
      setProfileError(null);

      console.log("✅ Sesión cerrada exitosamente");
      return { error: null };
    } catch (error) {
      console.error("❌ Error inesperado al cerrar sesión:", error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    userProfile,
    loading,
    profileError,
    signOut,
    isAuthenticated: !!user,
    userRole: userProfile?.roles?.role,
    hasProfile: !!userProfile,
    // Datos adicionales útiles
    userName: userProfile
      ? `${userProfile.nombre} ${userProfile.primer_apellido}`.trim()
      : null,
    currentObra: userProfile?.obras?.obra || null,
  };
};
