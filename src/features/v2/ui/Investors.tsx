import { Icon } from "./Icon";

/**
 * Écran 27 — Pipeline investisseurs.
 * Repris de `sanza_handoff/maquettes/screens/27-pipeline-investisseurs.html`.
 *
 * Règle non négociable du handoff : les trois dimensions ne sont jamais
 * fusionnées. L'étape de relation, l'état d'accès documentaire et le montant
 * déclaré occupent trois colonnes distinctes, et l'engagement documentaire
 * n'est qu'un signal — il ne fait jamais avancer une étape.
 */

type Tone = "blue" | "green" | undefined;

interface Relation {
  initials: string;
  organisation: string;
  contact: string;
  stage: string;
  stageTone: Tone;
  lastInteraction: string;
  nextAction: string;
  access: string;
  accessTone: Tone;
  declared: string;
  engagement: string;
}

const RELATIONS: Relation[] = [
  {
    initials: "AD",
    organisation: "Sahel Growth Fund",
    contact: "Amina Diallo · Principal",
    stage: "Diligence",
    stageTone: "blue",
    lastInteraction: "Consultation — il y a 2 h",
    nextAction: "Préparer le Q&A du 5 août",
    access: "Accès actif",
    accessTone: "green",
    declared: "—",
    engagement: "Élevé · 14 docs consultés",
  },
  {
    initials: "HV",
    organisation: "Horizon Ventures",
    contact: "Kwame Mensah · Partner",
    stage: "Intéressé",
    stageTone: undefined,
    lastInteraction: "NDA signé — hier",
    nextAction: "Relancer aujourd’hui",
    access: "Accès actif",
    accessTone: "green",
    declared: "—",
    engagement: "Modéré · 5 docs consultés",
  },
  {
    initials: "IC",
    organisation: "Impact Capital Africa",
    contact: "Clara Morel · Directrice",
    stage: "Échange planifié",
    stageTone: undefined,
    lastInteraction: "Demande d’accès — hier",
    nextAction: "Call le 2 août 10:00",
    access: "Non invité",
    accessTone: undefined,
    declared: "—",
    engagement: "—",
  },
];

export function InvestorsScreen() {
  return (
    <>
      <div className="v2-viewbar">
        <div className="v2-segmented">
          <button data-active="true" type="button">Tableau</button>
          <button type="button">Colonnes</button>
        </div>
      </div>

      <div className="v2-summarybar">
        <span><b>3</b> relations actives</span>
        <span><b>1</b> en diligence</span>
        <span>Montant déclaré : <b>aucun</b></span>
        <span className="v2-spacer" />
        <span className="v2-summarybar-note">
          Les signaux de lecture n’avancent jamais une étape automatiquement.
        </span>
      </div>

      <div className="v2-pipeline-wrap">
        <table className="v2-pipeline">
          <thead>
            <tr>
              <th>Organisation · contact</th>
              <th>Étape de relation</th>
              <th>Dernière interaction</th>
              <th>Prochaine action</th>
              <th>Accès</th>
              <th className="v2-num">Montant déclaré</th>
              <th>Engagement doc.</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {RELATIONS.map((relation) => (
              <tr key={relation.organisation}>
                <td>
                  <div className="v2-member">
                    <span className="v2-journal-avatar">{relation.initials}</span>
                    <div>
                      <b>{relation.organisation}</b>
                      <small>{relation.contact}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="v2-status" data-tone={relation.stageTone}>
                    <i className="v2-dot" />
                    {relation.stage}
                  </span>
                </td>
                <td className="v2-cell-3">{relation.lastInteraction}</td>
                <td className="v2-cell-2">{relation.nextAction}</td>
                <td>
                  <span className="v2-status" data-tone={relation.accessTone}>
                    {relation.access}
                  </span>
                </td>
                <td className="v2-num v2-declared">{relation.declared}</td>
                <td className="v2-cell-3">{relation.engagement}</td>
                <td>
                  <button
                    aria-label={`Options — ${relation.organisation}`}
                    className="v2-icon-button"
                    type="button"
                  >
                    <Icon name="more" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer>
          Étapes : À cibler → Contacté → Échange planifié → Intéressé →
          Diligence → Offre ou comité → Engagé / Refusé. Le montant est toujours
          déclaré par vous.
        </footer>
      </div>
    </>
  );
}
