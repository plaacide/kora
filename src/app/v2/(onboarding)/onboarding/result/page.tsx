import { redirect } from "next/navigation";

import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";
import { objectifPorteFinancement } from "@/features/v2/domain/operation";
import { v2Routes } from "@/features/v2/navigation/routes";
import { Icon } from "@/features/v2/ui/Icon";
import {
  OnboardingTitle,
  Stepper,
} from "@/features/v2/ui/Onboarding";
import { requireV2User } from "@/features/v2/server/session";
import { createClient } from "@/lib/supabase/server";
import { completeV2Onboarding } from "../actions";

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

const objectiveLabels: Record<string, string> = {
  levee: "Recherche de financement",
  diligence: "Préparation à une diligence",
};

export default async function OnboardingResultPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const [{ erreur }, user] = await Promise.all([
    searchParams,
    requireV2User(),
  ]);
  const supabase = await createClient();
  const { data: startup, error } = await supabase
    .from("startups")
    .select("name, country, stage, objectif")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[v2 onboarding] result startup lookup failed", error);
    redirect(`${v2Routes.onboarding.company}?erreur=enregistrement`);
  }
  if (!startup?.name?.trim()) redirect(v2Routes.onboarding.company);

  const operationName = startup.stage
    ? `${startup.stage} — ${startup.name}`
    : startup.name;
  const objective =
    objectiveLabels[startup.objectif ?? ""] ?? "Plan de préparation";
  // Le fil d'étapes n'annonce « Détails » qu'à ceux qui l'ont traversé.
  const avecDetails = objectifPorteFinancement(startup.objectif ?? "");

  return (
    <div className="v2-onboard-body v2-onboard-wide">
      {/* Sans étape « Détails », le plan est la quatrième et non la cinquième. */}
      <Stepper avecDetails={avecDetails} current={avecDetails ? 5 : 4} />
      <div className="v2-result-title">
        <span className="v2-result-icon"><Icon name="shield-check" /></span>
        <OnboardingTitle
          title="Votre plan de préparation est prêt"
          description="Sanza a adapté les pièces attendues à votre situation. Vous pouvez le modifier à tout moment."
        />
      </div>

      {erreur && (
        <p className="v2-auth-error" role="alert">
          Votre espace n’a pas pu être créé. Réessayez dans un instant.
        </p>
      )}

      <section className="v2-result-card">
        <div className="v2-result-cell">
          <span>Plan préparé pour</span>
          <strong>{operationName}</strong>
        </div>
        <div className="v2-result-cell">
          <span>Objectif</span>
          <strong>{objective}</strong>
        </div>
        <div className="v2-result-cell">
          <span>Pays d’immatriculation</span>
          <strong>{startup.country ?? "À préciser"}</strong>
        </div>
        <div className="v2-result-cell">
          <span>Structure</span>
          <strong>Liste documentaire contextualisée</strong>
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
        <form action={completeV2Onboarding}>
          <input name="destination" type="hidden" value="preparation" />
          <BoutonEnvoi className="v2-onboard-primary" enCours="Création…">
            Commencer par les pièces prioritaires
          </BoutonEnvoi>
        </form>
        <form action={completeV2Onboarding}>
          <input name="destination" type="hidden" value="overview" />
          <BoutonEnvoi className="v2-onboard-secondary" enCours="Création…">
            Voir mon espace
          </BoutonEnvoi>
        </form>
      </div>
    </div>
  );
}
