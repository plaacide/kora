/**
 * Origine publique de l'application.
 *
 * Module NEUTRE : utilisé par des Server Actions comme par des route handlers.
 *
 * Pourquoi ne PAS se fier à `new URL(request.url).origin` : derrière le reverse
 * proxy, l'application écoute sur 0.0.0.0:8080 et c'est cette adresse que porte
 * l'URL de la requête. Une redirection construite dessus envoie l'utilisateur
 * vers `https://0.0.0.0:8080`, injoignable — constaté en production, invisible
 * en local où l'origine est déjà la bonne.
 *
 * On lit donc les en-têtes posés par le proxy.
 */
export function originFromHeaders(h: Headers): string {
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  // `x-forwarded-host` peut contenir une liste si plusieurs proxys se
  // succèdent : le premier est celui vu par le client.
  return `${proto}://${host.split(",")[0].trim()}`;
}
