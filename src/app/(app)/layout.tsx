import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { getCurrentDeal, getDealRole, getAnyRole } from "@/lib/current-deal";
import { personaFor } from "@/lib/persona";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  // Enforcement 2FA: si un facteur est vérifié, exiger aal2.
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
    redirect("/connexion/2fa");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, organizations(name)")
    .eq("user_id", user?.id ?? "")
    // Tri déterministe : sans lui, l'organisation retenue est arbitraire
    // dès qu'une personne en a plusieurs — ce que le rôle SAE rend courant.
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const { deal, deals } = await getCurrentDeal(supabase);

  // L'organisation affichée, comme le rôle, est celle DU deal ouvert : un
  // utilisateur peut appartenir à plusieurs organisations, et afficher le nom
  // de l'une avec les données de l'autre serait trompeur.
  const { data: dealOrg } = deal
    ? await supabase
        .from("organizations")
        .select("name, paid_until")
        .eq("id", deal.org_id)
        .maybeSingle()
    : { data: null };

  // Abonnement. La base refuse déjà toute ÉCRITURE au-delà de l'échéance
  // (cf. `deal_org_for_write`) ; ici on ferme la lecture, mais vers un écran
  // qui explique et propose de régulariser — une erreur SQL n'explique rien.
  //
  // `paid_until` à null = organisation jamais soumise à l'abonnement.
  const echeance = (dealOrg as { paid_until?: string | null } | null)
    ?.paid_until;
  const restant = echeance
    ? Math.ceil(
        (new Date(echeance).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null;
  if (restant !== null && restant <= 0) redirect("/abonnement");

  const orgName =
    dealOrg?.name ??
    (membership.organizations as { name?: string } | null)?.name ??
    "—";

  const role = deal
    ? await getDealRole(supabase, deal.org_id)
    : await getAnyRole(supabase);

  // Le métier de l'utilisateur décide du vocabulaire et des écrans proposés.
  // Lu ici, une seule fois, plutôt que dans chaque page.
  const { data: profil } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();
  const persona = personaFor(
    (profil as { account_type?: string } | null)?.account_type,
    role,
  );

  return (
    <AppShell
      orgName={orgName}
      userEmail={user.email ?? ""}
      deals={deals}
      currentDealId={deal?.id ?? null}
      role={role}
      persona={persona}
    >
      {/* Le verrouillage est brutal — plus rien n'est accessible. Il ne doit
          donc jamais surprendre : on prévient la dernière semaine, et le
          message se resserre à mesure que l'échéance approche. */}
      {restant !== null && restant <= 7 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[10px] border border-[oklch(0.85_0.09_75)] bg-[oklch(0.97_0.03_85)] px-3.5 py-2.5">
          <span className="text-[12.5px] font-[550] text-[oklch(0.42_0.11_60)]">
            {restant <= 1
              ? "Votre accès se ferme aujourd’hui."
              : `Votre accès se ferme dans ${restant} jours.`}
          </span>
          <a
            href="/abonnement"
            className="text-[12.5px] font-[550] text-[oklch(0.42_0.11_60)] underline underline-offset-2"
          >
            Régulariser
          </a>
        </div>
      )}
      {children}
    </AppShell>
  );
}
