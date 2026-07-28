-- Ejecutá este script completo en Supabase: Dashboard → SQL Editor → New query → Run
-- Crea la tabla de movimientos y las reglas de seguridad para que cada persona
-- solo pueda ver y modificar sus propios datos.

create extension if not exists "pgcrypto";

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  category text not null,
  amount numeric not null check (amount > 0),
  description text default '',
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

-- Row Level Security: nadie puede ver datos de otra persona
alter table public.transactions enable row level security;

create policy "Los usuarios ven solo sus movimientos"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Los usuarios insertan solo sus movimientos"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios editan solo sus movimientos"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Los usuarios borran solo sus movimientos"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ===================== AHORROS =====================
-- "Potes" de ahorro: pueden tener una meta (target_amount) o no.

create table if not exists public.savings_pots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric,
  created_at timestamptz not null default now()
);

alter table public.savings_pots enable row level security;

create policy "Los usuarios ven solo sus potes"
  on public.savings_pots for select
  using (auth.uid() = user_id);

create policy "Los usuarios crean solo sus potes"
  on public.savings_pots for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios editan solo sus potes"
  on public.savings_pots for update
  using (auth.uid() = user_id);

create policy "Los usuarios borran solo sus potes"
  on public.savings_pots for delete
  using (auth.uid() = user_id);

-- Aportes hechos a cada pote de ahorro

create table if not exists public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pot_id uuid not null references public.savings_pots(id) on delete cascade,
  amount numeric not null check (amount > 0),
  date date not null,
  note text default '',
  created_at timestamptz not null default now()
);

create index if not exists savings_contributions_pot_idx
  on public.savings_contributions (pot_id, date desc);

alter table public.savings_contributions enable row level security;

create policy "Los usuarios ven solo sus aportes"
  on public.savings_contributions for select
  using (auth.uid() = user_id);

create policy "Los usuarios crean solo sus aportes"
  on public.savings_contributions for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios borran solo sus aportes"
  on public.savings_contributions for delete
  using (auth.uid() = user_id);

-- ===================== LECTURA DE CORREOS DEL BANCO =====================

-- Guarda la conexión de Gmail de cada usuario (contraseña de aplicación, no OAuth).
-- Ver nota en el código: usamos IMAP + contraseña de aplicación porque el acceso
-- OAuth de Google en modo "Testing" expira cada 7 días para un proyecto personal
-- no verificado, lo cual rompería la sincronización automática cada semana.
create table if not exists public.gmail_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_address text not null,
  app_password text not null,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.gmail_connections enable row level security;

create policy "Los usuarios ven solo su conexion"
  on public.gmail_connections for select
  using (auth.uid() = user_id);

create policy "Los usuarios crean solo su conexion"
  on public.gmail_connections for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios editan solo su conexion"
  on public.gmail_connections for update
  using (auth.uid() = user_id);

create policy "Los usuarios borran solo su conexion"
  on public.gmail_connections for delete
  using (auth.uid() = user_id);

-- Diccionario de comercio -> categoria, aprende con cada clasificacion manual
create table if not exists public.merchant_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_key text not null,
  category text not null,
  created_at timestamptz not null default now(),
  unique (user_id, merchant_key)
);

alter table public.merchant_categories enable row level security;

create policy "Los usuarios ven solo su diccionario"
  on public.merchant_categories for select
  using (auth.uid() = user_id);

create policy "Los usuarios crean solo su diccionario"
  on public.merchant_categories for insert
  with check (auth.uid() = user_id);

create policy "Los usuarios editan solo su diccionario"
  on public.merchant_categories for update
  using (auth.uid() = user_id);

create policy "Los usuarios borran solo su diccionario"
  on public.merchant_categories for delete
  using (auth.uid() = user_id);

-- Agregamos columnas a transactions para saber si vino de un correo,
-- de que banco, el comercio crudo, y evitar importarla dos veces
alter table public.transactions
  add column if not exists source text not null default 'manual',
  add column if not exists bank text,
  add column if not exists merchant_raw text,
  add column if not exists email_ref text,
  add column if not exists needs_review boolean not null default false,
  add column if not exists tx_kind text not null default 'purchase';

create unique index if not exists transactions_email_ref_unique
  on public.transactions (user_id, email_ref)
  where email_ref is not null;
