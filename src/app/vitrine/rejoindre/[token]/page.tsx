import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

/**
 * L'investisseur accepte l'invitation à une vitrine.
 *
 * PAS D'ÉCRAN DE CONSENTEMENT ICI, contrairement à `/rejoindre/[token]` où le
 * fondateur engage sa startup. La dissymétrie est voulue : entrer dans une
 * vitrine n'expose RIEN de l'invité et ne l'engage à rien — il consulte des
 * chiffres que des entreprises ont choisi de publier. Lui faire cocher une
 * case avant de regarder serait un rituel vide, et les rituels vides usent le
 * consentement qu'on demandera plus tard, quand il comptera.
 *
 * On accepte donc en arrivant, et on l'emmène là où il voulait aller.
 *
 * L'ADRESSE FAIT FOI, PAS LE JETON. `accept_showcase_invite` refuse si le
 * compte connecté n'a pas l'adresse invitée : un lien transféré à un collègue
 * ne lui ouvre rien. C'est ce qui rend l'invitation nominative au sens de la
 * règle §4, et pas seulement dans l'intention.
 */
export default async function RejoindreVitrinePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("showcase");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?suivant=/vitrine/rejoindre/${token}`);

  const { data, error } = await supabase.rpc("accept_showcase_invite", {
    p_token: token,
  });

  // La cohorte est renvoyée en cas de succès ; `null` signifie jeton inconnu
  // ou invitation révoquée. Les deux mènent au même écran : dire lequel
  // renseignerait un curieux sur l'existence d'un jeton.
  if (!error && data) redirect("/vitrine");

  // Le seul cas qu'on NOMME : la bonne invitation, la mauvaise adresse. Sans
  // cela l'investisseur relit son e-mail en boucle sans comprendre, alors que
  // le remède est simple — se connecter avec l'adresse invitée.
  const mauvaiseAdresse = error?.message?.includes("autre adresse") ?? false;

  return (
    <div className="max-w-[520px] mx-auto py-10 text-[#1A1B1F]">
      <h1 className="font-display text-[22px] font-[700] tracking-[-0.02em]">
        {mauvaiseAdresse ? t("joinWrongAddressTitle") : t("joinInvalidTitle")}
      </h1>
      <p className="text-[13px] text-[#6E727A] mt-2 leading-relaxed">
        {mauvaiseAdresse
          ? t("joinWrongAddressBody", { email: user.email ?? "—" })
          : t("joinInvalidBody")}
      </p>
      <Link
        href="/connexion"
        className="inline-flex items-center mt-5 rounded-[6px] bg-[#E85C2B] px-4 py-2.5 text-[13px] font-[600] text-white hover:bg-[#D24E1F]"
      >
        {t("joinSwitchAccount")}
      </Link>
    </div>
  );
}
