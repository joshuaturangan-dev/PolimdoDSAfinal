import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local if present
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config();

const OFFICIAL_SUPABASE_URL = "https://wfrofqrctxveenpqlino.supabase.co";
const OFFICIAL_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcm9mcXJjdHh2ZWVucHFsaW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0Mjg1NzksImV4cCI6MjEwNzAwNDU3OX0.OjFCNaBY0L6bWk7W5kitCowGe6tT1kB-zvu_Df-ztI8";

let rawUrl = process.env.SUPABASE_URL || OFFICIAL_SUPABASE_URL;
if (rawUrl.endsWith("/rest/v1/")) {
  rawUrl = rawUrl.replace("/rest/v1/", "");
} else if (rawUrl.endsWith("/rest/v1")) {
  rawUrl = rawUrl.replace("/rest/v1", "");
}
if (rawUrl.endsWith("/")) {
  rawUrl = rawUrl.slice(0, -1);
}

const supabaseUrl = rawUrl;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || OFFICIAL_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

if (isSupabaseConfigured) {
  console.log("⚡ Connected to Supabase Cloud Database:", supabaseUrl);
} else {
  console.log("ℹ️ Supabase credentials not set. Using local JSON store.");
}

export default supabase;

