/**
 * Credenciales publicas. Vive aparte a proposito: `lib/supabase.ts` importa
 * `next/headers`, que NO puede entrar al bundle del navegador. Si el cliente
 * del navegador importara de alli, el build falla.
 */
export const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?? 'https://ubhdwijnqgzzpqiyinqc.supabase.co'
export const CLAVE_PUBLICA = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ?? 'sb_publishable_G5eddYGrFEaK-pX5hVucZQ_62IJjmkG'
