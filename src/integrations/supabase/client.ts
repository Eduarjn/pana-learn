import { createClient } from '@supabase/supabase-js'

// URL e chave pública vêm de env vars (VITE_*) para permitir rotacionar a chave
// sem editar código — basta atualizar a env var e rebuildar. A chave pública
// pode ser a `anon` legacy ou a nova `sb_publishable_*` (ambas funcionam aqui).
// O fallback mantém dev/local funcionando caso a env var não esteja definida.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://oqoxhavdhrgdjvxvajze.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xb3hoYXZkaHJnZGp2eHZhanplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDAyODQsImV4cCI6MjA5MDUwMDI4NH0.5GGVnENUhOw3DlgxNW5Qik5sT8Tf4Cg7AyfA-PcAWbM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
