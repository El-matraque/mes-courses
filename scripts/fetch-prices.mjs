/**
 * Relevé automatique des prix via les actors Apify → met à jour data/prix.csv.
 *
 * Usage : APIFY_TOKEN=xxx node scripts/fetch-prices.mjs
 * (en CI : le token vient du secret GitHub APIFY_TOKEN, jamais commité)
 *
 * Principe : 1 run d'actor PAR ENSEIGNE avec tous les termes de recherche
 * (≈ 45 produits), puis rapprochement par nom normalisé. Les cellules non
 * trouvées gardent leur ancienne valeur ; date_releve n'est mise à jour que
 * pour les prix réellement relevés.
 *
 * ⚠️ À AJUSTER une fois les actors choisis sur apify.com : les champs
 * `id`, `input` et `map` de ACTORS dépendent du schéma de chaque actor
 * (voir l'onglet "Input" et un run d'exemple sur sa page Apify).
 * Un actor non configuré (id vide) est simplement ignoré.
 */

import fs from "node:fs";

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) { console.error("APIFY_TOKEN manquant"); process.exit(1); }

const CSV_PATH = new URL("../data/prix.csv", import.meta.url).pathname;

/* -------------------- CONFIG DES ACTORS (Apify) --------------------- */
/* id : "utilisateur~nom-actor" (le "/" de l'URL devient "~").
   Schéma Studio Amba (vérifié 08/2026) : { searchQuery, maxResults,
   language } — UNE recherche par run, donc 1 run par produit.
   Coût ≈ 2 $/1000 résultats → ~0,30 $/enseigne pour 45 produits.       */
const ACTORS = {
  colruyt: {
    id: "studio-amba~colruyt-scraper",
    input: (term) => ({ searchQuery: term, maxResults: 3, language: "fr" }),
    map: (r) => ({ name: r.name || r.title, price: num(r.price), promo: r.promotion || r.promo || "" }),
  },
  delhaize: {
    id: "studio-amba~delhaize-scraper",
    input: (term) => ({ searchQuery: term, maxResults: 3, language: "fr" }),
    map: (r) => ({ name: r.name || r.title, price: num(r.price), promo: r.promotion || r.promo || "" }),
  },
  carrefour: {
    id: "", // Aucun actor Carrefour BELGIQUE sur Apify (08/2026 — seuls carrefour.fr existent).
            // → relevés via Claude in Chrome ou saisie manuelle dans le CSV.
    input: (term) => ({ searchQuery: term, maxResults: 3 }),
    map: (r) => ({ name: r.name || r.title, price: num(r.price), promo: r.promotion || "" }),
  },
};
const CONCURRENCY = 3; // runs Apify en parallèle

/* --------------------------- Utilitaires --------------------------- */
const num = (v) => {
  if (typeof v === "number") return v;
  if (!v) return null;
  const f = parseFloat(String(v).replace(/[€\s]/g, "").replace(",", "."));
  return isNaN(f) ? null : f;
};
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// promo texte de l'enseigne → format de l'app ("-20%" | "1+1" | "2e-50")
function normPromo(txt) {
  const t = norm(txt || "");
  if (!t) return "";
  let m = t.match(/-?\s*(\d+)\s*%/); if (m) return `-${m[1]}%`;
  if (/1\s*\+\s*1|2e (gratuit|offert)/.test(t)) return "1+1";
  if (/2e?m?e? a? ?-?50/.test(t)) return "2e-50";
  return "";
}

function parseCsv(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const head = lines[0].split(";");
  return { head, rows: lines.slice(1).map((l) => l.split(";")) };
}
const col = (head, name) => head.indexOf(name);

async function runActor(actorId, input) {
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${TOKEN}&timeout=300`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Apify ${actorId}: HTTP ${res.status} — ${await res.text()}`);
  return res.json();
}

/* ------------------------------ Main ------------------------------- */
const csv = parseCsv(fs.readFileSync(CSV_PATH, "utf-8"));
const { head, rows } = csv;
const iNom = col(head, "nom");
const today = new Date().toISOString().slice(0, 10);
let updated = 0;

async function processStore(store, cfg) {
  const iP = col(head, `prix_${store}`), iPr = col(head, `promo_${store}`), iD = col(head, "date_releve");
  const queue = rows.filter((r) => (r[iNom] || "").trim());
  console.log(`→ ${store} : ${queue.length} recherches (1 run/produit, ${CONCURRENCY} en parallèle)…`);
  let done = 0;
  async function worker() {
    while (queue.length) {
      const row = queue.shift();
      const term = row[iNom];
      let items;
      try { items = (await runActor(cfg.id, cfg.input(term))).map(cfg.map).filter((x) => x.name && x.price != null); }
      catch (e) { console.error(`  ✗ ${store}/${term} : ${e.message} (ancienne valeur conservée)`); continue; }
      // candidats dont le nom contient tous les mots significatifs du produit
      const words = norm(term).split(" ").filter((w) => w.length > 2);
      const cands = items.filter((x) => { const n = norm(x.name); return words.every((w) => n.includes(w)); });
      const pool = cands.length ? cands : items; // sinon 1er résultat de recherche
      if (!pool.length) continue;
      const best = pool.reduce((a, b) => (a.price <= b.price ? a : b));
      row[iP] = best.price.toFixed(2).replace(".", ",");
      row[iPr] = normPromo(best.promo);
      row[iD] = today;
      updated++; done++;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`  ✓ ${store} : ${done} produits relevés`);
}

for (const [store, cfg] of Object.entries(ACTORS)) {
  if (!cfg.id) { console.log(`− ${store} : pas d'actor (relevé manuel / Claude in Chrome)`); continue; }
  await processStore(store, cfg);
}

fs.writeFileSync(CSV_PATH, "﻿" + [head.join(";"), ...rows.map((r) => r.join(";"))].join("\n") + "\n", "utf-8");
console.log(`✓ ${updated} cellule(s) prix mises à jour → data/prix.csv`);
