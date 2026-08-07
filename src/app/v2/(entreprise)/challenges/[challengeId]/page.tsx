import { notFound } from "next/navigation";

import { echeanceCourte, joursRestants } from "@/features/v2/domain/challenges";
import { initiales } from "@/features/v2/domain/questions";
import {
  criteresSuivis,
  lireChallengeEntreprise,
  rafraichirChallenge,
} from "@/features/v2/server/challenges";
import { requireV2User } from "@/features/v2/server/session";
import { AvisEphemere } from "@/features/v2/ui/AvisEphemere";
import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";
import { SanzaWordmark } from "@/features/v2/ui/Logo";

import { basculerCritere } from "./actions";

/**
 * Écran 42 — le Challenge vu par l'ENTREPRISE, et non par le programme.
 *
 * C'est le seul écran du paquet qui se place du côté du fondateur. Il a donc
 * sa propre coque : ni rail programme, ni panneau de cohorte — juste un
 * bandeau et le retour vers son espace.
 *
 * UN CRITÈRE CONNECTÉ NE SE COCHE PAS ICI, et l'écran le dit plutôt que de
 * présenter un bouton qui échouerait : il se valide seul quand la pièce
 * existe dans la data room. Le Challenge n'est pas une seconde porte d'entrée
 * au dépôt — c'est ce qui permet à la dernière ligne d'être vraie.
 */
export default async function ChallengeEntreprisePage({
  params,
  searchParams,
}: {
  params: Promise<{ challengeId: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const [user, { challengeId }, { erreur }] = await Promise.all([
    requireV2User(),
    params,
    searchParams,
  ]);

  // Les critères connectés se remettent à jour AVANT l'affichage : c'est
  // l'écran où l'entreprise vient vérifier ce qui lui reste, et un critère
  // satisfait hier doit y apparaître aujourd'hui.
  await rafraichirChallenge(challengeId);

  const challenge = await lireChallengeEntreprise(challengeId);
  if (!challenge) notFound();

  const criteres = await criteresSuivis(challengeId, challenge.startupOrg);
  const faits = criteres.filter((c) => c.fait).length;
  const total = criteres.length;
  const jours = challenge.echeance
    ? joursRestants(challenge.echeance, new Date())
    : null;

  return (
    <div className="v2 v2-focus">
      <header className="v2-focus-nav">
        <SanzaWordmark height={20} />
        <span className="v2-spacer" />
        <span style={{ color: "var(--text-3)", fontSize: 13 }}>
          {user.email}
        </span>
        <span className="v2-pastille" data-ton="blue">
          {initiales(user.email ?? "—")}
        </span>
      </header>

      <div className="v2-focus-corps">
        <a href="/v2/accueil" style={{ color: "var(--text-2)", fontSize: 13 }}>
          ← Mon espace
        </a>

        <div>
          <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
            <h1 style={{ fontSize: 22, letterSpacing: "-.02em" }}>
              {challenge.titre}
            </h1>
            {challenge.categorie && (
              <span className="v2-tag">{challenge.categorie}</span>
            )}
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 13.5, margin: "6px 0 0" }}>
            Proposé par <b>{challenge.programme}</b>
            {challenge.echeance && ` · Échéance · ${echeanceCourte(challenge.echeance)}`}
          </p>
        </div>

        {erreur && (
          <p className="v2-auth-error" role="alert">
            <AvisEphemere />
            La mise à jour n’a pas abouti. Réessayez.
          </p>
        )}

        <div
          className="v2-card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "18px 20px",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
            <b style={{ font: "600 14.5px var(--font-v2-head), sans-serif" }}>
              {faits} critère{faits > 1 ? "s" : ""} sur {total} rempli
              {faits > 1 ? "s" : ""}
            </b>
            <span className="v2-spacer" />
            {/* Le compte à rebours ne s'affiche QUE s'il reste du temps :
                « reste -3 jours » n'a aucun sens, et l'échéance dépassée se
                dit autrement. */}
            <span style={{ color: "var(--text-3)", fontSize: 12.5 }}>
              {jours === null
                ? "sans échéance"
                : jours > 0
                  ? `reste ${jours} jour${jours > 1 ? "s" : ""}`
                  : "échéance dépassée"}
            </span>
          </div>
          <div className="v2-prep-bar" style={{ width: "100%" }}>
            <i style={{ width: total > 0 ? `${(faits / total) * 100}%` : "0%" }} />
          </div>
        </div>

        <div className="v2-card" style={{ overflow: "hidden" }}>
          {criteres.map((critere) => (
            <div className="v2-crit-fondateur" key={critere.id}>
              <div>
                <div>
                  <b>{critere.libelle}</b>
                  <span
                    className="v2-badge"
                    data-tone={critere.fait ? "green" : undefined}
                  >
                    <span className="v2-dot" />
                    {critere.fait ? "Fait" : "À faire"}
                  </span>
                  {!critere.requis && <span className="v2-tag">Optionnel</span>}
                </div>
                <small>
                  {critere.source === "connecte"
                    ? critere.fait
                      ? "validé automatiquement depuis votre data room"
                      : "se validera seul dès que la pièce existera dans votre data room"
                    : critere.fait
                      ? "vous l’avez confirmé"
                      : "à confirmer vous-même"}
                </small>
              </div>

              {/* UN CRITÈRE CONNECTÉ N'A PAS DE BOUTON. Il se valide seul, et
                  `set_challenge_criterion` refuserait de toute façon — mieux
                  vaut ne rien proposer que proposer ce qui échoue. */}
              {critere.source === "manuel" && (
                <form action={basculerCritere}>
                  <input name="challenge" type="hidden" value={challengeId} />
                  <input name="critere" type="hidden" value={critere.id} />
                  <input
                    name="fait"
                    type="hidden"
                    value={critere.fait ? "0" : "1"}
                  />
                  <BoutonEnvoi className="v2-btn" enCours="…">
                    {critere.fait ? "Annuler" : "Je l’ai fait"}
                  </BoutonEnvoi>
                </form>
              )}
            </div>
          ))}
        </div>

        <p className="v2-dr-note" style={{ margin: 0 }}>
          {challenge.programme} voit votre progression, jamais vos documents. Un
          critère connecté se valide automatiquement quand la pièce existe dans
          votre data room.
        </p>
      </div>

      <footer className="v2-focus-pied">
        <span>Votre espace reste privé — vous décidez de chaque partage</span>
        <span>Powered by Sanza</span>
      </footer>
    </div>
  );
}
