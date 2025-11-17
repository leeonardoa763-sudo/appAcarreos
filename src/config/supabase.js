// // src/config/supabase.js

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Test de conexión
supabase.auth
  .getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error(" Error en test de conexión:", error);
    } else {
      console.log(" [supabase] Conexión exitosa con Supabase");
    }
  })
  .catch((err) => {
    console.error(" Error crítico conectando con Supabase:", err);
  });
