const isDev = process.env.NODE_ENV === "development";

/**
 * Origine Supabase autorisée pour les appels navigateur (MFA, auth client).
 * Sans ça, `default-src 'self'` bloquerait tout appel à l'API Supabase.
 */
function supabaseOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "https://*.supabase.co";
  try {
    return new URL(url).origin;
  } catch {
    return "https://*.supabase.co";
  }
}

export function buildCsp(nonce: string): string {
  const supabase = supabaseOrigin();

  // script-src : nonce + strict-dynamic = protection XSS réelle.
  // style-src  : 'unsafe-inline' assumé — next/font et Tailwind injectent des
  //              styles sans nonce. Le risque d'injection CSS est très
  //              inférieur à celui du JS, qui reste verrouillé par nonce.
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self' data:`,
    `connect-src 'self' ${supabase}${isDev ? " ws: wss:" : ""}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `frame-src 'none'`,
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];

  return directives.join("; ");
}

/** En-têtes de sécurité appliqués à toutes les réponses. */
export const securityHeaders: Record<string, string> = {
  // HSTS : ignoré en clair (localhost), actif dès que HTTPS.
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  // Redondant avec frame-ancestors, mais couvre les navigateurs anciens.
  // Critique pour une data room : interdit l'encapsulation en iframe.
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "X-DNS-Prefetch-Control": "off",
};
