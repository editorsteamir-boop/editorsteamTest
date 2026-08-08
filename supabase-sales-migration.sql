-- EditorsTeam sales schema
create table if not exists public.sale_items (
  sale_id text primary key,
  kind text not null,
  owner_name text,
  item_label text,
  thumbnail text,
  media_type text default 'image',
  price_toman bigint not null default 0 check (price_toman >= 0),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists public.sale_secrets (
  sale_id text primary key references public.sale_items(sale_id) on delete cascade,
  download_url text,
  updated_at timestamptz not null default now()
);
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  sale_id text not null references public.sale_items(sale_id),
  amount_toman bigint not null,
  authority text,
  ref_id text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.sale_items enable row level security;
alter table public.sale_secrets enable row level security;
alter table public.purchases enable row level security;
drop policy if exists "public read active sale items" on public.sale_items;
create policy "public read active sale items" on public.sale_items for select to anon using (active = true);
drop policy if exists "admin manage sale items" on public.sale_items;
create policy "admin manage sale items" on public.sale_items for all to authenticated using (true) with check (true);
drop policy if exists "admin manage sale secrets" on public.sale_secrets;
create policy "admin manage sale secrets" on public.sale_secrets for all to authenticated using (true) with check (true);
drop policy if exists "admin read purchases" on public.purchases;
create policy "admin read purchases" on public.purchases for select to authenticated using (true);
