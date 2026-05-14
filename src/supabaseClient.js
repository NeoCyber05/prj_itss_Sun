import { createClient } from '@supabase/supabase-js';

// VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY sẽ được cấu hình trong file .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    persistSession: true,
  },
});
