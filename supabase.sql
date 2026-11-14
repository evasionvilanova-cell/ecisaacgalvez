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

-- ---------- Missatges del formulari de contacte (privats) ----------
create table if not exists public.missatges (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nom text not null, email text not null, telefon text, motiu text,
  missatge text not null check (char_length(missatge) <= 5000),
  llegit boolean default false
);

-- ---------- ADMINISTRADORS ----------
-- Només aquests correus poden entrar al panell. Pots afegir-ne més.
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;
insert into public.admins (email) values ('ecisaacgalvez@gmail.com') on conflict do nothing;  -- ⚠️ El mateix correu que ADMIN_EMAIL de js/config.js

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

-- ---------- Seguretat (Row Level Security) ----------
do $$
declare t text;
begin
  foreach t in array array['corredors','patrocinadors','competicions','carreres','config','noticies','inscripcions','missatges'] loop
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

-- Tothom pot ENVIAR un missatge de contacte, però només els admins el poden llegir
drop policy if exists "public insert" on public.missatges;
create policy "public insert" on public.missatges for insert to anon, authenticated
  with check (llegit = false);

-- ---------- Imatges (Storage) ----------
insert into storage.buckets (id, name, public) values ('imatges', 'imatges', true)
  on conflict (id) do nothing;
drop policy if exists "imatges read" on storage.objects;
drop policy if exists "imatges admin insert" on storage.objects;
drop policy if exists "imatges admin delete" on storage.objects;
create policy "imatges read" on storage.objects for select using (bucket_id = 'imatges');
create policy "imatges admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'imatges' and public.is_admin());
create policy "imatges admin delete" on storage.objects for delete to authenticated using (bucket_id = 'imatges' and public.is_admin());


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
  notes_admin text,
  ref text unique,
  redsys_order text unique,
  redsys_code int,
  pagat_at timestamptz
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
