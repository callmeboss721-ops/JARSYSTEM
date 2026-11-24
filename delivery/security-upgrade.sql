-- ============================================================================
-- JAGUAR SPK Delivery — Security Upgrade (Supabase SQL Editor)
-- Moves rider_pin & admin_pin verification to server-side SECURITY DEFINER RPC
-- and prevents anonymous clients from reading PIN rows out of dt_settings.
-- Safe to run multiple times (idempotent).
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Server-side PIN verifier (supports both bcrypt hashes and legacy plaintext during migration)
create or replace function public.verify_dt_pin(p_role text, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text;
  v_stored text;
begin
  if p_pin is null or length(trim(p_pin)) < 4 or length(trim(p_pin)) > 32 then
    return false;
  end if;

  if p_role = 'rider' then
    v_key := 'rider_pin';
  elsif p_role = 'admin' then
    v_key := 'admin_pin';
  else
    return false;
  end if;

  select value into v_stored
  from public.dt_settings
  where key = v_key
  limit 1;

  if v_stored is null or length(v_stored) = 0 then
    return false;
  end if;

  -- If stored as bcrypt hash ($2a$ / $2b$ / $2y$), verify via pgcrypto crypt()
  if v_stored ~ '^\$2[aby]\$' then
    return extensions.crypt(trim(p_pin), v_stored) = v_stored;
  end if;

  -- Legacy plaintext fallback until owner hashes the PIN via set_dt_pin_hash()
  return extensions.digest(trim(p_pin), 'sha256') = extensions.digest(v_stored, 'sha256');
end;
$$;

revoke all on function public.verify_dt_pin(text, text) from public;
grant execute on function public.verify_dt_pin(text, text) to anon, authenticated;

-- 2. Owner-only helper (run from Supabase SQL Editor) to store salted bcrypt PIN hashes:
--    SELECT public.set_dt_pin_hash('rider', 'NEW_RIDER_PIN');
--    SELECT public.set_dt_pin_hash('admin', 'NEW_ADMIN_PIN');
create or replace function public.set_dt_pin_hash(p_role text, p_new_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text;
begin
  if p_role = 'rider' then
    v_key := 'rider_pin';
  elsif p_role = 'admin' then
    v_key := 'admin_pin';
  else
    raise exception 'Invalid role: %', p_role;
  end if;

  if p_new_pin is null or length(trim(p_new_pin)) < 4 then
    raise exception 'PIN must be at least 4 characters';
  end if;

  insert into public.dt_settings(key, value)
  values (v_key, extensions.crypt(trim(p_new_pin), extensions.gen_salt('bf', 10)))
  on conflict (key) do update set value = excluded.value;
end;
$$;

revoke all on function public.set_dt_pin_hash(text, text) from public, anon, authenticated;

-- 3. Restrict anonymous SELECT on dt_settings so PIN keys are never readable by browsers
alter table public.dt_settings enable row level security;

drop policy if exists "dt_settings_public_read_non_secret" on public.dt_settings;
create policy "dt_settings_public_read_non_secret"
  on public.dt_settings
  for select
  to anon, authenticated
  using (key not in ('rider_pin', 'admin_pin'));
