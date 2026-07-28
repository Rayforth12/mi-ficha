// Cliente de Supabase con la llave de servicio (service_role).
// SOLO se usa en rutas de servidor de confianza (el sync automático por cron),
// nunca en el navegador, porque esta llave se salta la seguridad por fila (RLS).
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
