/**
 * GET /api/prices — source de prix de l'app "Mes Courses".
 *
 * ⚠️ ÉTAT ACTUEL : données 100 % SIMULÉES (retournées par le provider "mock").
 *
 * C'est ICI qu'on branchera de vraies données plus tard. L'app front ne
 * change pas : elle consomme toujours { stores, catalog } au même format.
 *
 * Pistes réalistes pour de vraies données (voir README) :
 *  1. API tierce de scraping (Apify "colruyt-supermarket-be", "carrefour-scraper",
 *     RealDataAPI Delhaize, Pepesto /catalog…) → appeler leur API ici avec une
 *     clé stockée en variable d'environnement Netlify (ex. APIFY_TOKEN).
 *  2. Scraper maison (Playwright) exécuté en dehors de Netlify (GitHub Actions
 *     planifié) qui publie un prices.json ; cette fonction le lit/proxifie.
 *  3. Saisie manuelle : éditer PROVIDERS.mock ci-dessous ou un JSON committé.
 *
 * Exemple de branchement :
 *   const PROVIDER = process.env.PRICE_PROVIDER || "mock";
 *   if (PROVIDER === "apify") { ...fetch avec process.env.APIFY_TOKEN... }
 */

const STORES = [
  { id: "delhaize",  name: "Delhaize",  color: "#CE1126", url: "https://www.delhaize.be" },
  { id: "carrefour", name: "Carrefour", color: "#004E9F", url: "https://www.carrefour.be" },
  { id: "colruyt",   name: "Colruyt",   color: "#F07D00", url: "https://www.colruyt.be" },
];

// Format d'un prix : { p: <prix unitaire €>, promo?: { t: "pct"|"1+1"|"2e-50", v?: <pourcent> } }
// null = article indisponible dans cette enseigne.
const CATALOG = [
  {"id": "bananes", "name": "Bananes", "unit": "1 kg", "cat": "🍎 Fruits & Légumes", "prices": {"delhaize": {"p": 1.99}, "carrefour": {"p": 1.89, "promo": {"t": "pct", "v": 20}}, "colruyt": {"p": 1.75}}, "famille": "bananes"},
  {"id": "pommes", "name": "Pommes Jonagold", "unit": "2 kg", "cat": "🍎 Fruits & Légumes", "prices": {"delhaize": {"p": 4.49}, "carrefour": {"p": 4.29}, "colruyt": {"p": 3.99}}, "famille": "pommes"},
  {"id": "tomates", "name": "Tomates grappe", "unit": "1 kg", "cat": "🍎 Fruits & Légumes", "prices": {"delhaize": {"p": 3.29}, "carrefour": {"p": 2.99}, "colruyt": {"p": 2.79}}, "famille": "tomates"},
  {"id": "carottes", "name": "Carottes", "unit": "1 kg", "cat": "🍎 Fruits & Légumes", "prices": {"delhaize": {"p": 1.49}, "carrefour": {"p": 1.39}, "colruyt": {"p": 1.19}}, "famille": "carottes"},
  {"id": "pdt", "name": "Pommes de terre", "unit": "2,5 kg", "cat": "🍎 Fruits & Légumes", "prices": {"delhaize": {"p": 3.99}, "carrefour": {"p": 3.79}, "colruyt": {"p": 3.49}}, "famille": "pdt"},
  {"id": "oignons", "name": "Oignons", "unit": "1 kg", "cat": "🍎 Fruits & Légumes", "prices": {"delhaize": {"p": 1.59}, "carrefour": {"p": 1.49}, "colruyt": {"p": 1.29}}, "famille": "oignons"},
  {"id": "salade", "name": "Salade iceberg", "unit": "pièce", "cat": "🍎 Fruits & Légumes", "prices": {"delhaize": {"p": 1.49}, "carrefour": {"p": 1.39}, "colruyt": {"p": 1.25}}, "famille": "salade"},
  {"id": "poivrons", "name": "Poivrons trio", "unit": "3 pièces", "cat": "🍎 Fruits & Légumes", "prices": {"delhaize": {"p": 2.99, "promo": {"t": "pct", "v": 25}}, "carrefour": {"p": 2.79}, "colruyt": {"p": 2.59}}, "famille": "poivrons"},
  {"id": "lait", "name": "Lait demi-écrémé", "unit": "1 L", "cat": "🥛 Crèmerie", "prices": {"delhaize": {"p": 1.09}, "carrefour": {"p": 1.05}, "colruyt": {"p": 0.95}}, "famille": "lait"},
  {"id": "beurre", "name": "Beurre doux", "unit": "250 g", "cat": "🥛 Crèmerie", "prices": {"delhaize": {"p": 3.29}, "carrefour": {"p": 2.99}, "colruyt": {"p": 2.89}}, "famille": "beurre"},
  {"id": "oeufs", "name": "Œufs M", "unit": "12 pièces", "cat": "🥛 Crèmerie", "prices": {"delhaize": {"p": 3.79, "promo": {"t": "pct", "v": 15}}, "carrefour": {"p": 3.49}, "colruyt": {"p": 3.29}}, "famille": "oeufs"},
  {"id": "yaourt", "name": "Yaourt nature", "unit": "4 × 125 g", "cat": "🥛 Crèmerie", "prices": {"delhaize": {"p": 2.19}, "carrefour": {"p": 1.99, "promo": {"t": "1+1"}}, "colruyt": {"p": 1.85}}, "famille": "yaourt"},
  {"id": "gouda", "name": "Gouda jeune tranches", "unit": "300 g", "cat": "🥛 Crèmerie", "prices": {"delhaize": {"p": 3.99}, "carrefour": {"p": 3.79}, "colruyt": {"p": 3.49}}, "famille": "gouda"},
  {"id": "rape", "name": "Emmental râpé", "unit": "200 g", "cat": "🥛 Crèmerie", "prices": {"delhaize": {"p": 2.49}, "carrefour": {"p": 2.29}, "colruyt": {"p": 2.19}}, "famille": "rape"},
  {"id": "poulet", "name": "Blanc de poulet", "unit": "500 g", "cat": "🥩 Viande & Poisson", "prices": {"delhaize": {"p": 6.49, "promo": {"t": "pct", "v": 25}}, "carrefour": {"p": 5.99}, "colruyt": {"p": 5.79}}, "famille": "poulet"},
  {"id": "hache", "name": "Haché porc & veau", "unit": "500 g", "cat": "🥩 Viande & Poisson", "prices": {"delhaize": {"p": 4.99}, "carrefour": {"p": 4.79}, "colruyt": {"p": 4.49}}, "famille": "hache"},
  {"id": "saumon", "name": "Pavés de saumon", "unit": "2 × 125 g", "cat": "🥩 Viande & Poisson", "prices": {"delhaize": {"p": 8.99}, "carrefour": {"p": 8.49}, "colruyt": {"p": 7.99, "promo": {"t": "pct", "v": 15}}}, "famille": "saumon"},
  {"id": "jambon", "name": "Jambon cuit", "unit": "200 g", "cat": "🥩 Viande & Poisson", "prices": {"delhaize": {"p": 3.49}, "carrefour": {"p": 3.29}, "colruyt": {"p": 2.99}}, "famille": "jambon"},
  {"id": "pain", "name": "Pain gris tranché", "unit": "800 g", "cat": "🍞 Boulangerie", "prices": {"delhaize": {"p": 2.59}, "carrefour": {"p": 2.39}, "colruyt": {"p": 2.19}}, "famille": "pain"},
  {"id": "baguette", "name": "Baguette", "unit": "pièce", "cat": "🍞 Boulangerie", "prices": {"delhaize": {"p": 1.19}, "carrefour": {"p": 1.09}, "colruyt": {"p": 0.99}}, "famille": "baguette"},
  {"id": "pistolets", "name": "Pistolets", "unit": "6 pièces", "cat": "🍞 Boulangerie", "prices": {"delhaize": {"p": 2.1}, "carrefour": null, "colruyt": {"p": 1.89}}, "famille": "pistolets"},
  {"id": "pates", "name": "Spaghetti", "unit": "500 g", "cat": "🥫 Épicerie", "prices": {"delhaize": {"p": 1.29}, "carrefour": {"p": 1.19, "promo": {"t": "2e-50"}}, "colruyt": {"p": 0.99}}, "famille": "pates"},
  {"id": "riz", "name": "Riz basmati", "unit": "1 kg", "cat": "🥫 Épicerie", "prices": {"delhaize": {"p": 2.99}, "carrefour": {"p": 2.79}, "colruyt": {"p": 2.59}}, "famille": "riz"},
  {"id": "sauce", "name": "Sauce tomate basilic", "unit": "420 g", "cat": "🥫 Épicerie", "prices": {"delhaize": {"p": 1.99}, "carrefour": {"p": 1.89}, "colruyt": {"p": 1.69}}, "famille": "sauce"},
  {"id": "huile", "name": "Huile d'olive extra vierge", "unit": "750 ml", "cat": "🥫 Épicerie", "prices": {"delhaize": {"p": 7.99, "promo": {"t": "pct", "v": 20}}, "carrefour": {"p": 7.49}, "colruyt": {"p": 6.99}}, "famille": "huile"},
  {"id": "cafe", "name": "Café moulu", "unit": "500 g", "cat": "🥫 Épicerie", "prices": {"delhaize": {"p": 6.49}, "carrefour": {"p": 5.99}, "colruyt": {"p": 5.69, "promo": {"t": "pct", "v": 20}}}, "famille": "cafe"},
  {"id": "confiture", "name": "Confiture de fraises", "unit": "450 g", "cat": "🥫 Épicerie", "prices": {"delhaize": {"p": 2.79}, "carrefour": {"p": 2.59}, "colruyt": {"p": 2.39}}, "famille": "confiture"},
  {"id": "muesli", "name": "Muesli croustillant", "unit": "750 g", "cat": "🥫 Épicerie", "prices": {"delhaize": {"p": 3.99}, "carrefour": {"p": 3.69}, "colruyt": {"p": 3.49}}, "famille": "muesli"},
  {"id": "chocolat", "name": "Chocolat noir", "unit": "100 g", "cat": "🥫 Épicerie", "prices": {"delhaize": {"p": 2.49, "promo": {"t": "1+1"}}, "carrefour": {"p": 2.29}, "colruyt": {"p": 2.19}}, "famille": "chocolat"},
  {"id": "frites", "name": "Frites surgelées", "unit": "1 kg", "cat": "🧊 Surgelés", "prices": {"delhaize": {"p": 2.89}, "carrefour": {"p": 2.69}, "colruyt": {"p": 2.49}}, "famille": "frites"},
  {"id": "epinards", "name": "Épinards en branches", "unit": "450 g", "cat": "🧊 Surgelés", "prices": {"delhaize": {"p": 2.19}, "carrefour": {"p": 1.99}, "colruyt": {"p": 1.89}}, "famille": "epinards"},
  {"id": "pizza", "name": "Pizza margherita", "unit": "pièce", "cat": "🧊 Surgelés", "prices": {"delhaize": {"p": 3.49}, "carrefour": {"p": 3.29, "promo": {"t": "pct", "v": 30}}, "colruyt": {"p": 2.99}}, "famille": "pizza"},
  {"id": "eau", "name": "Eau pétillante", "unit": "6 × 1,5 L", "cat": "🥤 Boissons", "prices": {"delhaize": {"p": 3.99}, "carrefour": {"p": 3.79}, "colruyt": {"p": 3.49}}, "famille": "eau"},
  {"id": "jus", "name": "Jus d'orange", "unit": "1 L", "cat": "🥤 Boissons", "prices": {"delhaize": {"p": 2.29}, "carrefour": {"p": 2.19}, "colruyt": {"p": 1.99}}, "famille": "jus"},
  {"id": "biere", "name": "Bière blonde", "unit": "6 × 33 cl", "cat": "🥤 Boissons", "prices": {"delhaize": {"p": 5.99, "promo": {"t": "pct", "v": 20}}, "carrefour": {"p": 5.79}, "colruyt": {"p": 5.49}}, "famille": "biere"},
  {"id": "pq", "name": "Papier toilette", "unit": "12 rouleaux", "cat": "🧴 Hygiène & Entretien", "prices": {"delhaize": {"p": 6.99}, "carrefour": {"p": 6.49, "promo": {"t": "pct", "v": 25}}, "colruyt": {"p": 5.99}}, "famille": "pq"},
  {"id": "lavevaisselle", "name": "Tablettes lave-vaisselle", "unit": "30 pièces", "cat": "🧴 Hygiène & Entretien", "prices": {"delhaize": {"p": 8.99}, "carrefour": {"p": 8.49}, "colruyt": {"p": 7.99, "promo": {"t": "1+1"}}}, "famille": "lavevaisselle"},
  {"id": "geldouche", "name": "Gel douche", "unit": "500 ml", "cat": "🧴 Hygiène & Entretien", "prices": {"delhaize": {"p": 3.29}, "carrefour": {"p": 2.99}, "colruyt": {"p": 2.79}}, "famille": "geldouche"},
  {"id": "lessive", "name": "Lessive liquide", "unit": "1,5 L", "cat": "🧴 Hygiène & Entretien", "prices": {"delhaize": {"p": 8.49}, "carrefour": {"p": 7.99}, "colruyt": {"p": 7.49}}, "famille": "lessive"},
  {"id": "dentifrice", "name": "Dentifrice", "unit": "2 × 75 ml", "cat": "🧴 Hygiène & Entretien", "prices": {"delhaize": {"p": 2.99}, "carrefour": {"p": 2.79}, "colruyt": {"p": 2.59}}, "famille": "dentifrice"},
  {"id": "lait-eco", "famille": "lait", "name": "Lait demi-écrémé premier prix", "unit": "1 L", "cat": "🥛 Crèmerie", "prices": {"delhaize": {"p": 0.89}, "carrefour": {"p": 0.85}, "colruyt": {"p": 0.85}}},
  {"id": "lait-bio", "famille": "lait", "name": "Lait demi-écrémé bio", "unit": "1 L", "cat": "🥛 Crèmerie", "prices": {"delhaize": {"p": 1.35}, "carrefour": {"p": 1.28}, "colruyt": {"p": 1.29}}},
  {"id": "pates-eco", "famille": "pates", "name": "Spaghetti premier prix", "unit": "500 g", "cat": "🥫 Épicerie", "prices": {"delhaize": {"p": 0.75}, "carrefour": {"p": 0.69}, "colruyt": {"p": 0.65}}},
  {"id": "cafe-eco", "famille": "cafe", "name": "Café moulu premier prix", "unit": "500 g", "cat": "🥫 Épicerie", "prices": {"delhaize": {"p": 4.29}, "carrefour": {"p": 3.99}, "colruyt": {"p": 3.89}}},
  {"id": "pq-eco", "famille": "pq", "name": "Papier toilette premier prix", "unit": "12 rouleaux", "cat": "🧴 Hygiène & Entretien", "prices": {"delhaize": {"p": 4.99}, "carrefour": {"p": 4.79}, "colruyt": {"p": 4.59}}}
];

// ---- Providers : "mock" aujourd'hui, vrais connecteurs demain ----
const PROVIDERS = {
  async mock() {
    return { stores: STORES, catalog: CATALOG, simulated: true };
  },
  // async apify() { ... fetch(`https://api.apify.com/...`, { headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}` }}) ... }
  // async json_publie() { ... fetch(process.env.PRICES_JSON_URL) ... }
};

export default async () => {
  const providerName = process.env.PRICE_PROVIDER || "mock";
  const provider = PROVIDERS[providerName] || PROVIDERS.mock;
  const data = await provider();
  return Response.json(
    { ...data, provider: providerName, generatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
};

export const config = { path: "/api/prices" };
