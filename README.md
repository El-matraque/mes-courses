# 🛒 Mes Courses — comparateur Delhaize · Carrefour · Colruyt

App web mobile-first (français) pour gérer sa liste de courses, comparer les prix et promos entre enseignes belges, et préparer ses paniers par magasin. Zéro build, zéro dépendance : un `index.html` + une fonction Netlify.

## Ce qui est réel vs simulé

| Élément | État |
|---|---|
| Liste de courses (ajout, quantités, catégories, persistance locale) | ✅ Réel |
| Logique de comparaison, promos (-X %, 1+1, 2ᵉ à -50 %), répartition optimale | ✅ Réel |
| Architecture front → `/api/prices` → provider de données | ✅ Réel |
| **Les prix eux-mêmes (39 articles, 3 enseignes)** | ⚠️ **Simulés** (ordres de grandeur réalistes, mais inventés) |

Le badge « Prix simulés » dans l'app le rappelle en permanence. Le badge « Source » indique si les données viennent de la fonction Netlify (déployé) ou du fallback local (fichier ouvert en direct).

## Déployer sur Netlify

Comme pour muscugen : soit **drag & drop** du dossier `courses-app/` sur https://app.netlify.com/drop, soit via Git/CLI :

```bash
cd courses-app
npx netlify-cli deploy --prod
```

Rien à builder. La fonction `netlify/functions/prices.mjs` est détectée automatiquement et sert `GET /api/prices`.

Test local : `npx netlify-cli dev` (sert le site + la fonction).

## Architecture (prête pour de vraies données)

```
index.html                     ← toute l'app (UI + logique)
data/prix.csv                  ← SOURCE DE VÉRITÉ des prix (éditable dans Excel)
netlify/functions/prices.mjs   ← fallback /api/prices (provider "mock")
catalogue-prix.xlsx            ← version Excel confortable du CSV (livrée à côté)
```

Ordre de chargement : `data/prix.csv` → `/api/prices` → données embarquées. **Mettre à jour les prix = remplacer un seul fichier CSV**, aucun code à toucher. Format CSV (séparateur `;`, décimales `,` ou `.`) : `id;famille;nom;unite;categorie;prix_delhaize;promo_delhaize;prix_carrefour;promo_carrefour;prix_colruyt;promo_colruyt;date_releve`. Prix vide = indisponible ; promo = `-20%`, `1+1` ou `2e-50` ; `date_releve` vide = prix simulé (le badge de l'app s'adapte automatiquement) ; `famille` regroupe les produits similaires — l'app propose alors des alternatives moins chères ou en promo avec un bouton « Remplacer ».

Le CSV peut être rempli par : (a) une session Claude in Chrome qui relève les prix réels sur les 3 sites (gratuit, semi-manuel), (b) Enzo à la main dans Excel, (c) plus tard, un job automatisé (GitHub Action + API Apify) qui régénère le fichier.

## Connexion aux enseignes : ce qui est réaliste

Aucune des trois enseignes n'offre d'API publique gratuite. Options par ordre de pragmatisme :

1. **API tierces de scraping (le plus simple)** — des acteurs maintiennent déjà des scrapers à jour : [Colruyt Supermarket BE (Apify)](https://apify.com/harvestedge/colruyt-supermarket-be/api), [Colruyt Scraper (Apify)](https://apify.com/studio-amba/colruyt-scraper/api/python), [Carrefour Scraper (Apify)](https://apify.com/123webdata/carrefour-scraper), [Delhaize (RealDataAPI)](https://www.realdataapi.com/delhaize-grocery-data-scraping.php), [Pepesto /catalog](https://www.pepesto.com/supermarkets/colruyt/) (Colruyt + Delhaize, comparaison incluse). Payant à l'usage, mais aucun scraper à maintenir. Delhaize et Colruyt sont scrapables sans login (prix, prix unitaires, promos, Nutri-Score).
2. **Scraper maison** — les sites Delhaize/Colruyt exposent des API internes JSON (utilisées par leurs propres webshops ; des projets open source comme [colruyt-products-scraper](https://github.com/BelgianNoise/colruyt-products-scraper) et [colruyt-price-history](https://github.com/BelgianNoise/colruyt-price-history) les exploitent). Le bon montage : un job planifié **hors Netlify** (GitHub Actions, cron quotidien, Playwright si besoin) qui publie un `prices.json`, que la fonction Netlify sert. ⚠️ Fragile (les sites changent) et zone grise vis-à-vis des CGU — pour un usage personnel, le risque pratique est faible, mais à savoir.
3. **Saisie manuelle / tickets de caisse** — fiable et légal à 100 % ; réaliste pour les 30–50 produits qu'on rachète en boucle. Éditer le catalogue dans `prices.mjs` suffit.

Le passage de commande automatisé (remplir le panier sur delhaize.be, etc.) nécessiterait une automatisation navigateur avec le compte d'Enzo — faisable mais fragile ; en attendant, chaque panier a un bouton « Copier la liste » + lien direct vers le webshop.

## Phase 2 (prévu, non implémenté)

Inventaire placards/frigo (stock, péremption, déduction automatique des articles déjà en stock de la liste) — l'état de l'app est déjà centralisé et persisté, prêt à accueillir un deuxième store `inventory`.
