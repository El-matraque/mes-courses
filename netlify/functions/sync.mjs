/**
 * GET/PUT /api/sync — synchronisation de la liste de courses et de
 * l'inventaire entre les appareils du foyer (iPhone d'Enzo, PC, téléphone
 * de sa compagne).
 *
 * Stockage : Netlify Blobs (store "mes-courses-sync", une seule clé).
 * Le document = { items:[...], stock:{qty,seuil,custom,ean,dismissed,refillsDone} },
 * enveloppé dans { version, updatedAt, doc }.
 *
 * Auth : mot de passe partagé dans l'en-tête X-Sync-Password, comparé à la
 * variable d'environnement SYNC_PASSWORD (à définir dans l'UI Netlify —
 * jamais dans le repo). Sans variable configurée, la route répond 503 et
 * l'app reste en mode local, comme avant.
 *
 * Conflits : compteur de version. Un PUT doit annoncer la version sur
 * laquelle il se base ; si le serveur a avancé entre-temps (l'autre
 * appareil a poussé), il répond 409 avec l'état courant et c'est le CLIENT
 * qui fusionne puis re-pousse. Le serveur ne fusionne jamais : il n'a pas
 * l'état "base" nécessaire à une fusion correcte.
 */
import { getStore } from "@netlify/blobs";

const KEY = "household";

export default async (req) => {
  const pw = process.env.SYNC_PASSWORD;
  if (!pw) {
    return Response.json(
      { error: "synchro non configurée",
        detail: "Définir la variable SYNC_PASSWORD dans Netlify (Site configuration → Environment variables), puis redéployer." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  if ((req.headers.get("x-sync-password") || "") !== pw) {
    return Response.json({ error: "mot de passe invalide" },
      { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const store = getStore("mes-courses-sync");

  if (req.method === "GET") {
    const cur = await store.get(KEY, { type: "json" });
    return Response.json(cur || { version: 0, updatedAt: null, doc: null },
      { headers: { "Cache-Control": "no-store" } });
  }

  if (req.method === "PUT") {
    let body;
    try { body = await req.json(); } catch (e) { body = null; }
    if (!body || typeof body.doc !== "object" || body.doc === null) {
      return Response.json({ error: "corps invalide" }, { status: 400 });
    }
    /* garde-fou taille : une liste de courses ne pèse pas 1 Mo */
    if (JSON.stringify(body.doc).length > 1_000_000) {
      return Response.json({ error: "document trop volumineux" }, { status: 413 });
    }
    const cur = await store.get(KEY, { type: "json" });
    const curVersion = cur ? cur.version : 0;
    if ((body.baseVersion ?? -1) !== curVersion) {
      return Response.json(
        { error: "conflit", current: cur || { version: 0, updatedAt: null, doc: null } },
        { status: 409, headers: { "Cache-Control": "no-store" } });
    }
    const next = { version: curVersion + 1, updatedAt: new Date().toISOString(), doc: body.doc };
    await store.setJSON(KEY, next);
    return Response.json({ version: next.version, updatedAt: next.updatedAt },
      { headers: { "Cache-Control": "no-store" } });
  }

  return Response.json({ error: "méthode non supportée" }, { status: 405 });
};

export const config = { path: "/api/sync" };
