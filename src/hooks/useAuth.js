// src/hooks/useAuth.js - VERSIÓN COMPLETA
import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error obteniendo sesión:", error);
        setLoading(false);
        return;
      }

      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Evento de auth:", event);
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

  //  FUNCIÓN QUE TE FALTA - BUSCAR PERFIL EN PERSONA
  const fetchUserProfile = async (authUserId) => {
    try {
      console.log("🔍 Buscando perfil para auth_user_id:", authUserId);

      const { data, error } = await supabase
        .from("persona")
        .select(
          `
          *,
          roles (role),
          obras (obra)
        `
        )
        .eq("auth_user_id", authUserId)
        .single();

      if (error) {
        console.error("❌ Error cargando perfil:", error);
        setProfileError(error);

        // Si es error de "no encontrado", mostrar mensaje específico
        if (error.code === "PGRST116") {
          setProfileError(
            new Error("Usuario sin perfil configurado en el sistema")
          );
        }
      } else {
        console.log("✅ Perfil cargado:", data.nombre, data.roles?.role);
        setUserProfile(data);
        setProfileError(null);
      }
    } catch (error) {
      console.error("❌ Error en fetchUserProfile:", error);
      setProfileError(error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setProfileError(null);
    return { error };
  };

  return {
    user,
    userProfile,
    loading,
    profileError, // ← para mostrar errores específicos
    signOut,
    isAuthenticated: !!user,
    userRole: userProfile?.roles?.role,
    hasProfile: !!userProfile, // ← para verificar si tiene perfil
  };
};

// // src/hooks/useAuth.js
// import { useState, useEffect } from "react";
// import { supabase } from "../config/supabase";

// export const useAuth = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Obtener sesión actual al cargar la app
//     const getInitialSession = async () => {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();
//       setUser(session?.user ?? null);
//       setLoading(false);
//     };

//     getInitialSession();

//     // Escuchar cambios en la autenticación
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((event, session) => {
//       setUser(session?.user ?? null);
//       setLoading(false);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const signOut = async () => {
//     const { error } = await supabase.auth.signOut();
//     return { error };
//   };

//   return {
//     user,
//     loading,
//     signOut,
//     isAuthenticated: !!user,
//   };
// };
