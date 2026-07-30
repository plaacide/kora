import Link from "next/link";

import { Icon } from "./Icon";

/**
 * Écran 13 — Importer une liste de pièces reçue.
 * Repris de `sanza_handoff/maquettes/screens/13-import-liste.html`.
 *
 * Un financeur envoie sa liste ; Sanza la convertit en exigences rattachées à
 * leur source. L'écran distingue ce qui rejoint une exigence existante de ce
 * qui en crée une nouvelle — et rappelle que rien ne repart vers l'organisation
 * demandeuse.
 */

const DETECTED: Array<{ title: string; origin: string; action: "Fusionner" | "Ajouter" }> = [
  {
    title: "États financiers audités 2023-2025",
    origin: "Correspond à une exigence existante",
    action: "Fusionner",
  },
  {
    title: "Plan d’affaires 2026-2029",
    origin: "Nouvelle exigence",
    action: "Ajouter",
  },
  {
    title: "Relevés bancaires 12 mois",
    origin: "Nouvelle exigence",
    action: "Ajouter",
  },
  {
    title: "Garanties proposées",
    origin: "Nouvelle exigence",
    action: "Ajouter",
  },
  {
    title: "Attestation fiscale à jour",
    origin: "Correspond à une exigence existante",
    action: "Fusionner",
  },
  {
    title: "Justificatif de domiciliation",
    origin: "Nouvelle exigence",
    action: "Ajouter",
  },
];

export function ImportListPanel() {
  return (
    <>
      <Link aria-label="Fermer" className="v2-scrim" href="?" />
      <aside className="v2-sidepanel v2-import-panel">
        <header>
          <div>
            <h2>Importer une liste de pièces reçue</h2>
            <p>Sanza convertit la liste en exigences, rattachées à leur source.</p>
          </div>
          <Link aria-label="Fermer" href="?">×</Link>
        </header>

        <div className="v2-sidepanel-body">
          <label className="v2-field">
            <span>Organisation demandeuse</span>
            <span className="v2-control">
              <input defaultValue="Banque Atlantique Sénégal" />
            </span>
          </label>

          <div className="v2-upload-zone">
            <span className="v2-upload-mark">
              <Icon name="file" />
            </span>
            <div>
              <a href="#">Choisir un fichier</a> ou glisser-déposer
            </div>
            <span>PDF, DOCX, XLSX ou copier-coller le texte de l’e-mail</span>
          </div>

          <section>
            <small className="v2-field-label">
              Aperçu — {DETECTED.length} exigences détectées
            </small>
            <div className="v2-detected-list">
              {DETECTED.map((item) => (
                <div key={item.title}>
                  <div>
                    <b>{item.title}</b>
                    <small>{item.origin}</small>
                  </div>
                  <span
                    className="v2-status"
                    data-tone={item.action === "Fusionner" ? "green" : "blue"}
                  >
                    {item.action}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <p className="v2-panel-note">
            Chaque exigence importée portera le tag{" "}
            <span className="v2-tag">Demandé par Banque Atlantique</span>. Rien
            n’est partagé avec l’organisation.
          </p>
        </div>

        <footer className="v2-sidepanel-footer">
          <Link className="v2-btn" data-variant="secondary" href="?">
            Annuler
          </Link>
          <button className="v2-btn" type="button">
            Importer {DETECTED.length} exigences
          </button>
        </footer>
      </aside>
    </>
  );
}
