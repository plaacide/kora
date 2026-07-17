import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Reconstruit les en-têtes de requête à partir de la requête *courante*
 * (Supabase peut avoir muté ses cookies) en réappliquant les extras (nonce, CSP).
 */
function withExtras(
  request: NextRequest,
  extras: Record<string, string>,
): Headers {
  const headers = new Headers(request.headers);
  for (const [key, value] of Object.entries(extras)) headers.set(key, value);
  return headers;
}

export async function updateSession(
  request: NextRequest,
  extras: Record<string, string> = {},
) {
  let response = NextResponse.next({
    request: { headers: withExtras(request, extras) },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Tant que Supabase n'est pas configuré, on ne touche pas à la session.
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request: { headers: withExtras(request, extras) },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Rafraîchit la session (ne rien insérer entre createServerClient et getUser).
  await supabase.auth.getUser();

  return response;
}
