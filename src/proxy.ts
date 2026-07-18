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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
