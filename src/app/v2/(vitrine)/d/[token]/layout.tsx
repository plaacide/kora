import { notFound } from "next/navigation";

import { lireVitrine } from "@/features/v2/server/vitrine";

/**
 * La coque d'une Dealroom vue par un investisseur — écrans 30 à 33.
 *
 * HORS DE L'APPLICATION : ni rail, ni panneau contextuel, ni fil d'Ariane du
 * produit. C'est la seule partie du parcours qu'une personne extérieure voit,
 * et elle porte la marque du programme — mais la grille, la typographie et les
 * composants restent ceux de Sanza.
 *
 * ⚠️ L'ACCÈS N'EST PLUS AUTHENTIFIÉ, et ce commentaire remplace celui qui
 * disait l'inverse. La version précédente appelait `requireV2User()` en citant
 * ADR-005 : « le lien est personnel — transféré, il n'ouvre pas l'accès ». Le
 * fondateur a tranché l'inverse le 6 août : la Dealroom s'ouvre SANS COMPTE, et
 * le lien EST l'accès. Garder la garde aurait fermé la porte à ceux à qui elle
 * est justement destinée.
 *
 * Il n'y a donc plus de nom d'investisseur dans l'entête : il n'y a plus
 * d'investisseur identifié. Le pied dit « accès par lien » plutôt que « sur
 * invitation », qui n'est plus vrai.
 */
export default async function VitrineLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const vitrine = await lireVitrine(token);

  // Lien révoqué, Dealroom dépubliée ou jeton inconnu : les trois se
  // répondent de la même façon. Distinguer « ce lien a expiré » de « ce lien
  // n'existe pas » dirait à un curieux qu'il a touché juste.
  if (!vitrine) notFound();

  return (
    <div
      className="v2 v2-vitrine"
      style={
        vitrine.accent
          ? ({ "--dr-accent": vitrine.accent } as React.CSSProperties)
          : undefined
      }
    >
      <header className="v2-vitrine-nav">
        {vitrine.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="v2-vitrine-logo" src={vitrine.logo} />
        ) : (
          <span className="v2-vitrine-marque">
            {vitrine.titre.slice(0, 2).toUpperCase()}
          </span>
        )}
        <b>{vitrine.titre}</b>
        <span className="v2-spacer" />
        {vitrine.contact && (
          <a href={`mailto:${vitrine.contact}`}>{vitrine.contact}</a>
        )}
      </header>

      {children}

      {/* Répété sur les quatre écrans : ce n'est pas un site, et rien n'y est
          indexé. Un investisseur doit pouvoir le lire sans le chercher. */}
      <footer className="v2-vitrine-pied">
        <span>Espace privé — accès par lien</span>
        {vitrine.poweredBy && <span>Powered by Sanza</span>}
      </footer>
    </div>
  );
}
