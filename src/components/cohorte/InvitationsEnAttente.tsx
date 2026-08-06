import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Le rappel des invitations qu'on n'a pas encore acceptées.
 *
 * POURQUOI IL EXISTE. En test réel, deux fondateurs sur deux ont confirmé leur
 * adresse, vu qu'il leur fallait d'abord un espace, l'ont créé — et ne sont
 * jamais revenus au lien de l'e-mail. Leur invitation restait en attente pour
 * toujours, et le programme les croyait silencieux alors qu'ils s'étaient
 * inscrits exprès.
 *
 * Faire traverser la destination à l'onboarding aurait réparé ce chemin-là
 * seulement. Celui qui perd son e-mail, s'inscrit avant de cliquer, ou repousse
 * à demain serait resté bloqué pareil. Ici l'invitation le retrouve, quel que
 * soit le chemin qu'il a pris.
 *
 * Composant SERVEUR, rendu là où le fondateur atterrit. Il ne s'affiche pas
 * quand il n'y a rien : une place vide dans une page d'accueil se remarque plus
 * qu'elle n'informe.
 */
export async function InvitationsEnAttente() {
  const t = await getTranslations("cohorts");
  const supabase = await createClient();

  // `cohort_links` n'est pas lisible par l'invité — sa politique réserve la
  // lecture au programme et à l'entreprise DÉJÀ rattachée. D'où la fonction.
  const { data } = await supabase.rpc("mes_invitations");
  const invitations = (data ?? []) as Array<{
    token: string;
    programme: string;
    cohorte: string | null;
  }>;

  if (invitations.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {invitations.map((i) => (
        <div
          key={i.token}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-[#F0C4AE] bg-[#FEFAF7] px-4 py-3.5"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-[600] text-[#8A4B2C]">
              {t("pendingInviteTitle", { programme: i.programme })}
            </p>
            <p className="text-[12px] text-[#A56A48] mt-0.5 leading-relaxed">
              {i.cohorte
                ? t("pendingInviteBody", { cohorte: i.cohorte })
                : t("pendingInviteBodyNoCohort")}
            </p>
          </div>
          <Link
            href={`/rejoindre/${i.token}`}
            className="shrink-0 rounded-[6px] bg-[#FF5A1F] px-4 py-2 text-[12.5px] font-[600] text-white hover:bg-[#E74C16]"
          >
            {t("pendingInviteCta")}
          </Link>
        </div>
      ))}
    </div>
  );
}
