import {
  DEALROOM_NEUVE,
  INVESTISSEUR,
  PROGRAMME,
} from "@/features/v2/fixtures/programme";
import { requireV2User } from "@/features/v2/server/session";

/**
 * La coque d'une Dealroom vue par un investisseur — écrans 30 à 33.
 *
 * HORS DE L'APPLICATION : ni rail, ni panneau contextuel, ni fil d'Ariane du
 * produit. C'est la seule partie du parcours qu'une personne extérieure voit,
 * et elle porte la marque du programme — mais la grille, la typographie et les
 * composants restent ceux de Sanza.
 *
 * L'ACCÈS RESTE AUTHENTIFIÉ, comme le recommande l'ADR-005 : « le lien est
 * personnel — transféré, il n'ouvre pas l'accès » ne peut pas tenir sans
 * identité. Ce que l'ADR laisse ouvert, c'est la FORME de cette identité —
 * compte ou code envoyé par e-mail — pas son existence.
 */
export default async function VitrineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireV2User();

  return (
    <div
      className="v2 v2-vitrine"
      style={{ "--dr-accent": DEALROOM_NEUVE.accent } as React.CSSProperties}
    >
      <header className="v2-vitrine-nav">
        <span className="v2-vitrine-marque">{PROGRAMME.initiales}</span>
        <b>{PROGRAMME.nom}</b>
        <span className="v2-spacer" />
        <span>
          {INVESTISSEUR.nom} · {INVESTISSEUR.organisation}
        </span>
        <span className="v2-btn" data-variant="secondary">
          Quitter
        </span>
      </header>

      {children}

      {/* Répété sur les quatre écrans : ce n'est pas un site, et rien n'y est
          indexé. Un investisseur doit pouvoir le lire sans le chercher. */}
      <footer className="v2-vitrine-pied">
        <span>Espace privé — accès sur invitation uniquement</span>
        <span>Powered by Sanza</span>
      </footer>
    </div>
  );
}
