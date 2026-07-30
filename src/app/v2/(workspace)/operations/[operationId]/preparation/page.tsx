import Link from "next/link";

import { Icon } from "@/features/v2/ui/Icon";
import { ImportListPanel } from "@/features/v2/ui/ImportList";

interface RequirementItem {
  title: string;
  level: string;
  sources: string[];
  rationale: string;
  note?: string;
  status: string;
  tone: string;
  action: string;
  id?: string;
}

interface RequirementGroup {
  name: string;
  progress: string;
  requirements: RequirementItem[];
}

const groups: RequirementGroup[] = [
  {
    name: "Société et immatriculation",
    progress: "2 sur 4 prêtes",
    requirements: [
      {
        title: "Statuts à jour",
        level: "Requis",
        sources: ["OHADA"],
        rationale: "Confirme l’existence légale, la forme et les règles de gouvernance de la société.",
        status: "À préparer",
        tone: "neutral",
        action: "Déposer une pièce",
        id: "statuts",
      },
      {
        title: "Registre de commerce (RCCM)",
        level: "Requis",
        sources: ["OHADA"],
        rationale: "Preuve d’immatriculation exigée par tout financeur.",
        status: "Prête",
        tone: "green",
        action: "Voir la pièce",
      },
      {
        title: "Procès-verbaux d’assemblée",
        level: "Recommandé",
        sources: ["OHADA", "Capital"],
        rationale: "Montre la régularité des décisions d’associés.",
        status: "Prête",
        tone: "green",
        action: "Voir la pièce",
      },
      {
        title: "Attestation de non-faillite",
        level: "Optionnel",
        sources: ["Banque"],
        rationale: "Parfois demandée par les banques pour un dossier de crédit.",
        status: "Non applicable",
        tone: "neutral",
        action: "Revoir",
      },
    ],
  },
  {
    name: "Finance et comptabilité",
    progress: "4 sur 6 prêtes",
    requirements: [
      {
        title: "États financiers des trois derniers exercices",
        level: "Requis",
        sources: ["Banque", "DFI"],
        rationale: "Permet d’évaluer la performance, la capacité de remboursement et la qualité du reporting.",
        note: "Exercice 2025 clos depuis plus de 6 mois — version à jour attendue.",
        status: "À actualiser",
        tone: "amber",
        action: "Remplacer",
      },
      {
        title: "Table de capitalisation",
        level: "Requis",
        sources: ["Capital"],
        rationale: "Indispensable pour évaluer la dilution et structurer le tour.",
        status: "Pièce à confirmer",
        tone: "blue",
        action: "Confirmer",
      },
      {
        title: "Plan de trésorerie 18 mois",
        level: "Requis",
        sources: ["Capital", "Banque"],
        rationale: "Attendu pour mesurer le besoin de financement réel.",
        status: "En vérification",
        tone: "blue",
        action: "Voir la pièce",
      },
      {
        title: "Rapports d’audit",
        level: "Recommandé",
        sources: ["DFI"],
        rationale: "Accélère la diligence des institutions.",
        status: "À préparer",
        tone: "neutral",
        action: "Associer une pièce",
      },
    ],
  },
];

export default async function PreparationPage({
  searchParams,
}: {
  searchParams: Promise<{ requirement?: string; import?: string }>;
}) {
  const { requirement, import: importList } = await searchParams;

  return (
    <>
      <div className="v2-filterbar">
        {["Toutes", "À traiter", "Requises", "À actualiser", "Prêtes"].map((filter) => (
          <button data-active={filter === "À traiter"} key={filter} type="button">{filter}</button>
        ))}
        <i />
        <button type="button">Par financeur<Icon name="chevron" /></button>
        <button type="button">Par juridiction<Icon name="chevron" /></button>
        <span><b>18</b> prêtes · <b>4</b> à fournir · <b>2</b> à actualiser</span>
      </div>

      <div className="v2-preparation-list">
        {groups.map((group) => (
          <section className="v2-requirement-group" key={group.name}>
            <header>
              <strong>{group.name}</strong>
              <span>{group.progress}</span>
            </header>
            {group.requirements.map((item) => (
              <article className="v2-requirement-row" key={item.title}>
                <Icon name="file" />
                <div className="v2-requirement-copy">
                  <div>
                    <strong>{item.title}</strong>
                    <span className="v2-tag" data-level={item.level === "Requis" ? "required" : undefined}>
                      {item.level}
                    </span>
                    {item.sources.map((source) => <span className="v2-tag" key={source}>{source}</span>)}
                  </div>
                  <p>{item.rationale}</p>
                  {item.note && <small>{item.note}</small>}
                </div>
                <span className="v2-status" data-tone={item.tone}>{item.status}</span>
                <Link
                  className="v2-btn"
                  data-variant="secondary"
                  href={item.id ? `?requirement=${item.id}` : "#"}
                >
                  {item.action}
                </Link>
              </article>
            ))}
          </section>
        ))}
      </div>

      {requirement === "statuts" && (
        <>
          <Link className="v2-scrim" href="?" aria-label="Fermer le détail" />
          <aside className="v2-sidepanel">
            <header>
              <div>
                <span className="v2-status" data-tone="neutral">À préparer</span>
                <h2>Statuts à jour</h2>
              </div>
              <Link href="?" aria-label="Fermer">×</Link>
            </header>
            <div className="v2-sidepanel-body">
              <div className="v2-detail-grid">
                <div><small>Niveau</small><strong>Requis</strong></div>
                <div><small>Domaine</small><strong>Société et immatriculation</strong></div>
                <div><small>Juridiction</small><strong>OHADA — Sénégal</strong></div>
                <div><small>Source</small><strong>Plan capital</strong></div>
              </div>
              <hr />
              <section>
                <small>Pourquoi cette pièce est demandée</small>
                <p>Elle confirme l’existence légale, la forme et les règles de gouvernance de la société.</p>
              </section>
              <section className="v2-upload-zone">
                <Icon name="file" />
                <strong>Déposer les statuts à jour</strong>
                <span>PDF, DOCX · 20 Mo maximum</span>
                <button className="v2-btn" type="button">Choisir un fichier</button>
              </section>
              <p className="v2-panel-note">
                Sanza proposera l’association à cette exigence. Vous devrez toujours la confirmer.
              </p>
            </div>
          </aside>
        </>
      )}
      {importList === "1" && <ImportListPanel />}
    </>
  );
}
