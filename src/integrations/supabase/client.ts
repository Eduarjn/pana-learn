
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oqoxhavdhrgdjvxvajze.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xb3hoYXZkaHJnZGp2eHZhanplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDAyODQsImV4cCI6MjA5MDUwMDI4NH0.5GGVnENUhOw3DlgxNW5Qik5sT8Tf4Cg7AyfA-PcAWbM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
