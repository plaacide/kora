import { saisieProgramme } from "@/features/v2/server/programme";
import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";
import { Icon } from "@/features/v2/ui/Icon";
import { ETAPES_PROGRAMME, Stepper } from "@/features/v2/ui/Onboarding";

import { terminerOnboardingProgramme } from "../actions";

/** Ce que l'espace ouvre d'emblée, et ce qui n'est activé que si on l'a coché. */
const OUTILS: readonly { code: string | null; libelle: string }[] = [
  { code: null, libelle: "Invitations par email ou lien" },
  { code: null, libelle: "Suivi de complétude" },
  { code: "challenges", libelle: "Bibliothèque de Challenges" },
  { code: "dealrooms", libelle: "Dealrooms" },
  { code: "rapports", libelle: "Rapports" },
];

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** « 2026-03-01 » → « mars 2026 ». */
function enClair(date: string | null): string | null {
  if (!date) return null;
  const [annee, mois] = date.split("-");
  const rang = Number(mois) - 1;
  return MOIS[rang] ? `${MOIS[rang]} ${annee}` : null;
}

const LIBELLES_FOCUS: Record<string, string> = {
  cohorte: "Suivi de cohorte",
  challenges: "Challenges",
  dealrooms: "Dealrooms",
  rapports: "Rapports",
};

/** Écran 00d — étape 5 : l'espace est prêt. Tout y est lu en base. */
export default async function EspacePretPage() {
  const saisie = await saisieProgramme();
  const debut = enClair(saisie.cohorte?.debut ?? null);
  const fin = enClair(saisie.cohorte?.fin ?? null);

  return (
    <form action={terminerOnboardingProgramme} className="v2-onboard-body">
      <Stepper current={5} etapes={ETAPES_PROGRAMME} />
      <div className="v2-onboard-title v2-onb-titre-centre">
        <span className="v2-onb-sceau">
          <Icon name="check" />
        </span>
        <h1>Votre espace programme est prêt</h1>
        <p>
          {saisie.cohorte
            ? "La cohorte est créée. Prochaine étape : inviter les entreprises que vous accompagnez."
            : "Votre organisation est enregistrée. Vous créerez votre cohorte quand vous voudrez."}
        </p>
      </div>

      <div className="v2-card v2-onb-recap">
        <div>
          <div className="v2-kv">
            <span className="v2-k">Organisation</span>
            <span className="v2-v">
              {[saisie.nom, saisie.pays].filter(Boolean).join(" — ")}
            </span>
          </div>
          <div className="v2-kv">
            <span className="v2-k">
              {saisie.cohorte ? "Cohorte créée" : "Cohorte"}
            </span>
            <span className="v2-v">
              {saisie.cohorte?.nom ?? "à créer plus tard"}
            </span>
          </div>
        </div>
        <div>
          <div className="v2-kv">
            <span className="v2-k">Période</span>
            <span className="v2-v">
              {debut && fin
                ? `${debut} → ${fin} · ${saisie.cohorte?.places} places`
                : "—"}
            </span>
          </div>
          <div className="v2-kv">
            <span className="v2-k">Accompagnement choisi</span>
            <span className="v2-v">
              {saisie.focus.length > 0
                ? saisie.focus
                    .map((code) => LIBELLES_FOCUS[code] ?? code)
                    .join(" · ")
                : "—"}
            </span>
          </div>
        </div>
        <div>
          <div className="v2-kv">
            <span className="v2-k">Prêt dans votre espace</span>
            {/* « — activable » n'est PAS décoratif : il distingue ce que le
                programme a demandé de ce qui l'attend s'il change d'avis. */}
            <span className="v2-v">
              {OUTILS.map((outil) => (
                <span className="v2-tag" key={outil.libelle}>
                  {outil.code && !saisie.focus.includes(outil.code)
                    ? `${outil.libelle} — activable`
                    : outil.libelle}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>

      <p className="v2-onb-promesse">
        <Icon name="shield-check" />
        <span>
          <b>Chaque entreprise reste chez elle.</b> Vous voyez sa progression ;
          ses documents ne vous sont visibles que si elle les partage
          explicitement.
        </span>
      </p>

      <div className="v2-onb-fin">
        <BoutonEnvoi className="v2-btn" name="destination" value="inviter">
          Inviter mes premières entreprises
        </BoutonEnvoi>
        <BoutonEnvoi className="v2-btn" name="destination" value="espace">
          Voir mon espace
        </BoutonEnvoi>
      </div>
    </form>
  );
}
