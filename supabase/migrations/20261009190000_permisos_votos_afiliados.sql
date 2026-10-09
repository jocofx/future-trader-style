-- Aplicada en producción el 2026-10-09.
-- Cierra los huecos de permisos que quedaban. Todo es reversible y no borra datos.

-- ── 1. Sugerencias: el contador de votos lo lleva la base de datos ─────────
-- Antes la web hacía "votos = votos + 1" directamente, lo que obligaba a dejar
-- que cualquier usuario modificase cualquier sugerencia.
create or replace function public.sugerencias_sync_votos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sid uuid;
begin
  if tg_op = 'DELETE' then sid := old.sugerencia_id; else sid := new.sugerencia_id; end if;
  update public.sugerencias s
     set votos = (select count(*) from public.sugerencias_votos v where v.sugerencia_id = sid)
   where s.id = sid;
  return null;
end;
$$;

create trigger sugerencias_votos_sync
  after insert or delete on public.sugerencias_votos
  for each row execute function public.sugerencias_sync_votos();

-- La política "vote" (cualquiera modifica cualquier sugerencia) queda anulada.
alter policy "vote" on public.sugerencias using (false) with check (false);

-- Cambiar estado/título de una sugerencia: solo el administrador.
alter policy "admin_update" on public.sugerencias
  using      (auth.uid() = '7b14f1e1-4e5a-41e9-a3cc-48161ca41adb'::uuid)
  with check (auth.uid() = '7b14f1e1-4e5a-41e9-a3cc-48161ca41adb'::uuid);

-- ── 2. Suscripciones: el usuario no puede modificar su propia fila ─────────
-- (podía ponerse plan = 'pro'). Solo la escriben las funciones del servidor.
alter policy "Users can update own subscription" on public.suscripciones
  using (false) with check (false);

-- ── 3. Afiliados ────────────────────────────────────────────────────────────
-- El administrador no veía las solicitudes de pago de los demás.
create policy "admin_all_payouts" on public.affiliate_payouts
  for all to authenticated
  using      (auth.uid() = '7b14f1e1-4e5a-41e9-a3cc-48161ca41adb'::uuid)
  with check (auth.uid() = '7b14f1e1-4e5a-41e9-a3cc-48161ca41adb'::uuid);

-- Un afiliado solo puede cambiar sus datos de contacto/cobro, no su estado,
-- su código ni sus totales.
create or replace function public.affiliates_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Servidor (sin sesión de usuario) y administrador: sin restricciones
  if auth.uid() is null or auth.uid() = '7b14f1e1-4e5a-41e9-a3cc-48161ca41adb'::uuid then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.total_clicks       := 0;
    new.total_conversiones := 0;
    new.total_ganado       := 0;
    new.approved_at        := null;
  else
    new.user_id            := old.user_id;
    new.codigo             := old.codigo;
    new.estado             := old.estado;
    new.total_clicks       := old.total_clicks;
    new.total_conversiones := old.total_conversiones;
    new.total_ganado       := old.total_ganado;
    new.approved_at        := old.approved_at;
  end if;
  return new;
end;
$$;

create trigger affiliates_guard
  before insert or update on public.affiliates
  for each row execute function public.affiliates_guard();

-- Solicitudes de pago: el importe lo calcula la base de datos (comisiones sin
-- pagar), siempre nacen "pending" y el afiliado no puede modificarlas después.
create or replace function public.affiliate_payouts_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pendiente numeric;
begin
  if auth.uid() is null or auth.uid() = '7b14f1e1-4e5a-41e9-a3cc-48161ca41adb'::uuid then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    raise exception 'Una solicitud de pago no se puede modificar';
  end if;

  if not exists (select 1 from public.affiliates a
                  where a.id = new.affiliate_id and a.user_id = auth.uid()) then
    raise exception 'Afiliado no válido';
  end if;

  if exists (select 1 from public.affiliate_payouts p
              where p.affiliate_id = new.affiliate_id
                and p.status in ('pending', 'approved')) then
    raise exception 'Ya tienes una solicitud de pago en curso';
  end if;

  select coalesce(sum(c.comision), 0) into pendiente
    from public.affiliate_conversions c
   where c.affiliate_id = new.affiliate_id and not coalesce(c.pagado, false);

  if pendiente < 20 then
    raise exception 'El mínimo de retiro es $20';
  end if;

  new.user_id      := auth.uid();
  new.amount       := pendiente;
  new.status       := 'pending';
  new.admin_notes  := null;
  new.processed_at := null;
  return new;
end;
$$;

create trigger affiliate_payouts_guard
  before insert or update on public.affiliate_payouts
  for each row execute function public.affiliate_payouts_guard();

-- ── 4. Bot de MT5: consulta de órdenes pendientes (se hace cada pocos segundos)
create index if not exists idx_ea_commands_pendientes
  on public.ea_commands (ea_instance_id) where not executed;
