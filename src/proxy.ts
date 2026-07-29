import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { buildCsp, securityHeaders } from "@/lib/security/headers";

export async function proxy(request: NextRequest) {
  // Les gabarits d'e-mail par défaut de Supabase renvoient sur la Site URL —
  // donc la RACINE — avec `?code=…`, jamais sur une route à nous. On aiguille
  // vers /auth/callback, seul endroit qui sait échanger ce code contre une
  // session. Sans ça, le fondateur atterrit sur la page d'accueil, déconnecté
  // et sans explication, alors que son compte vient d'être activé.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && searchParams.get("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Le sous-domaine de recette V2 possède son propre point d'entrée public.
  // Les anciennes URL d'auth restent valides pour app.sanza.africa, mais elles
  // ne doivent jamais faire retomber v2.sanza.africa sur les écrans V1.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = (forwardedHost ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();
  if (host === "v2.sanza.africa") {
    const v2EntryPoints: Record<string, string> = {
      "/": "/v2",
      "/connexion": "/v2/connexion",
      "/connexion/2fa": "/v2/connexion/2fa",
      "/inscription": "/v2/inscription",
      "/mot-de-passe-oublie": "/v2/mot-de-passe-oublie",
      "/reinitialiser": "/v2/reinitialiser",
      "/verifier-email": "/v2/verifier-email",
    };
    const destination = v2EntryPoints[pathname];
    if (destination) {
      const url = request.nextUrl.clone();
      url.pathname = destination;
      return NextResponse.redirect(url);
    }
  }

  // Un nonce neuf par requête (les routes sont rendues à la demande).
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  // Next lit la CSP dans les en-têtes de REQUÊTE pour poser le nonce
  // sur ses propres scripts.
  const response = await updateSession(request, {
    "x-nonce": nonce,
    "Content-Security-Policy": csp,
  });

  response.headers.set("Content-Security-Policy", csp);
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Le proxy rafraîchit la session à CHAQUE requête qui le traverse — un appel
 * réseau à Supabase. C'est le prix juste pour une page ; c'est ruineux pour un
 * média.
 *
 * Un lecteur vidéo télécharge le fichier par PLAGES : des dizaines de requêtes
 * pour une seule lecture. Mesuré en production sur `demo.mp4` : 0,75 s par
 * plage contre 0,30 s pour un fichier déjà exclu — un demi-seconde de latence
 * ajoutée à chaque morceau. Le lecteur n'arrive jamais à remplir son tampon et
 * tourne indéfiniment, sans jamais afficher d'erreur.
 *
 * Les extensions de média rejoignent donc les images dans la liste
 * d'exclusion. Aucun de ces fichiers n'a besoin d'une session ni d'un nonce.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov|m4v|ogv|mp3|m4a)$).*)",
  ],
};
