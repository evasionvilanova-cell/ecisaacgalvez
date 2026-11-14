-- =============================================================
--  BOTIGA: catàleg de productes i comandes
--  Executa-ho un cop a Supabase → SQL Editor → Run
-- =============================================================
create table if not exists public.productes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nom text not null,
  categoria text,
  descripcio text,
  preu numeric(8,2) not null default 0,
  talles text,              -- separades per comes: XS, S, M, L
  imatges text,             -- una URL per línia
  actiu boolean default true,
  esgotat boolean default false,
  destacat boolean default false,
  ordre int default 0
);

create table if not exists public.comandes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  estat text default 'Nova',
  nom text not null, telefon text not null, email text not null,
  corredor text, pagament text, notes text,
  items jsonb not null,
  total numeric(9,2),
  pagada boolean default false,
  notes_admin text
);

alter table public.productes enable row level security;
alter table public.comandes  enable row level security;

drop policy if exists "admin all" on public.productes;
create policy "admin all" on public.productes for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin all" on public.comandes;
create policy "admin all" on public.comandes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Tothom veu els productes actius
drop policy if exists "public read" on public.productes;
create policy "public read" on public.productes for select using (actiu = true);

-- Tothom pot fer una comanda, però només l'admin les veu
drop policy if exists "public insert" on public.comandes;
create policy "public insert" on public.comandes for insert to anon, authenticated
  with check (estat = 'Nova' and pagada = false and notes_admin is null and jsonb_array_length(items) between 1 and 50);
