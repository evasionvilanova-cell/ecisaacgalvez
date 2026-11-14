-- Afegeix el formulari de contacte. Executa-ho un cop a Supabase → SQL Editor → Run
create table if not exists public.missatges (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nom text not null, email text not null, telefon text, motiu text,
  missatge text not null check (char_length(missatge) <= 5000),
  llegit boolean default false
);
alter table public.missatges enable row level security;
drop policy if exists "admin all" on public.missatges;
create policy "admin all" on public.missatges for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public insert" on public.missatges;
create policy "public insert" on public.missatges for insert to anon, authenticated with check (llegit = false);
