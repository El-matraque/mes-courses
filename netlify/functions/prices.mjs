/**
 * GET /api/prices — source de prix alternative de l'app "Mes Courses".
 *
 * ⚠️ HISTORIQUE IMPORTANT
 * Cette fonction embarquait un catalogue "mock" de 45 produits génériques aux
 * prix INVENTÉS ("Bière blonde", "Yaourt nature", "Gel douche"). Ils ont été
 * supprimés le 2026-08-24, en même temps que leurs équivalents dans
 * data/prix.csv et dans le fallback de index.html.
 *
 * Le risque était concret : sur GitHub Pages cette route n'existe pas (404),
 * mais sur Netlify elle répond. Le moindre incident sur data/prix.csv aurait
 * donc réinjecté silencieusement les faux prix dans l'app.
 *
 * ⚠️ NE JAMAIS REMETTRE DE CATALOGUE EN DUR ICI. Cette route ne doit servir
 * que des prix réellement relevés, venus d'une source identifiée.
 *
 * La source de vérité reste data/prix.csv. Ceci n'est qu'un point de
 * branchement pour plus tard :
 *  1. API tierce de scraping (Apify, RealDataAPI, Pepesto…) appelée ici avec
 *     une clé en variable d'environnement Netlify.
 *  2. Scraper maison exécuté hors Netlify publiant un prices.json que cette
 *     fonction proxifie (PRICES_JSON_URL).
 *
 * Tant qu'aucun provider n'est configuré, elle renvoie 501 : l'app bascule
 * alors sur son message honnête « Aucune donnée de prix » plutôt que
 * d'afficher des chiffres inventés.
 */

const STORES = [
  { id: "delhaize",  name: "Delhaize",  color: "#CE1126", url: "https://www.delhaize.be" },
  { id: "carrefour", name: "Carrefour", color: "#004E9F", url: "https://www.carrefour.be" },
  { id: "colruyt",   name: "Colruyt",   color: "#F07D00", url: "https://www.colruyt.be" },
];

const PROVIDERS = {
  /* Proxy d'un JSON publié ailleurs (GitHub Actions, scraper maison…).
     Format attendu : { catalog: [...] } tel que consommé par l'app. */
  async json_publie() {
    const url = process.env.PRICES_JSON_URL;
    if (!url) throw new Error("PRICES_JSON_URL non configurée");
    const r = await fetch(url);
    if (!r.ok) throw new Error(`source injoignable (${r.status})`);
    const d = await r.json();
    if (!d || !Array.isArray(d.catalog)) throw new Error("format inattendu");
    return { stores: STORES, catalog: d.catalog, simulated: false };
  },
  // async apify() { ... fetch avec process.env.APIFY_TOKEN ... }
};

export default async () => {
  const name = process.env.PRICE_PROVIDER;
  const provider = name && PROVIDERS[name];

  if (!provider) {
    return Response.json(
      {
        error: "aucun provider de prix configuré",
        detail:
          "La source de vérité est data/prix.csv. Pour brancher une source " +
          "dynamique, définir PRICE_PROVIDER (et ses variables) côté Netlify.",
        stores: STORES,
      },
      { status: 501, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const data = await provider();
    return Response.json(
      { ...data, provider: name, generatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (e) {
    /* Un provider en panne ne doit jamais dégrader en données inventées :
       erreur franche, et l'app retombe sur son état honnête. */
    return Response.json(
      { error: "provider en échec", detail: String((e && e.message) || e), provider: name },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
};

export const config = { path: "/api/prices" };
