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
