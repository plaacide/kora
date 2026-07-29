import Link from "next/link";

import { Icon } from "@/features/v2/ui/Icon";
import {
  OnboardingTitle,
  Stepper,
} from "@/features/v2/ui/Onboarding";
import { v2Routes } from "@/features/v2/navigation/routes";

const folders = [
  "Société et immatriculation",
  "Gouvernance et actionnariat",
  "Finance et comptabilité",
  "Fiscalité",
  "Commercial et marché",
  "Équipe et RH",
  "Technologie et PI",
  "Impact et ESG",
];

export default function OnboardingResultPage() {
  return (
    <div className="v2-onboard-body v2-onboard-wide">
      <Stepper current={5} />
      <div className="v2-result-title">
        <span className="v2-result-icon"><Icon name="shield-check" /></span>
        <OnboardingTitle
          title="Votre plan de préparation est prêt"
          description="Sanza a adapté les pièces attendues à votre situation. Vous pouvez le modifier à tout moment."
        />
      </div>

      <section className="v2-result-card">
        <div className="v2-result-cell">
          <span>Opération créée</span>
          <strong>Série A 2026 — Nimba Solar</strong>
        </div>
        <div className="v2-result-cell">
          <span>Type de financement</span>
          <strong>Levée en capital · 500 000 000 XOF</strong>
        </div>
        <div className="v2-result-cell">
          <span>Juridiction appliquée</span>
          <strong>OHADA — Sénégal</strong>
        </div>
        <div className="v2-result-cell">
          <span>Exigences générées</span>
          <strong>24 requises · 13 recommandées</strong>
        </div>
        <div className="v2-result-folders">
          <span>Dossiers préparés</span>
          <div>
            {folders.map((folder) => <span className="v2-tag" key={folder}>{folder}</span>)}
          </div>
        </div>
      </section>

      <div className="v2-private-note">
        <Icon name="lock" />
        <p>
          <strong>Votre espace est privé.</strong> Personne n’y a accès — le partage
          sera toujours une action explicite de votre part.
        </p>
      </div>

      <div className="v2-result-actions">
        <Link
          className="v2-onboard-primary"
          href={v2Routes.operations.preparation("nimba-solar")}
        >
          Commencer par les pièces prioritaires
        </Link>
        <Link
          className="v2-onboard-secondary"
          href={v2Routes.operations.overview("nimba-solar")}
        >
          Voir mon espace
        </Link>
      </div>
    </div>
  );
}
