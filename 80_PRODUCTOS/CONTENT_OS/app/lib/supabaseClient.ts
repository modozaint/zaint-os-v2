import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '')
const supabaseKey = process.env.SUPABASE_SERVICE_KEY?.trim()

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridas en .env.local')
}
if (!/^https?:\/\//.test(supabaseUrl)) {
  throw new Error(
    `SUPABASE_URL debe ser la URL completa (https://xxxx.supabase.co), no "${supabaseUrl}"`
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
