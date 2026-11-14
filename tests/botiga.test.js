// Proves del pagament Redsys de la botiga (sense xarxa: Supabase simulat).
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://demo.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_demo";
process.env.REDSYS_MERCHANT_CODE = "999008881";
process.env.REDSYS_SECRET_KEY = "sq7HjrUOBfKmC576ILgskD5srU870gJ7"; // clau pública de proves de Redsys
process.env.REDSYS_ENV = "test";

const P1 = "11111111-1111-1111-1111-111111111111";
let DB;
function reset() {
  DB = { productes: [{ id: P1, nom: "Maillot", preu: 45, talles: "S, M, L", actiu: true, esgotat: false }], comandes: [] };
}
globalThis.fetch = async (url, opt = {}) => {
  const u = new URL(url), table = u.pathname.split("/").pop();
  const q = Object.fromEntries(u.searchParams);
  const match = (r) => Object.entries(q).every(([k, v]) => k === "select" || (v.startsWith("eq.") ? String(r[k]) === decodeURIComponent(v.slice(3)) : v.startsWith("in.(") ? v.slice(4, -1).split(",").includes(r[k]) : true));
  let out = null;
  if ((opt.method || "GET") === "GET") out = DB[table].filter(match);
  if (opt.method === "POST") { DB[table].push({ id: "c" + DB[table].length, ...JSON.parse(opt.body) }); }
  if (opt.method === "PATCH") DB[table].filter(match).forEach((r) => Object.assign(r, JSON.parse(opt.body)));
  return new Response(out ? JSON.stringify(out) : "", { status: 200 });
};

const { default: checkout } = await import("../api/botiga-checkout.js");
const { default: notify } = await import("../api/redsys-notify.js");
const { redsysConfig, signNotification } = await import("../lib/redsys.js");

function fakeRes() {
  const r = { code: 200, body: null, headers: {} };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.send = (b) => { r.body = b; return r; };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  return r;
}
const req = (body) => ({ method: "POST", body, headers: { host: "web.test", "x-forwarded-proto": "https" }, query: {} });
const cust = { nom: "Anna", email: "anna@x.cat", telefon: "600111222" };

test("el preu surt de la base de dades, no del navegador", async () => {
  reset();
  const res = fakeRes();
  await checkout(req({ method: "card", customer: cust, items: [{ id: P1, talla: "M", q: 2, preu: 0.01 }] }), res);
  assert.equal(res.code, 200);
  assert.equal(res.body.total, 90);
  assert.equal(DB.comandes[0].total, 90);
  assert.equal(DB.comandes[0].estat, "Pendent de pagament");
  assert.match(res.body.redsys.url, /sis-t\.redsys\.es/);
  const mp = JSON.parse(Buffer.from(res.body.redsys.fields.Ds_MerchantParameters, "base64"));
  assert.equal(mp.DS_MERCHANT_AMOUNT, "9000");
  assert.equal(mp.DS_MERCHANT_MERCHANTURL, "https://web.test/api/redsys-notify");
  assert.match(mp.DS_MERCHANT_ORDER, /^\d{12}$/);
});

test("rebutja talla incorrecta i producte esgotat", async () => {
  reset();
  let res = fakeRes();
  await checkout(req({ method: "card", customer: cust, items: [{ id: P1, talla: "XXL", q: 1 }] }), res);
  assert.equal(res.code, 422);
  DB.productes[0].esgotat = true;
  res = fakeRes();
  await checkout(req({ method: "card", customer: cust, items: [{ id: P1, talla: "M", q: 1 }] }), res);
  assert.equal(res.code, 422);
  assert.equal(DB.comandes.length, 0);
});

test("notificació correcta → comanda pagada; signatura falsa → res", async () => {
  reset();
  const res = fakeRes();
  await checkout(req({ method: "bizum", customer: cust, items: [{ id: P1, talla: "S", q: 1 }] }), res);
  const order = DB.comandes[0].redsys_order;
  const cfg = redsysConfig();
  const bad = signNotification(cfg, { Ds_Order: order, Ds_Amount: "4500", Ds_Response: "0000" });
  await notify(req({ ...bad, Ds_Signature: bad.Ds_Signature.slice(0, -4) + "AAAA" }), fakeRes());
  assert.equal(DB.comandes[0].pagada, false);
  const good = signNotification(cfg, { Ds_Order: order, Ds_Amount: "4500", Ds_Response: "0000" });
  await notify(req(good), fakeRes());
  assert.equal(DB.comandes[0].pagada, true);
  assert.equal(DB.comandes[0].estat, "Pagada");
});

test("import diferent o pagament denegat no marca pagada", async () => {
  reset();
  await checkout(req({ method: "card", customer: cust, items: [{ id: P1, talla: "L", q: 1 }] }), fakeRes());
  const cfg = redsysConfig(), order = DB.comandes[0].redsys_order;
  await notify(req(signNotification(cfg, { Ds_Order: order, Ds_Amount: "100", Ds_Response: "0000" })), fakeRes());
  assert.equal(DB.comandes[0].pagada, false);
  assert.equal(DB.comandes[0].estat, "Revisar pagament");
  await notify(req(signNotification(cfg, { Ds_Order: order, Ds_Amount: "4500", Ds_Response: "0190" })), fakeRes());
  assert.equal(DB.comandes[0].pagada, false);
});
