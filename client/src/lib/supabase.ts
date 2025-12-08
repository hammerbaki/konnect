import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;
let supabasePromise: Promise<SupabaseClient> | null = null;

async function initSupabase(): Promise<SupabaseClient> {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  const response = await fetch("/api/config");
  
  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.status}`);
  }
  
  const config = await response.json();
  
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("Supabase configuration not available");
  }
  
  supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey);
  return supabaseInstance;
}

export function getSupabase(): Promise<SupabaseClient> {
  if (!supabasePromise) {
    supabasePromise = initSupabase();
  }
  return supabasePromise;
}
