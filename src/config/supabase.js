// src/config/supabase.js
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = "https://zqdnyqvgfymjorfplquf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZG55cXZnZnltam9yZnBscXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYzODYsImV4cCI6MjA3Njg0MjM4Nn0.OAdncNGmBSG4LdwNCTtfuSAIqYBK0JbaeBuSvUcCxNE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
