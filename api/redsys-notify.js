// POST /api/redsys-notify — Redsys avisa aquí del resultat del pagament.
import { redsysConfig } from "../lib/redsys.js";
import { applyNotification } from "../lib/botiga.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const cfg = redsysConfig();
  const b = typeof req.body === "string" ? Object.fromEntries(new URLSearchParams(req.body)) : req.body || {};
  if (cfg) {
    const r = await applyNotification(cfg, b.Ds_MerchantParameters, b.Ds_Signature).catch((e) => { console.error(e); return { ok: false }; });
    if (!r.ok || r.paid === false) console.warn("Redsys notify", r);
  }
  return res.status(200).send("OK");
}
