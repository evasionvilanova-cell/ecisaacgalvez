-- =============================================================
--  Escola de Ciclisme Isaac Gálvez — base de dades (Supabase)
--  Supabase → SQL Editor → enganxa tot aquest fitxer → Run
--  ⚠️ Abans, canvia el correu de l'administrador (secció ADMINISTRADORS)
-- =============================================================

-- ---------- Contingut de la web ----------
create table if not exists public.corredors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null, cat text, img text, num text, notes text
);

create table if not exists public.patrocinadors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null, img text, web text
);

create table if not exists public.competicions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null, date text, place text, cat text, status text, url text, notes text
);

create table if not exists public.carreres (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null, date text, edition text, description text, img text, url text
);

create table if not exists public.config (
  key text primary key,
  value text
);

create table if not exists public.noticies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  data date not null default current_date,
  titol text not null, resum text, text text, imatge text, enllac text, boto text,
  activa boolean default true, banner boolean default false, popup boolean default false
);

-- ---------- Inscripcions (dades privades) ----------
create table if not exists public.inscripcions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  estat text default 'Pendent',
  nom text not null, cognoms text not null, data_naixement date,
  grup text, talla text, llicencia text, salut text,
  tutor_nom text not null, tutor_dni text, tutor_telefon text not null, tutor_email text not null,
  poblacio text, comentaris text,
  consent_imatge boolean default false, consent_rgpd boolean default false,
  notes_admin text
);

-- ---------- ADMINISTRADORS ----------
-- Només aquests correus poden entrar al panell. Pots afegir-ne més.
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;
insert into public.admins (email) values ('ecisaacgalvez@gmail.com') on conflict do nothing;  -- ⚠️ CANVIA'L

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

-- ---------- Seguretat (Row Level Security) ----------
do $$
declare t text;
begin
  foreach t in array array['corredors','patrocinadors','competicions','carreres','config','noticies','inscripcions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
  -- Lectura pública del contingut
  foreach t in array array['corredors','patrocinadors','competicions','carreres','config'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
  end loop;
end $$;

drop policy if exists "public read" on public.noticies;
create policy "public read" on public.noticies for select using (activa = true);

-- Tothom pot ENVIAR una inscripció, però ningú (excepte admins) la pot llegir
drop policy if exists "public insert" on public.inscripcions;
create policy "public insert" on public.inscripcions for insert to anon, authenticated
  with check (consent_rgpd = true and estat = 'Pendent' and notes_admin is null);

-- ---------- Imatges (Storage) ----------
insert into storage.buckets (id, name, public) values ('imatges', 'imatges', true)
  on conflict (id) do nothing;
drop policy if exists "imatges read" on storage.objects;
drop policy if exists "imatges admin insert" on storage.objects;
drop policy if exists "imatges admin delete" on storage.objects;
create policy "imatges read" on storage.objects for select using (bucket_id = 'imatges');
create policy "imatges admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'imatges' and public.is_admin());
create policy "imatges admin delete" on storage.objects for delete to authenticated using (bucket_id = 'imatges' and public.is_admin());
