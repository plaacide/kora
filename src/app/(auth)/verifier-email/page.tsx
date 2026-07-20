import Link from "next/link";
import { getTranslations } from "next-intl/server";

/**
 * Après inscription.
 *
 * Le texte couvre DEUX cas, et c'est tout l'enjeu de cet écran. Quand
 * l'adresse a déjà un compte, Supabase renvoie un succès SANS envoyer le
 * moindre e-mail — protection délibérée contre l'énumération des comptes. La
 * page annonçait pourtant « un lien vient de vous être envoyé » : la personne
 * attend alors un message qui ne partira jamais, et n'a aucun moyen de le
 * savoir.
 *
 * On ne peut pas dire laquelle des deux situations s'applique sans rouvrir la
 * faille d'énumération. On dit donc les deux, dans le même texte pour tout le
 * monde — et on donne les deux issues.
 */
export default async function VerifierEmailPage() {
  const t = await getTranslations("auth.verifyEmail");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
        {t("title")}
      </h1>
      <p className="text-[13px] text-ink-secondary leading-relaxed">
        {t("body")}
      </p>
      <p className="text-[13px] text-ink-secondary leading-relaxed">
        {t("already")}
      </p>
      <div className="flex flex-wrap gap-4">
        <Link href="/connexion" className="text-[13px] font-medium">
          {t("back")}
        </Link>
        <Link
          href="/mot-de-passe-oublie"
          className="text-[13px] font-medium text-link hover:text-link-hover"
        >
          {t("reset")}
        </Link>
      </div>
    </div>
  );
}
