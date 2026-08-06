"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { signup } from "@/app/actions/auth";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { FormError, FieldError } from "./FormError";
import { POSTES, POSTE_AUTRE } from "@/lib/job-titles";
import { SsoButtons } from "./SsoButtons";
import { cheminInterne } from "@/lib/redirect";
import { cn } from "@/lib/cn";

/**
 * Icônes de rôle en TRAIT (handoff v2 §2 : zéro emoji). 19 px, stroke 2,
 * `currentColor` — donc grises par défaut, orange quand la carte est active.
 */
function RoleIcon({ name }: { name: "investor" | "founder" | "sae" }) {
  const common = {
    width: 19,
    height: 19,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "investor") {
    // Histogramme : l'investisseur évalue des chiffres.
    return (
      <svg {...common}>
        <path d="M5 20V10" /><path d="M12 20V4" /><path d="M19 20v-6" />
      </svg>
    );
  }
  if (name === "founder") {
    // Fusée, en trait — l'équivalent dessiné du 🚀 d'origine. Une pousse de
    // plante évoquait l'agritech, pas une levée de fonds.
    return (
      <svg {...common}>
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91 0z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    );
  }
  // Cible : le programme vise un portefeuille. Trois anneaux + centre, sinon
  // deux cercles se lisaient comme un simple point.
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

/**
 * `suivant` : où reprendre après l'inscription.
 *
 * Même exigence que la connexion, avec une marche de plus — l'inscription
 * passe le plus souvent par une confirmation d'e-mail, et la destination doit
 * survivre à l'aller-retour dans la boîte mail (cf. `signup`).
 */
export function SignupForm({
  suivant,
  email,
}: { suivant?: string; email?: string } = {}) {
  const [state, action, pending] = useActionState(signup, undefined);
  const t = useTranslations("auth.signup");
  const locale = useLocale();
  const [role, setRole] = useState<"investor" | "founder" | "sae">("investor");
  // Les trois personas. Déclarées ici et non au niveau du module : leurs
  // libellés viennent de next-intl, qui n'existe qu'à l'intérieur du rendu.
  const ROLES = [
    { key: "investor", title: t("roleInvestor"), desc: t("roleInvestorSub") },
    { key: "founder", title: t("roleFounder"), desc: t("roleFounderSub") },
    { key: "sae", title: t("roleSae"), desc: t("roleSaeSub") },
  ] as const;

  const [posteKey, setPosteKey] = useState("");
  const [posteLibre, setPosteLibre] = useState("");

  // Le poste transmis : le libellé traduit, ou la saisie libre si « Autre ».
  const poste =
    posteKey === POSTE_AUTRE
      ? posteLibre.trim()
      : posteKey
        ? t(`jobTitles.${posteKey}`)
        : "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[32px] font-[700] tracking-[-0.025em] leading-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-[13px] text-[#4A4E63]">
          {t("haveAccount")}{" "}
          {/* Bascule vers la connexion : l'invité qui a DÉJÀ un compte ne
              doit pas perdre sa destination en changeant d'écran. */}
          <Link
            href={
              suivant
                ? `/connexion?suivant=${encodeURIComponent(suivant)}` +
                  (email ? `&email=${encodeURIComponent(email)}` : "")
                : "/connexion"
            }
            className="font-medium"
          >
            {t("loginLink")}
          </Link>
        </p>
      </div>

      {/* Sélecteur de persona : aiguille l'onboarding. */}
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-[550] text-ink-secondary">
          {t("youAre")}
        </span>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              // Changer de persona change la liste des postes : on repart de
              // zéro, sinon la sélection pointe une option qui n'existe plus.
              onClick={() => {
                setRole(r.key);
                setPosteKey("");
                setPosteLibre("");
              }}
              aria-pressed={role === r.key}
              className={cn(
                "flex flex-col items-start gap-1.5 rounded-[10px] p-2.5 text-left transition-colors cursor-pointer",
                // Carte active : bordure 1.5px orange + fond #FDF1EA (handoff §3).
                role === r.key
                  ? "border-[1.5px] border-[#FF5A1F] bg-[#FDF1EA]"
                  : "border-[1.5px] border-[#E2DED4] hover:border-[#C9C6BD]",
              )}
            >
              <span className={role === r.key ? "text-[#FF5A1F]" : "text-[#8B8FA3]"}>
                <RoleIcon name={r.key} />
              </span>
              <span className="text-[12.5px] font-[650]">{r.title}</span>
              <span className="text-[10.5px] text-ink-muted leading-tight">
                {r.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SSO d'abord (handoff v2 §3). Le rôle choisi ci-dessus est transmis :
          au retour, il fixe le type de compte comme le ferait le formulaire. */}
      <SsoButtons next={cheminInterne(suivant, "/onboarding")} role={role} />

      <form action={action} className="flex flex-col gap-4">
        {/* L'action serveur ne voit pas l'URL. */}
        <input type="hidden" name="suivant" value={suivant ?? ""} />
        <input type="hidden" name="account_type" value={role} />
        <FormError errorKey={state?.errorKey} errorRaw={state?.errorRaw} />

        <div>
          <Input label={t("fullName")} name="full_name" autoComplete="name" />
          <FieldError messages={state?.fieldErrors?.full_name} />
        </div>

        <div>
          {/* Poste : liste fermée plutôt que texte libre. Ce champ s'affiche
              dans « Équipe sur la levée », que lit un investisseur — en libre,
              on récoltait « ceo », « CEO & Founder » et « pdg » pour un même
              poste. La liste suit la persona choisie plus haut, et « Autre »
              rouvre un champ libre pour ne bloquer personne. */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-[550] text-ink-secondary">{t("jobTitle")}</span>
            <select
              value={posteKey}
              onChange={(e) => setPosteKey(e.target.value)}
              className="bg-white h-10 px-3 text-[13px] border border-[#E2DED4] rounded-[6px] focus:outline-none focus:border-[#C9C6BD]"
            >
              <option value="">{t("jobTitleChoose")}</option>
              {POSTES[role].map((k) => (
                <option key={k} value={k}>{t(`jobTitles.${k}`)}</option>
              ))}
              <option value={POSTE_AUTRE}>{t(`jobTitles.${POSTE_AUTRE}`)}</option>
            </select>
          </label>

          {posteKey === POSTE_AUTRE && (
            <input
              value={posteLibre}
              onChange={(e) => setPosteLibre(e.target.value)}
              placeholder={t("jobTitleOtherPlaceholder")}
              autoComplete="organization-title"
              autoFocus
              className="bg-white mt-2 w-full h-10 px-3 text-[13px] border border-[#E2DED4] rounded-[6px] focus:outline-none focus:border-[#C9C6BD]"
            />
          )}

          {/* Seul ce champ est soumis : le libellé final, dans la langue de
              l'utilisateur — c'est ce que la table stockait déjà en libre. */}
          <input type="hidden" name="job_title" value={poste} />
          <FieldError messages={state?.fieldErrors?.job_title} />
        </div>

        <div>
          {/* Pré-rempli depuis l'invitation, mais MODIFIABLE : un dirigeant
              peut vouloir un autre compte. Il sera alors averti clairement par
              le garde-fou « cette invitation vise une autre adresse » — mieux
              vaut un avertissement lisible qu'un champ verrouillé. */}
          <Input
            label={t("email")}
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={email}
            placeholder={t("emailPlaceholder")}
          />
          <FieldError messages={state?.fieldErrors?.email} />
        </div>

        <div>
          <PasswordInput
            label={t("password")}
            name="password"
            autoComplete="new-password"
            hint={t("passwordHint")}
          />
          <FieldError messages={state?.fieldErrors?.password} />
        </div>

        {/* La langue n'est plus un champ du formulaire (handoff v2 §2) : elle se
            choisit en pied de page. On transmet celle en cours pour que le
            compte, et donc les e-mails, soient dans la bonne langue. */}
        <input type="hidden" name="locale" value={locale} />

        <Button type="submit" variant="primary" loading={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
