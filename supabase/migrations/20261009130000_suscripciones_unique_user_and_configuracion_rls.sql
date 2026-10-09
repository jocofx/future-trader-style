-- Aplicada en producción el 2026-10-09.

-- Un usuario = una fila de suscripción. Lo necesitan create-checkout y
-- stripe-webhook, que guardan con upsert por user_id.
alter table public.suscripciones
  add constraint suscripciones_user_id_key unique (user_id);

-- configuracion tenía RLS desactivado: cualquiera con la clave pública podía
-- leer y escribir la configuración de todos los usuarios. Las políticas
-- "solo lo propio" ya existían; aquí solo se activan.
alter table public.configuracion enable row level security;
