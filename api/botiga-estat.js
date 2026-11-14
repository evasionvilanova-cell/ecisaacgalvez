// GET /api/botiga-estat?comanda=REF&t=TOKEN — estat de la comanda per a la pàgina de retorn.
import { supaReady, rest } from "../lib/supa.js";
import { orderToken } from "../lib/botiga.js";

export default async function handler(req, res) {
  const ref = String(req.query.comanda || "").replace(/\D/g, "").slice(0, 12), t = String(req.query.t || "");
  if (!supaReady() || !ref || t !== orderToken(ref)) return res.status(404).json({ error: "No trobada" });
  const c = (await rest(`comandes?select=ref,estat,pagada,total&ref=eq.${encodeURIComponent(ref)}`).catch(() => []))[0];
  if (!c) return res.status(404).json({ error: "No trobada" });
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(c);
}
