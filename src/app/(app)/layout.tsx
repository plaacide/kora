import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { SurveyGate } from "@/components/survey/SurveyGate";
import { getCurrentDeal, getDealRole, getAnyRole } from "@/lib/current-deal";
import { personaFor } from "@/lib/persona";
import { joursRestants } from "@/lib/echeance";

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
  const restant = joursRestants(echeance);
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

  // Comptes réels des onglets de la salle (équipe interne seulement) : invités
  // ayant accès, exigences restantes, questions ouvertes. Requêtes `head`
  // (compte seul) et tolérantes — un compte manquant masque juste la pastille.
  const interne = persona === "founder" || persona === "fund";

  // §8 — entrées non encore atteignables, avec leur condition RÉELLE.
  //
  // On grise plutôt que de masquer : un menu qui s'allonge tout seul au fil des
  // jours désoriente, alors qu'une entrée grisée qui dit sa condition enseigne
  // le produit. La phrase est calculée ici parce que seul le serveur sait s'il
  // existe une entreprise ou une fiche publiée.
  //
  // Uniquement pour le PROGRAMME : les autres personas possèdent un dossier,
  // leurs écrans ont toujours quelque chose à dire, fût-ce un état vide.
  const bloquees: Record<string, string> = {};
  if (persona === "sae") {
    const ts = await getTranslations("shell");
    const [{ count: nMembres }, { count: nPubliees }] = await Promise.all([
      supabase.from("cohort_members").select("cohort_id", { count: "exact", head: true }),
      supabase
        .from("showcase_entries")
        .select("id", { count: "exact", head: true })
        .is("unpublished_at", null),
    ]);
    if (!nMembres) bloquees["/portefeuille"] = ts("lockedPortfolio");
    // Sans fiche publiée, aucune demande ne PEUT exister : l'écran serait vide
    // par construction, pas par hasard.
    if (!nPubliees) bloquees["/demandes"] = ts("lockedRequests");
    // Le rapport REFUSE de se générer sous le seuil ; l'entrée dit donc la
    // même condition, plutôt que d'y mener pour montrer un refus.
    const { count: nEntamees } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true });
    if (!nEntamees) bloquees["/rapports"] = ts("lockedReports");
  }

  // UNE phrase sous le menu, pas une par entrée grisée. On nomme la condition
  // la PLUS PROCHE d'être remplie — celle qui débloque le plus d'écrans d'un
  // coup. Tant qu'aucune entreprise n'a rejoint, tout dépend de ça ; ensuite
  // c'est le premier dépôt qui commande.
  const aideMenu =
    Object.keys(bloquees).length === 0
      ? undefined
      : bloquees["/portefeuille"]
        ? (await getTranslations("shell"))("hintNoCompany")
        : (await getTranslations("shell"))("hintNoDocument");
  let roomCounts: { permissions?: number; checklist?: number; qa?: number } | undefined;
  if (interne && deal) {
    const [perm, chk, qa] = await Promise.all([
      supabase.from("invitations").select("id", { count: "exact", head: true }).eq("deal_id", deal.id).eq("status", "accepted"),
      supabase.from("checklist_items").select("id", { count: "exact", head: true }).eq("deal_id", deal.id).neq("status", "done"),
      supabase.from("qa_questions").select("id", { count: "exact", head: true }).eq("deal_id", deal.id).neq("answer_status", "published"),
    ]);
    roomCounts = {
      permissions: perm.count ?? undefined,
      checklist: chk.count ?? undefined,
      qa: qa.count ?? undefined,
    };
  }

  return (
    <AppShell
      orgName={orgName}
      userEmail={user.email ?? ""}
      deals={deals}
      currentDealId={deal?.id ?? null}
      role={role}
      persona={persona}
      bloquees={bloquees}
      aideMenu={aideMenu}
      roomCounts={roomCounts}
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
      {/* Enquête produit. Montée ici, donc présente sur tous les écrans de
          l'application — mais elle décide seule de ne rien afficher : la liste
          blanche de routes et les états de blocage vivent dans la porte, pas
          ici. */}
      <SurveyGate />
    </AppShell>
  );
}
