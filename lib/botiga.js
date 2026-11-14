// Lògica de la botiga al servidor: preus des de la base de dades (mai del navegador)
// i aplicació de la notificació de Redsys.
import crypto from "node:crypto";
import { rest } from "./supa.js";
import { readNotification } from "./redsys.js";

export class CheckoutError extends Error {}

const str = (v, n = 300) => String(v ?? "").trim().slice(0, n);

// Calcula el total amb els preus de la base de dades i valida talles i disponibilitat.
export async function priceCart(rawItems) {
  const items = (Array.isArray(rawItems) ? rawItems : []).slice(0, 50)
    .map((i) => ({ id: str(i && i.id, 64), talla: str(i && i.talla, 20), q: Math.floor(Number(i && i.q)) }))
    .filter((i) => /^[0-9a-f-]{36}$/i.test(i.id));
  if (!items.length) throw new CheckoutError("La cistella és buida.");
  if (items.some((i) => !(i.q >= 1 && i.q <= 20))) throw new CheckoutError("Quantitat no vàlida.");
  const ids = [...new Set(items.map((i) => i.id))];
  const prods = await rest(`productes?select=id,nom,preu,talles,actiu,esgotat&id=in.(${ids.join(",")})`);
  const byId = new Map(prods.map((p) => [p.id, p]));
  const lines = items.map((i) => {
    const p = byId.get(i.id);
    if (!p || !p.actiu) throw new CheckoutError("Algun producte ja no està disponible. Torna a carregar la botiga.");
    if (p.esgotat) throw new CheckoutError(`«${p.nom}» està esgotat.`);
    const talles = String(p.talles || "").split(",").map((t) => t.trim()).filter(Boolean);
    if (talles.length && !talles.includes(i.talla)) throw new CheckoutError(`Tria una talla vàlida per a «${p.nom}».`);
    const preu = Math.round(Number(p.preu) * 100) / 100;
    return { id: p.id, nom: p.nom, talla: talles.length ? i.talla : "", preu, q: i.q };
  });
  const total = Math.round(lines.reduce((a, l) => a + l.preu * l.q, 0) * 100) / 100;
  if (!(total > 0)) throw new CheckoutError("L'import ha de ser més gran que 0.");
  return { lines, total };
}

// Número de comanda per a Redsys: 12 xifres, les 4 primeres numèriques (requisit de Redsys).
export function newRedsysOrder() {
  const d = new Date();
  const yy = String(d.getUTCFullYear()).slice(2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return yy + mm + String(crypto.randomInt(0, 1e8)).padStart(8, "0");
}

// Signatura curta per veure l'estat d'una comanda des de la pàgina de retorn sense exposar dades.
export function orderToken(ref) {
  const k = process.env.REDSYS_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "x";
  return crypto.createHmac("sha256", k).update(String(ref)).digest("hex").slice(0, 20);
}

// Aplica la notificació de Redsys a la comanda. Idempotent.
export async function applyNotification(cfg, mp, sig) {
  const n = readNotification(cfg, mp, sig);
  if (!n) return { ok: false, why: "signatura" };
  const rows = await rest(`comandes?select=id,total,pagada,estat&redsys_order=eq.${encodeURIComponent(n.order)}`);
  const c = rows[0];
  if (!c) return { ok: false, why: "comanda no trobada", order: n.order };
  if (c.pagada) return { ok: true, already: true };
  const now = new Date().toISOString();
  if (n.authorized && Math.round(Number(c.total) * 100) === Math.round(n.amount * 100)) {
    await rest(`comandes?id=eq.${c.id}&pagada=eq.false`, { method: "PATCH", body: { pagada: true, estat: "Pagada", redsys_code: n.code, pagat_at: now } });
    return { ok: true, paid: true };
  }
  const why = n.authorized ? `import diferent (${n.amount} € vs ${c.total} €)` : `denegat (codi ${n.code})`;
  await rest(`comandes?id=eq.${c.id}&pagada=eq.false`, { method: "PATCH", body: { estat: n.authorized ? "Revisar pagament" : "Pagament fallit", redsys_code: n.code, notes_admin: `Redsys: ${why}` } });
  return { ok: true, paid: false, why };
}
