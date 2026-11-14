// ============================================================
//  CONFIGURACIÓ — Escola de Ciclisme Isaac Gálvez
// ============================================================
//  Enganxa aquí les claus de Supabase (Project Settings → API).
//  La "anon key" és pública: la seguretat la donen les regles
//  de supabase.sql (només els administradors poden escriure).
//
//  Mentre estiguin buides, la web continua llegint (només llegir)
//  les dades de l'antic Google Sheets perquè no es quedi buida.
// ============================================================
window.EC_CONFIG = {
  SUPABASE_URL: "https://dofujojcmeuqokjfstjx.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_uchtC1tX2giZKj4WtpC8gg_m1VzyjNo",

  // Correu de l'únic administrador. Al panell només caldrà posar la contrasenya.
  ADMIN_EMAIL: "ecisaacgalvez@gmail.com",

  // Antic backend (Google Sheets). Només s'usa per llegir mentre no hi ha
  // Supabase, i des del panell admin per importar les dades un sol cop.
  SHEETS_API: "https://script.google.com/macros/s/AKfycbxdOQBd700M-mx_soIeivMKOKp8PKespkl6A0JH0e2KyoATsPp-gFcF3RNnnJu_m8o7/exec"
};
