import Link from "next/link";

import { AssociationsPanel } from "@/features/v2/ui/Associations";
import { Icon } from "@/features/v2/ui/Icon";
import { v2Routes } from "@/features/v2/navigation/routes";

const folders = [
  ["Société et immatriculation", "4 exigences"],
  ["Gouvernance et actionnariat", "3 exigences"],
  ["Finance et comptabilité", "6 exigences"],
  ["Fiscalité", "2 exigences"],
  ["Commercial et marché", "3 exigences"],
  ["Équipe et RH", "2 exigences"],
  ["Technologie et PI", "2 exigences"],
  ["Impact et ESG", "2 exigences"],
];

const documents = [
  ["3.1", "États financiers 2023-2024.pdf", "États financiers 3 exercices", "Visible par 3 accès", "v1", "03-04-2026", "Ibrahima Sy", "Prête", "green"],
  ["3.2", "États financiers 2025.pdf", "États financiers 3 exercices", "Visible par 3 accès", "v2", "12-05-2026", "Amara Diallo", "À actualiser", "amber"],
  ["3.3", "Plan de trésorerie 18 mois.xlsx", "Plan de trésorerie", "Visible par 2 accès", "v3", "18-07-2026", "Ibrahima Sy", "En vérification", "blue"],
  ["3.4", "Table de capitalisation.xlsx", "Table de capitalisation", "Privée", "v1", "20-07-2026", "Amara Diallo", "Pièce à confirmer", "blue"],
  ["3.5", "Rapport d’audit 2024.pdf", "Rapports d’audit", "Masquée aux invités", "v1", "11-06-2026", "Cabinet Fall & Associés", "Prête", "green"],
  ["3.6", "Budget 2026 approuvé.pdf", "—", "Visible par Sahel Growth", "v1", "02-07-2026", "Amara Diallo", "Prête", "green"],
];

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ operationId: string; folderPath?: string[] }>;
  searchParams: Promise<{ document?: string; upload?: string; associations?: string }>;
}) {
  const { operationId, folderPath } = await params;
  const { document, upload, associations } = await searchParams;
  const currentFolder = folderPath?.at(-1);

  if (!currentFolder) {
    return (
      <div className="v2-documents-page">
        <section className="v2-drop-empty">
          <span className="v2-empty-illustration"><Icon name="file" /></span>
          <h2>Déposez vos premières pièces</h2>
          <p>
            Glissez-déposez vos fichiers ici, ou choisissez un dossier. Sanza proposera
            de les associer aux exigences de votre plan — vous confirmez toujours.
          </p>
          <div>
            <button className="v2-btn" type="button">Choisir des fichiers</button>
            <button className="v2-btn" data-variant="secondary" type="button">Créer un dossier</button>
          </div>
        </section>
        <section className="v2-folder-card">
          <header>
            <strong>Structure suggérée par votre plan</strong>
            <span>— modifiable ; les exigences restent indépendantes de l’arborescence</span>
          </header>
          {folders.map(([name, count]) => (
            <Link
              href={v2Routes.operations.documents(operationId, [name])}
              className="v2-folder-row"
              key={name}
            >
              <Icon name="folder" />
              <strong>{name}</strong>
              <span>{count} · 0 pièce</span>
              <span className="v2-status" data-tone="neutral">Privé</span>
              <Icon name="more" />
            </Link>
          ))}
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="v2-document-table-wrap">
        <table className="v2-document-table">
          <thead>
            <tr>
              <th>#</th><th>Nom</th><th>Exigence associée</th><th>Visibilité</th>
              <th>Version</th><th>Mise à jour</th><th>Propriétaire</th><th>Statut</th><th />
            </tr>
          </thead>
          <tbody>
            {documents.map((row, index) => (
              <tr key={row[1]}>
                <td>{row[0]}</td>
                <td>
                  <Link href={`?document=${index === 1 ? "financial-2025" : "document"}`}>
                    <Icon name="file" /><strong>{row[1]}</strong>
                  </Link>
                </td>
                <td>{row[2]}</td>
                <td>{row[3]}</td>
                <td>{row[4]}</td>
                <td>{row[5]}</td>
                <td>{row[6]}</td>
                <td><span className="v2-status" data-tone={row[8]}>{row[7]}</span></td>
                <td><Icon name="more" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer>
          <span>12 pièces · 6 affichées (filtre : exigences financières)</span>
          <div>
            <button disabled type="button">Page précédente</button>
            <span>1 sur 2</span>
            <button type="button">Page suivante</button>
          </div>
        </footer>
      </div>

      {(document === "financial-2025" || upload === "1") && (
        <>
          <Link className="v2-scrim" href="?" aria-label="Fermer le panneau" />
          <aside className="v2-sidepanel">
            {upload === "1" ? (
              <>
                <header>
                  <div><span className="v2-status" data-tone="neutral">Privé</span><h2>Ajouter du contenu</h2></div>
                  <Link href="?" aria-label="Fermer">×</Link>
                </header>
                <div className="v2-sidepanel-body">
                  <section className="v2-upload-zone v2-upload-zone-large">
                    <Icon name="file" />
                    <strong>Déposez plusieurs fichiers</strong>
                    <span>PDF, DOCX, XLSX, PPTX · 20 Mo par fichier</span>
                    <button className="v2-btn" type="button">Choisir des fichiers</button>
                  </section>
                  <p className="v2-panel-note">
                    Chaque association pièce ↔ exigence vous sera présentée pour confirmation.
                  </p>
                </div>
              </>
            ) : (
              <>
                <header>
                  <div>
                    <span className="v2-status" data-tone="amber">À actualiser</span>
                    <span className="v2-tag">PDF · 3,1 Mo</span>
                    <h2>États financiers 2025.pdf</h2>
                  </div>
                  <Link href="?" aria-label="Fermer">×</Link>
                </header>
                <div className="v2-sidepanel-body">
                  <div className="v2-detail-grid">
                    <div><small>Exigence associée</small><strong>États financiers 3 exercices</strong></div>
                    <div><small>Dossier</small><strong>{currentFolder}</strong></div>
                    <div><small>Visibilité</small><strong>Visible par 3 accès</strong></div>
                    <div><small>Période couverte</small><strong>Exercice 2025</strong></div>
                  </div>
                  <hr />
                  <section>
                    <small>Versions</small>
                    <div className="v2-version is-active">
                      <Icon name="file" />
                      <div><strong>Version 2 <span>Active</span></strong><small>Amara Diallo · 12-05-2026 · Ajout des annexes fiscales</small></div>
                    </div>
                    <div className="v2-version">
                      <Icon name="file" />
                      <div><strong>Version 1</strong><small>Ibrahima Sy · 03-04-2026 · première version</small></div>
                      <button type="button">Restaurer</button>
                    </div>
                  </section>
                  <hr />
                  <section>
                    <small>Activité sur cette pièce</small>
                    <ul className="v2-panel-activity">
                      <li>Amina Diallo a consulté — il y a 2 h</li>
                      <li>Kwame Mensah a consulté — hier</li>
                      <li>Amara Diallo a remplacé la version — 12-05-2026</li>
                    </ul>
                  </section>
                </div>
                <footer className="v2-sidepanel-footer">
                  <button type="button">Archiver</button>
                  <button className="v2-btn" data-variant="secondary" type="button">Ouvrir la visionneuse</button>
                  <button className="v2-btn" type="button">Remplacer (v3)</button>
                </footer>
              </>
            )}
          </aside>
        </>
      )}
      {associations === "1" && <AssociationsPanel />}
    </>
  );
}
