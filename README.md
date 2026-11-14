# Web Escola de Ciclisme Isaac Gálvez

Web estàtica (HTML + JS) amb base de dades **Supabase**. Es publica sense compilar res.

## Què hi ha

| Fitxer | Què és |
|---|---|
| `index.html` | Portada, formulari d'inscripció, notícies, galeria, patrocinadors |
| `escola.html`, `competicions.html`, `carreres.html`, `equip.html` | Pàgines de la web |
| `admin.html` | Panell d'administració |
| `js/config.js` | **Claus de Supabase** (l'únic fitxer que cal editar) |
| `js/ecdb.js` | Connexió a la base de dades |
| `js/web.js` | Banner i pop-up de notícies, textos editables, llistat de notícies |
| `supabase.sql` | Taules + seguretat. S'executa un sol cop |

## Posar en marxa Supabase (un sol cop, tot des del navegador)

1. Crea un projecte gratuït a [supabase.com](https://supabase.com) (regió: West EU).
2. **SQL Editor** → enganxa tot `supabase.sql` → **canvia el correu** de la línia `insert into public.admins` pel de l'administrador → **Run**.
3. **Authentication → Users → Add user** → crea l'usuari amb aquell correu i una contrasenya (marca *Auto confirm*).
4. **Authentication → Sign In / Providers → Email** → desactiva *Allow new users to sign up*.
5. **Project Settings → API** → copia `Project URL` i `anon public key` dins `js/config.js` (editant-lo a GitHub).
6. Entra a `admin.html` → **Resum → Importar ara**: copia corredors, patrocinadors, competicions, carreres i textos de l'antic Google Sheets.

Mentre `js/config.js` no tingui claus, la web pública continua llegint l'antic Google Sheets (només lectura) i el formulari d'inscripció avisa que s'escrigui per correu.

## Panell d'administració

- **Inscripcions**: llistat, cerca, estat (Pendent / Confirmada / Baixa), fitxa amb notes internes, exportació a Excel.
- **Notícies / avisos**: una notícia pot sortir com a **banner** (franja a dalt de totes les pàgines) o com a **pop-up** en entrar.
- **Pàgina d'inici, Patrocinadors, Corredors, Competicions, Carreres pròpies**: com abans, i ara amb botó per pujar imatges.

Per afegir un altre administrador: crea l'usuari (pas 3) i afegeix el seu correu a la taula `admins` (Table Editor).
