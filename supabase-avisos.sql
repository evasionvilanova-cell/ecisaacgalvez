-- Data de fi per a notícies i pop-ups (desapareixen sols). Executa-ho un cop a Supabase → SQL Editor → Run
alter table public.noticies add column if not exists fins date;
