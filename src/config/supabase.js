// // src/config/supabase.js

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = "https://zqdnyqvgfymjorfplquf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZG55cXZnZnltam9yZnBscXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYzODYsImV4cCI6MjA3Njg0MjM4Nn0.OAdncNGmBSG4LdwNCTtfuSAIqYBK0JbaeBuSvUcCxNE"; // Copia la clave completa del dashboard

console.log("🔧 Inicializando Supabase...");
console.log("📍 URL:", supabaseUrl);
console.log(
  "🔑 Key (primeros 20 chars):",
  supabaseAnonKey.substring(0, 20) + "..."
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefr02eshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Test de conexión
supabase.auth
  .getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error("❌ Error en test de conexión:", error);
    } else {
      console.log("✅ Conexión exitosa con Supabase");
      console.log("📊 Sesión actual:", data.session ? "Existe" : "No existe");
    }
  })
  .catch((err) => {
    console.error("❌ Error crítico conectando con Supabase:", err);
  });
