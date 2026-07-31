import { redirect } from "next/navigation";

import { v2Routes } from "@/features/v2/navigation/routes";
import { role as roleDe } from "@/features/v2/domain/equipe";
import { createClient } from "@/lib/supabase/server";
import { JoinTeam } from "@/features/v2/ui/JoinTeam";

/**
 * Rejoindre l'équipe d'une organisation — la contrepartie de l'écran 33.
 *
 * Cette page vit HORS du poste de pilotage. Le groupe `(workspace)` exige une
 * appartenance : la personne qui suit ce lien n'en a précisément pas encore,
 * et serait renvoyée à l'onboarding avant d'avoir pu accepter quoi que ce soit.
 *
 * Elle ne lit pas `org_invitations` directement — la RLS le lui refuserait,
 * pour la même raison. `org_invitation_preview` ne rend que le nom de
 * l'organisation, le rôle proposé et l'adresse concernée : de quoi décider,
 * rien de plus. Un lien deviné ne révèle donc rien d'autre.
 */
export default async function RejoindreEquipePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect(v2Routes.auth.login);

  const supabase = await createClient();

  const [{ data }, { data: session }] = await Promise.all([
    supabase.rpc("org_invitation_preview", { p_token: token }),
    supabase.auth.getUser(),
  ]);

  const apercu = (Array.isArray(data) ? data[0] : data) as
    | {
        organisation: string;
        role: string;
        email: string;
        expiree: boolean;
        revoquee: boolean;
        acceptee: boolean;
      }
    | undefined;

  const etat = !apercu
    ? "introuvable"
    : apercu.revoquee
      ? "revoquee"
      : apercu.acceptee
        ? "acceptee"
        : apercu.expiree
          ? "expiree"
          : "valide";

  return (
    <JoinTeam
      adresseAttendue={apercu?.email ?? null}
      adresseConnectee={session.user?.email ?? null}
      etat={etat}
      organisation={apercu?.organisation ?? null}
      roleLabel={apercu ? roleDe(apercu.role).label : null}
      token={token}
    />
  );
}
