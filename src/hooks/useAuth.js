/**
 * useAuth.js
 *
 * Hook que consume el AuthContext.
 * La lógica de autenticación vive en AuthContext.js
 */
import { useAuthContext } from "../context/AuthContext";

export const useAuth = () => {
  return useAuthContext();
};
