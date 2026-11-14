// Accés a Supabase des del servidor (Vercel) amb la clau secreta: salta les regles RLS.
// La clau NO va mai a les pàgines; només viu a les variables d'entorn de Vercel.
const URL_ = () => (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

export function supaReady() { return !!(URL_() && KEY()); }

function headers(extra) {
  const k = KEY();
  const h = { apikey: k, "Content-Type": "application/json", ...extra };
  if (k.startsWith("eyJ")) h.Authorization = `Bearer ${k}`; // clau antiga (JWT service_role)
  return h;
}

export async function rest(path, { method = "GET", body, prefer } = {}) {
  const r = await fetch(`${URL_()}/rest/v1/${path}`, {
    method,
    headers: headers(prefer ? { Prefer: prefer } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${data && (data.message || data.hint) || text}`);
  return data;
}
