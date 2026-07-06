/**
 * hooks/useTutorialSeen.js
 *
 * Recuerda localmente (AsyncStorage, no Supabase) si el usuario ya
 * completó u omitió el tutorial de su rol, para ocultar el label
 * "¿Eres nuevo en la app?" después de la primera vez. El botón de
 * ayuda ("?") nunca se oculta, solo el label.
 */

import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const keyFor = (role) => `@tutorial_seen:${role}`;

export const useTutorialSeen = (role) => {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!role) return;
    AsyncStorage.getItem(keyFor(role))
      .then((value) => setSeen(value === "true"))
      .catch(() => {});
  }, [role]);

  const markSeen = useCallback(async () => {
    setSeen(true);
    try {
      await AsyncStorage.setItem(keyFor(role), "true");
    } catch {
      // No bloquear la UI si falla el storage local.
    }
  }, [role]);

  return { seen, markSeen };
};
