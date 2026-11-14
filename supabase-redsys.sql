-- Pagament amb Redsys a la botiga. Executa-ho un cop a Supabase → SQL Editor → Run
alter table public.comandes add column if not exists ref text unique;
alter table public.comandes add column if not exists redsys_order text unique;
alter table public.comandes add column if not exists redsys_code int;
alter table public.comandes add column if not exists pagat_at timestamptz;
