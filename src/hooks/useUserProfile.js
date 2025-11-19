/**
 * useUserProfile.js
 *
 * Hook para manejo de perfil de usuario
 *
 * PROPÓSITO:
 * - Separar lógica de carga de perfil del hook principal
 * - Reutilizable en otros contextos si es necesario
 * - Más fácil de testear y mantener
 *
 * USO:
 * const { userProfile, profileError, loadProfile, refreshProfile } = useUserProfile();
 */

import { useState, useRef } from "react";
import { supabase } from "../config/supabase";

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const isMounted = useRef(true);

  /**
   * Carga el perfil del usuario desde la BD
   *
   * @param {string} authUserId - ID del usuario autenticado
   * @returns {Promise<object|null>} Perfil del usuario o null si hay error
   */
  const loadProfile = async (authUserId) => {
    if (!authUserId) {
      console.error("[useUserProfile] authUserId es requerido");
      return null;
    }

    try {
      if (isMounted.current) {
        setProfileLoading(true);
        setProfileError(null);
      }

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
        console.error("[useUserProfile] Error cargando perfil:", error);

        if (error.code === "PGRST116") {
          const errorMsg = new Error(
            "Tu usuario no está registrado en el sistema. Contacta al administrador."
          );
          errorMsg.code = "NO_PROFILE";

          if (isMounted.current) {
            setProfileError(errorMsg);
          }
          return null;
        }

        if (isMounted.current) {
          setProfileError(error);
        }
        return null;
      }

      if (data && isMounted.current) {
        setUserProfile(data);
        setProfileError(null);
        return data;
      }

      return null;
    } catch (error) {
      console.error("[useUserProfile] Error inesperado:", error);

      if (isMounted.current) {
        setProfileError(error);
      }
      return null;
    } finally {
      if (isMounted.current) {
        setProfileLoading(false);
      }
    }
  };

  /**
   * Limpia el perfil actual
   */
  const clearProfile = () => {
    if (isMounted.current) {
      setUserProfile(null);
      setProfileError(null);
      setProfileLoading(false);
    }
  };

  /**
   * Recarga el perfil usando el ID actual
   *
   * @param {string} authUserId - ID del usuario autenticado
   */
  const refreshProfile = async (authUserId) => {
    if (!authUserId) {
      console.error("[useUserProfile] No hay authUserId para refrescar");
      return null;
    }
    return await loadProfile(authUserId);
  };

  return {
    userProfile,
    profileError,
    profileLoading,
    loadProfile,
    clearProfile,
    refreshProfile,
    setIsMounted: (value) => {
      isMounted.current = value;
    },
  };
};
