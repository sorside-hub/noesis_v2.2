import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv[key]) {
    return metaEnv[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  return '';
};

const getActiveSupabaseConfig = (): { url: string; key: string } => {
  let url = '';
  let key = '';
  
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      url = localStorage.getItem('noesis_supabase_url') || '';
      key = localStorage.getItem('noesis_supabase_anon_key') || '';
    }
  } catch (e) {
    console.error('Error reading localStorage for Supabase keys:', e);
  }

  if (!url) {
    url = getEnvVar('VITE_SUPABASE_URL');
  }
  if (!key) {
    key = getEnvVar('VITE_SUPABASE_ANON_KEY');
  }

  return { url: url.trim(), key: key.trim() };
};

let supabaseInstance: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getActiveSupabaseConfig();
  if (!url || !key) return false;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('placeholder') || lowerUrl.includes('your_supabase') || key.includes('placeholder')) return false;
  return lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://');
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const { url, key } = getActiveSupabaseConfig();
  if (!supabaseInstance || cachedUrl !== url || cachedKey !== key) {
    cachedUrl = url;
    cachedKey = key;
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();
