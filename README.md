# 🛒 Mes Courses — comparateur Delhaize · Carrefour · Colruyt

App web mobile-first (français) pour gérer sa liste de courses, comparer les prix et promos entre enseignes belges, et préparer ses paniers par magasin. Zéro build, zéro dépendance : un `index.html` + une fonction Netlify.

## Les quatre onglets

| Onglet | Rôle |
|---|---|
| 🛒 **Liste** | La liste de courses : ajout par recherche, quantités, cases à cocher, et bandeau de coût en magasin (dans le caddie / restant / total estimé) |
| ⭐ **Favoris** | La base des produits du foyer : ce qu'on aime et rachète, enrichie par scan de code-barres et tickets de caisse, pour remplir la liste en un tap |
| 📚 **Catalogue** | Parcourir les produits par rayon puis par famille, triés du meilleur au moins bon rapport qualité-prix, ajout en un tap. Conçu pour rester utilisable à plusieurs centaines de références |
| 🏷 **Promos** | Toutes les promos du catalogue, triées par gain réel, en séparant les vraies bonnes affaires des trompe-l'œil |
| ⚖️ **Comparer** | Prix des 3 enseignes article par article, promos, prix au kg/L, alternatives moins chères, et totaux par enseigne |
| 🧺 **Paniers** | Répartition optimale entre magasins, ou classement si tu fais tout au même endroit |

### Comment une promo est jugée

Une remise n'est pas une bonne affaire par définition. Chaque promo est confrontée à deux références :

1. **Le même produit chez les concurrents**, à quantité égale. Si un `-25 %` reste au-dessus du prix normal d'une autre enseigne, c'est un trompe-l'œil, et l'app le dit.
2. **Le meilleur rapport de sa famille**, au prix unitaire. Un 1+1 sur des pâtes premium peut être une vraie remise tout en restant quatre fois plus cher au kilo que les pâtes ordinaires.

Point clé : un `1+1` et un `2e-50` n'apportent **rien** à une seule unité. Ils sont donc évalués à leur quantité charnière (2), et la vue Liste signale le palier — « passe à 2 sans payer un centime de plus » — parce que sinon on paie le plein tarif sans profiter de la remise.

## Ce qui est réel vs simulé

| Élément | État |
|---|---|
| Liste de courses (ajout, quantités, catégories, persistance locale) | ✅ Réel |
| Logique de comparaison, promos (-X %, 1+1, 2ᵉ à -50 %), répartition optimale | ✅ Réel |
| Prix unitaires (€/kg, €/L) et alternatives à quantité égale | ✅ Réel |
| Architecture front → `data/prix.csv` → `/api/prices` → provider de données | ✅ Réel |
| Analyse des promos (bonnes affaires vs trompe-l'œil, paliers 1+1) | ✅ Réel |
| **Les prix** | ✅ **Tous relevés en magasin** — 28 réf. Barilla sur 3 enseignes |

**Zéro prix simulé dans ce dépôt.** Les 45 lignes génériques d'origine (« Bière blonde », « Yaourt nature », « Gel douche ») ont été supprimées : elles portaient des prix inventés sous des noms qu'on ne trouve dans aucun rayon, et elles faussaient toutes les comparaisons. Le fallback embarqué dans `index.html` a été vidé pour la même raison — si `data/prix.csv` ne se charge pas, l'app affiche « Aucune donnée de prix » au lieu d'inventer.

Le catalogue se reconstruit désormais uniquement par relevé réel, rayon par rayon. Le badge en haut de l'app affiche la part réellement relevée dès que le catalogue redevient mixte, et chaque fiche indique la date et l'âge de son relevé.

⚠️ **Ne jamais mettre de `date_releve` sur une ligne inventée**, et ne jamais ajouter de ligne sans l'avoir relevée : c'est ce qui avait fait passer 45 prix fictifs pour des relevés terrain.

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

Ordre de chargement : `data/prix.csv` → `/api/prices` → données embarquées. **Mettre à jour les prix = remplacer un seul fichier CSV**, aucun code à toucher. Format CSV (séparateur `;`, décimales `,` ou `.`) : `id;famille;nom;unite;categorie;prix_delhaize;promo_delhaize;prix_carrefour;promo_carrefour;prix_colruyt;promo_colruyt;date_releve`.

### ⚠️ Les trois états d'une cellule prix

C'est la règle la plus importante du fichier — la confondre fait mentir le comparateur.

| Cellule | Sens | Effet dans l'app |
|---|---|---|
| `1,75` | prix connu | comparé normalement |
| `x` (ou `-`) | **produit indisponible dans cette enseigne** | l'article reste comparable ; l'enseigne est pénalisée en comptant l'article au meilleur prix ailleurs |
| *(vide)* | **prix pas encore relevé** | l'article sort des totaux par enseigne et s'affiche « ? à relever » |

Un prix inconnu n'est **pas** une absence de produit. Traiter les deux pareil rend le classement faux : un article relevé chez une seule enseigne ferait ressortir les trois magasins à égalité. L'app exclut donc des totaux tout article dont au moins un prix est vide, et l'annonce explicitement (« N article(s) hors comparaison »).

### ⚠️ La colonne `nom` porte toujours la marque

`nom` = **marque + produit + variante**, et `unite` = le format. Un nom générique ne sert à rien en rayon : on ne trouve pas « Bière blonde » dans un magasin.

| ❌ | ✅ |
|---|---|
| `Bière blonde` | `Jupiler Blonde` |
| `Yaourt nature` | `Danone Activia nature` |
| `Fromage de chèvre` | `Boni fromage de chèvre doux` |

Si deux formats du même produit coexistent, ils partagent le même `nom` et se distinguent par `unite` (`Barilla Spaghetti n°5` en 500 g et en 1 kg) — l'app affiche toujours l'unité à côté du nom.

Autres colonnes : promo = `-20%`, `1+1` ou `2e-50` ; `date_releve` vide = prix simulé (le badge de l'app s'adapte automatiquement, et chaque fiche affiche l'âge du relevé) ; `unite` est normalisée automatiquement (`150 g`, `4 × 125 g`, `6 × 1,5 L`, `12 pièces`…) pour calculer un **prix au kg / L / pièce** — c'est lui qui sert à comparer, pas le prix du paquet ; `famille` regroupe les produits similaires — l'app propose alors des alternatives au moins 5 % moins chères **à quantité égale**, avec un bouton « Remplacer ».

Le CSV peut être rempli par : (a) une session Claude in Chrome qui relève les prix réels sur les 3 sites (gratuit, semi-manuel), (b) Enzo à la main dans Excel, (c) plus tard, un job automatisé (GitHub Action + API Apify) qui régénère le fichier.

## Synchro entre appareils

Sans synchro, la liste et le stock vivent dans le navigateur de **chaque** appareil : l'iPhone et le PC ont chacun leur copie, qui divergent. La synchro les fait converger vers un document unique côté serveur (`/api/sync`, fonction Netlify + Netlify Blobs), protégé par un **mot de passe partagé du foyer**.

Activation : définir la variable d'environnement `SYNC_PASSWORD` dans Netlify (Site configuration → Environment variables) puis redéployer ; ensuite, sur chaque appareil, taper ce mot de passe via le badge « Sync » en haut de l'app. Sans mot de passe enregistré, l'app reste 100 % locale comme avant.

Le cœur est une **fusion à trois états** (serveur / local / dernier état synchronisé) : un élément modifié localement depuis la dernière synchro gagne, un élément intact prend la version serveur. Résultat : « elle ajoute du pain sur son téléphone pendant que je coche le lait sur le mien » conserve les deux, y compris quand les deux poussent en même temps (conflit 409 → refusion → nouvel essai). Le serveur ne fusionne jamais — il n'a pas l'état « base » qu'il faudrait pour le faire correctement.

Synchro déclenchée : au chargement, au retour sur l'onglet, et 3 s après chaque modification. Hors-ligne, l'app fonctionne normalement en local et rattrape au retour du réseau.

## Favoris : la base des produits du foyer

L'onglet a d'abord été un inventaire avec quantités et seuils (« il reste 1,5 kg de pâtes, seuil 2 kg »). **Abandonné volontairement** : décompter ce qu'on mange est une corvée que personne ne tient. Les structures de données (`stock.custom`, `stock.ean`, `qty`, `seuil`) sont conservées pour la compatibilité de la synchro, mais `qty`/`seuil` ne sont plus ni saisis ni affichés.

L'onglet **Favoris** est désormais la base des produits que le foyer aime et rachète :

- **On l'enrichit** en scannant les paquets (le code-barres est mémorisé, Open Food Facts fournit marque et format), en photographiant un ticket pour Claude (`data/refill.csv` → « Ajouter aux favoris »), ou à la main.
- **On s'en sert** pour remplir la liste de courses en un tap. Chaque favori est rapproché du catalogue de prix (par nom, sinon par famille) : si le produit y figure, l'article ajouté est chiffré et comparé ; sinon c'est un article libre.
- `data/stock.csv` reste le canal par lequel Claude peut semer des favoris versionnés ; le bouton « Exporter les favoris » (noms, catégories, codes-barres) est le chemin inverse.

### Comment Claude ajoute des articles à la liste

La liste de courses vit dans le navigateur : Claude ne peut pas y écrire. Il écrit dans **`data/suggestions.csv`** (`id;nom;raison;date`), et l'app affiche ces lignes en haut de l'onglet Liste avec un bouton d'ajout et un bouton de refus. Si l'`id` correspond à une fiche du catalogue, l'article ajouté est comparable et chiffré ; sinon c'est un article libre.

### Le scan de code-barres

Sur iPhone, l'API navigateur `BarcodeDetector` est désactivée par défaut quelle que soit la version de Safari. L'app charge donc [html5-qrcode](https://github.com/mebjas/html5-qrcode) (EAN-13, caméra inline supportée sur iOS ≥ 15.1) **depuis jsDelivr et uniquement à l'ouverture du scanner**, pour ne pas alourdir le démarrage.

Un code inconnu est identifié via l'[API Open Food Facts](https://openfoodfacts.github.io/openfoodfacts-server/api/) — lecture libre, sans clé, plafonnée à 15 requêtes/minute par IP. Le navigateur interdisant de fixer le `User-Agent` qu'OFF demande, l'identification passe par le paramètre `app_name`. Le rattachement code-barres → poste de stock est mémorisé : le même produit rescanné s'incrémente sans poser de question.

⚠️ Open Food Facts donne l'**identité** du produit (marque, nom, format), jamais son prix. Les prix continuent de venir des relevés en magasin.

**La saisie manuelle du code n'est pas un gadget** : entre les permissions caméra, la lumière des rayons et les emballages froissés, c'est le repli qui sauve la mise. Elle reste visible en permanence sous la caméra, et l'app bascule dessus avec un message explicite si le lecteur ou la caméra échouent.

## Connexion aux enseignes : ce qui est réaliste

Aucune des trois enseignes n'offre d'API publique gratuite. Options par ordre de pragmatisme :

1. **API tierces de scraping (le plus simple)** — des acteurs maintiennent déjà des scrapers à jour : [Colruyt Supermarket BE (Apify)](https://apify.com/harvestedge/colruyt-supermarket-be/api), [Colruyt Scraper (Apify)](https://apify.com/studio-amba/colruyt-scraper/api/python), [Carrefour Scraper (Apify)](https://apify.com/123webdata/carrefour-scraper), [Delhaize (RealDataAPI)](https://www.realdataapi.com/delhaize-grocery-data-scraping.php), [Pepesto /catalog](https://www.pepesto.com/supermarkets/colruyt/) (Colruyt + Delhaize, comparaison incluse). Payant à l'usage, mais aucun scraper à maintenir. Delhaize et Colruyt sont scrapables sans login (prix, prix unitaires, promos, Nutri-Score).
2. **Scraper maison** — les sites Delhaize/Colruyt exposent des API internes JSON (utilisées par leurs propres webshops ; des projets open source comme [colruyt-products-scraper](https://github.com/BelgianNoise/colruyt-products-scraper) et [colruyt-price-history](https://github.com/BelgianNoise/colruyt-price-history) les exploitent). Le bon montage : un job planifié **hors Netlify** (GitHub Actions, cron quotidien, Playwright si besoin) qui publie un `prices.json`, que la fonction Netlify sert. ⚠️ Fragile (les sites changent) et zone grise vis-à-vis des CGU — pour un usage personnel, le risque pratique est faible, mais à savoir.
3. **Saisie manuelle / tickets de caisse** — fiable et légal à 100 % ; réaliste pour les 30–50 produits qu'on rachète en boucle. Éditer le catalogue dans `prices.mjs` suffit.

Le passage de commande automatisé (remplir le panier sur delhaize.be, etc.) nécessiterait une automatisation navigateur avec le compte d'Enzo — faisable mais fragile ; en attendant, chaque panier a un bouton « Copier la liste » + lien direct vers le webshop.

## Phase 2 (prévu, non implémenté)

Inventaire placards/frigo (stock, péremption, déduction automatique des articles déjà en stock de la liste) — l'état de l'app est déjà centralisé et persisté, prêt à accueillir un deuxième store `inventory`.
