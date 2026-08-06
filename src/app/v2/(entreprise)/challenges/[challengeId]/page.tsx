import {
  CRITERES_ENTREPRISE,
  ENTREPRISE_CONNECTEE,
  PROGRAMME,
} from "@/features/v2/fixtures/programme";
import { requireV2User } from "@/features/v2/server/session";
import { SanzaWordmark } from "@/features/v2/ui/Logo";

const TON_ETAT: Record<string, string | undefined> = {
  Fait: "green",
  "En cours": "blue",
  "À faire": undefined,
};

/**
 * Écran 42 — le Challenge vu par l'ENTREPRISE, et non par le programme.
 *
 * C'est le seul écran du paquet qui se place du côté du fondateur. Il a donc
 * sa propre coque : ni rail programme, ni panneau de cohorte — juste un
 * bandeau et le retour vers le programme qui a proposé ce Challenge.
 *
 * LE BOUTON OUVRE LA PIÈCE, IL NE LA DÉPOSE PAS. « Un critère se valide
 * automatiquement quand la pièce existe dans votre data room » : le Challenge
 * ne sert pas de seconde porte d'entrée au dépôt, et c'est ce qui permet à la
 * dernière ligne d'être vraie — le programme voit la progression, jamais les
 * documents.
 */
export default async function ChallengeEntreprisePage() {
  await requireV2User();
  const faits = CRITERES_ENTREPRISE.filter((c) => c.etat === "Fait").length;
  const total = CRITERES_ENTREPRISE.length;

  return (
    <div className="v2 v2-focus">
      <header className="v2-focus-nav">
        <SanzaWordmark height={20} />
        <span className="v2-spacer" />
        <span style={{ color: "var(--text-3)", fontSize: 13 }}>
          {ENTREPRISE_CONNECTEE.personne} · {ENTREPRISE_CONNECTEE.entreprise}
        </span>
        <span className="v2-pastille" data-ton="blue">
          {ENTREPRISE_CONNECTEE.initiales}
        </span>
      </header>

      <div className="v2-focus-corps">
        <a href="/v2/accueil" style={{ color: "var(--text-2)", fontSize: 13 }}>
          ← Mon programme · {PROGRAMME.nom}
        </a>

        <div>
          <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
            <h1 style={{ fontSize: 22, letterSpacing: "-.02em" }}>
              Préparer votre Demo Day
            </h1>
            <span className="v2-tag">Financement</span>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 13.5, margin: "6px 0 0" }}>
            Proposé par <b>{PROGRAMME.nom}</b> · Échéance · 15 octobre 2026
          </p>
        </div>

        <div
          className="v2-card"
          style={{ display: "flex", flexDirection: "column", gap: 10, padding: "18px 20px" }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
            <b style={{ font: "600 14.5px var(--font-v2-head), sans-serif" }}>
              {faits} critères sur {total} remplis
            </b>
            <span className="v2-spacer" />
            <span style={{ color: "var(--text-3)", fontSize: 12.5 }}>
              reste {total - faits} avant le 15 octobre
            </span>
          </div>
          <div className="v2-prep-bar" style={{ width: "100%" }}>
            <i style={{ width: `${(faits / total) * 100}%` }} />
          </div>
        </div>

        <div className="v2-card" style={{ overflow: "hidden" }}>
          {CRITERES_ENTREPRISE.map((critere) => (
            <div className="v2-crit-fondateur" key={critere.titre}>
              <div>
                <div>
                  <b>{critere.titre}</b>
                  <span className="v2-badge" data-tone={TON_ETAT[critere.etat]}>
                    <span className="v2-dot" />
                    {critere.etat}
                  </span>
                </div>
                <small>{critere.attendu}</small>
              </div>
              <span className="v2-btn" data-variant="secondary">
                Ouvrir dans ma data room
              </span>
            </div>
          ))}
        </div>

        <p className="v2-dr-note" style={{ margin: 0 }}>
          {PROGRAMME.nom} voit votre progression, jamais vos documents. Un
          critère se valide automatiquement quand la pièce existe dans votre
          data room.
        </p>
      </div>

      <footer className="v2-focus-pied">
        <span>Votre espace reste privé — vous décidez de chaque partage</span>
        <span>Powered by Sanza</span>
      </footer>
    </div>
  );
}
