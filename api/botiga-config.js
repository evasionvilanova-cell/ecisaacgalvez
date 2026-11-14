// GET /api/botiga-config — indica a la botiga si el pagament online està actiu.
import { redsysConfig } from "../lib/redsys.js";
import { supaReady } from "../lib/supa.js";

export default function handler(req, res) {
  const cfg = redsysConfig();
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ online: !!(cfg && supaReady()), bizum: !!(cfg && cfg.bizum), test: !!(cfg && cfg.env === "test") });
}
