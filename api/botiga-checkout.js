// POST /api/botiga-checkout — crea la comanda amb preus del servidor i prepara el pagament Redsys.
import { supaReady, rest } from "../lib/supa.js";
import { redsysConfig, buildPayment } from "../lib/redsys.js";
import { priceCart, newRedsysOrder, orderToken, CheckoutError } from "../lib/botiga.js";

const str = (v, n = 300) => String(v ?? "").trim().slice(0, n);

function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${req.headers["x-forwarded-host"] || req.headers.host}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Mètode no permès" });
  const cfg = redsysConfig();
  if (!cfg || !supaReady()) return res.status(503).json({ error: "El pagament online encara no està activat.", noPayment: true });

  const d = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const c = d.customer || {};
  const err = [];
  if (!str(c.nom)) err.push("Escriu el teu nom.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str(c.email))) err.push("Revisa el correu.");
  if (str(c.telefon).replace(/\D/g, "").length < 9) err.push("Escriu un telèfon de 9 xifres.");
  if (!["card", "bizum"].includes(d.method)) err.push("Tria com vols pagar.");
  if (d.method === "bizum" && !cfg.bizum) err.push("Bizum no està disponible.");
  if (err.length) return res.status(400).json({ error: err.join(" ") });

  let price;
  try { price = await priceCart(d.items); }
  catch (e) {
    if (e instanceof CheckoutError) return res.status(422).json({ error: e.message });
    console.error(e); return res.status(500).json({ error: "Error preparant la comanda." });
  }

  const redsysOrder = newRedsysOrder();
  const ref = redsysOrder.slice(4); // 8 xifres, el que veu el client
  try {
    // Si no es pot desar la comanda, NO s'envia el client a Redsys (evita pagaments orfes).
    await rest("comandes", {
      method: "POST", prefer: "return=minimal",
      body: {
        ref, redsys_order: redsysOrder, estat: "Pendent de pagament", pagada: false,
        nom: str(c.nom, 120), telefon: str(c.telefon, 40), email: str(c.email, 200).toLowerCase(),
        corredor: str(c.corredor, 120), notes: str(c.notes, 1000),
        pagament: d.method === "bizum" ? "Bizum (Redsys)" : "Targeta (Redsys)",
        items: price.lines, total: price.total,
      },
    });
  } catch (e) {
    console.error(e); return res.status(500).json({ error: "No s'ha pogut desar la comanda. No s'ha fet cap cobrament." });
  }

  const site = siteUrl(req), t = orderToken(ref);
  const pay = buildPayment(cfg, {
    amount: price.total, order: redsysOrder, method: d.method,
    notifyUrl: `${site}/api/redsys-notify`,
    okUrl: `${site}/botiga.html?comanda=${ref}&t=${t}&pagament=ok`,
    koUrl: `${site}/botiga.html?comanda=${ref}&t=${t}&pagament=ko`,
    description: `Comanda ${ref} · Botiga EC Isaac Gálvez`, holder: str(c.nom, 60),
    merchantName: process.env.REDSYS_MERCHANT_NAME,
  });
  return res.status(200).json({ ref, total: price.total, lines: price.lines, redsys: pay });
}
