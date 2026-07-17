import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { buildCsp, securityHeaders } from "@/lib/security/headers";

export async function proxy(request: NextRequest) {
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
