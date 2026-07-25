"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Connexion par Google et LinkedIn (handoff v2 §3 : les boutons SSO passent
 * AVANT le formulaire e-mail).
 *
 * Le flux OAuth utilise PKCE, et c'est le bon choix ici : le vérificateur est
 * déposé dans le navigateur qui lance la demande, et c'est le MÊME qui revient
 * de chez Google. Rien à voir avec les liens e-mail, où PKCE casse justement
 * parce qu'on peut ouvrir le lien sur un autre appareil.
 *
 * Le retour passe par `/auth/callback`, qui échange le `code` contre une
 * session. `role` n'est transmis qu'à l'inscription : il fixe le type de compte
 * (fondateur / investisseur / programme), que le formulaire e-mail pose sinon
 * lui-même.
 */

type Provider = "google" | "linkedin_oidc";

function LogoGoogle() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l-.1.3 6.5 5 .5.1c4.1-3.8 6.6-9.4 6.6-15.7z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.4c-1.8 1.3-4.3 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-.3 0-6.7 5.2-.1.3C8 40.4 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.5 28.4c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4l0-.3-6.8-5.3-.2.1C2.9 17 2 20.4 2 24s.9 7 2.5 10l7-5.6z" />
      <path fill="#EA4335" d="M24 10.5c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4.3 29.9 2 24 2 15.4 2 8 7.6 4.5 14l7 5.6c1.8-5.3 6.7-9.1 12.5-9.1z" />
    </svg>
  );
}

function LogoLinkedIn() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13M7.12 20.45H3.55V9h3.57zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0"
      />
    </svg>
  );
}

export function SsoButtons({
  next = "/dashboard",
  role,
  separatorLabel = "OU PAR EMAIL",
  errorLabel = "La connexion a échoué. Réessayez.",
}: {
  /** Destination après échange du code. */
  next?: string;
  /** Type de compte à poser — inscription seulement. */
  role?: "investor" | "founder" | "sae";
  separatorLabel?: string;
  errorLabel?: string;
}) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState(false);

  async function connecter(provider: Provider) {
    setBusy(provider);
    setError(false);
    const supabase = createClient();

    const params = new URLSearchParams({ next });
    if (role) params.set("role", role);

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?${params}` },
    });

    // En cas de succès le navigateur part chez le fournisseur : on ne revient
    // ici que si l'appel a échoué (fournisseur non activé, réseau coupé).
    if (err) {
      setBusy(null);
      setError(true);
    }
  }

  const btn =
    "flex items-center justify-center gap-2.5 h-10 w-full rounded-[10px] border border-[#E2DED4] bg-white text-[13.5px] font-[600] text-[#171A2C] hover:border-[#C9C6BD] hover:bg-[#FAF8F4] transition-colors disabled:opacity-60";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" onClick={() => connecter("google")} disabled={busy !== null} className={btn}>
          <LogoGoogle />
          {busy === "google" ? "…" : "Google"}
        </button>
        <button type="button" onClick={() => connecter("linkedin_oidc")} disabled={busy !== null} className={btn}>
          <LogoLinkedIn />
          {busy === "linkedin_oidc" ? "…" : "LinkedIn"}
        </button>
      </div>

      {error && <p className="text-[12px] text-[#C0392B]">{errorLabel}</p>}

      <div className="flex items-center gap-3 py-0.5">
        <span className="h-px flex-1 bg-[#E2DED4]" />
        <span
          style={{ fontFamily: "var(--font-plex-mono), monospace" }}
          className="text-[10px] font-[600] uppercase tracking-[0.1em] text-[#8B8FA3]"
        >
          {separatorLabel}
        </span>
        <span className="h-px flex-1 bg-[#E2DED4]" />
      </div>
    </div>
  );
}
