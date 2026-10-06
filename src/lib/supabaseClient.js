import { createClient } from "@supabase/supabase-js";

const getSupabaseConfig = () => {
  let url = import.meta.env.VITE_SUPABASE_URL || "";
  let key = import.meta.env.VITE_SUPABASE_KEY || "";

  if (typeof window !== "undefined") {
    const customUrl = localStorage.getItem("polimdo_custom_supabase_url");
    const customKey = localStorage.getItem("polimdo_custom_supabase_key");
    if (customUrl && customKey) {
      url = customUrl.trim();
      key = customKey.trim();
    }
  }

  // Sanitize trailing slashes
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }

  return { url, key };
};

const config = getSupabaseConfig();

let client = null;
if (config.url && config.key) {
  try {
    client = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (err) {
    console.warn("Supabase client init error:", err);
    client = null;
  }
}

export const supabase = client;

export const setCustomSupabaseConfig = (url, key) => {
  if (typeof window === "undefined") return;
  if (url && key) {
    localStorage.setItem("polimdo_custom_supabase_url", url.trim());
    localStorage.setItem("polimdo_custom_supabase_key", key.trim());
  } else {
    localStorage.removeItem("polimdo_custom_supabase_url");
    localStorage.removeItem("polimdo_custom_supabase_key");
  }
  window.location.reload();
};

export default supabase;


