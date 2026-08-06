import { v2Routes } from "@/features/v2/navigation/routes";
import { saisieProgramme } from "@/features/v2/server/programme";
import { AvisEphemere } from "@/features/v2/ui/AvisEphemere";
import { BoutonEnvoi } from "@/features/v2/ui/BoutonEnvoi";
import {
  ETAPES_PROGRAMME,
  OnboardingTitle,
  Stepper,
} from "@/features/v2/ui/Onboarding";

import { enregistrerOrganisation } from "../actions";

const TYPES = [
  "Accélérateur",
  "Incubateur",
  "Fonds d’investissement",
  "Banque ou institution financière",
  "Bailleur / programme d’appui",
];

const PAYS = [
  "Sénégal", "Côte d’Ivoire", "Bénin", "Burkina Faso", "Mali", "Niger",
  "Togo", "Guinée", "Cameroun", "Gabon", "Congo", "Autre",
];

/**
 * Les trois échecs du logo se disent séparément.
 *
 * « L'enregistrement n'a pas abouti » devant un fichier trop lourd envoie
 * ressaisir un formulaire qui, lui, est déjà enregistré — le reste de l'étape
 * est passé avant le dépôt. Chacun dit donc ce qui s'est passé, et quoi faire.
 */
const MESSAGES: Readonly<Record<string, string>> = {
  logo_depot: "Le logo n’a pas pu être déposé. Le reste est enregistré : réessayez le fichier seul.",
  logo_taille: "Ce logo dépasse 2 Mo. Le reste est enregistré : déposez une version plus légère.",
  logo_type: "Ce format de logo n’est pas accepté. Déposez un PNG, un SVG, un JPEG ou un WEBP.",
  nom: "Donnez le nom de votre organisation pour continuer.",
};

/** Écran 00a — étape 2 : l'organisation. */
export default async function OrganisationPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const [{ erreur }, saisie] = await Promise.all([
    searchParams,
    saisieProgramme(),
  ]);

  return (
    <form action={enregistrerOrganisation} className="v2-onboard-body">
      <Stepper current={2} etapes={ETAPES_PROGRAMME} />
      <OnboardingTitle
        description="Ces informations apparaîtront auprès des entreprises que vous invitez et sur vos dealrooms."
        title="Parlez-nous de votre organisation"
      />

      {erreur && (
        <p className="v2-auth-error" role="alert">
          <AvisEphemere />
          {MESSAGES[erreur] ?? "L’enregistrement n’a pas abouti. Réessayez."}
        </p>
      )}

      <label className="v2-field">
        <span>Nom de l’organisation</span>
        <div className="v2-control">
          <input
            defaultValue={saisie.nom}
            name="nom"
            placeholder="Savane Accelerator"
            required
          />
        </div>
      </label>

      <div className="v2-duo">
        <label className="v2-field">
          <span>Type d’organisation</span>
          <div className="v2-control">
            <select defaultValue={saisie.type ?? TYPES[0]} name="type">
              {TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
        </label>
        <label className="v2-field">
          <span>Pays</span>
          <div className="v2-control">
            <select defaultValue={saisie.pays ?? PAYS[0]} name="pays">
              {PAYS.map((pays) => (
                <option key={pays}>{pays}</option>
              ))}
            </select>
          </div>
        </label>
      </div>

      <label className="v2-field">
        <span>
          Site internet <small>— facultatif</small>
        </span>
        <div className="v2-control">
          <input
            defaultValue={saisie.site ?? ""}
            name="site"
            placeholder="savane.africa"
          />
        </div>
      </label>

      <div className="v2-field">
        <span>
          Logo <small>— facultatif, utilisé sur vos dealrooms</small>
        </span>
        {/* La maquette peint cette pastille avec `var(--brand)`, un token qui
            n'existe dans aucun `parcours.css` : elle serait transparente.
            L'accent orange est la seule lecture possible.

            L'`input` couvre toute la boîte en transparence : on clique donc
            n'importe où, et le clavier l'atteint — d'où le `:focus-within` qui
            dessine le contour, sans quoi le focus serait invisible. */}
        <label className="v2-onb-depot">
          {saisie.logo ? (
            // Une pastille de 40 px, servie par le Storage : `next/image`
            // exigerait d'inscrire ce domaine dans `remotePatterns` et de faire
            // passer chaque logo par l'optimiseur, pour rien à cette taille.
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" src={saisie.logo} />
          ) : (
            <b>{initiales(saisie.nom)}</b>
          )}
          <span>
            {saisie.logo
              ? "Déposez un autre fichier pour le remplacer."
              : "Déposez un fichier PNG ou SVG — sinon nous utilisons vos initiales."}
          </span>
          <span aria-hidden="true" className="v2-btn" data-variant="secondary">
            Choisir un fichier
          </span>
          <input
            accept="image/png,image/svg+xml,image/jpeg,image/webp"
            name="logo"
            type="file"
          />
        </label>
      </div>

      <div className="v2-form-actions">
        <a className="v2-onboard-back" href={v2Routes.root}>
          ← Retour
        </a>
        <div>
          <BoutonEnvoi className="v2-onboard-primary" enCours="Enregistrement…">
            Continuer
          </BoutonEnvoi>
        </div>
      </div>
      <p className="v2-onboard-disclaimer">
        Vous pourrez modifier ces informations à tout moment dans les réglages.
      </p>
    </form>
  );
}

/** « Savane Accelerator » → « SA ». Deux lettres, jamais plus. */
function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "SA";
  return mots
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? "")
    .join("");
}
