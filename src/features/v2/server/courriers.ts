import "server-only";

import { montant as formaterMontant } from "@/features/v2/billing/format";
import { dateJournal } from "@/features/v2/domain/journal";
import {
  renouvellementEmail,
  resiliationEmail,
  souscriptionEmail,
} from "@/lib/email/billing-templates";
import { sendEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Prévenir le client de ce qui arrive à son abonnement.
 *
 * UN SEUL ENDROIT POUR DEUX CHEMINS. Un paiement peut être confirmé par le
 * webhook ou par la vérification au retour ; si chacun envoyait son courrier,
 * un client recevrait deux fois le même — ou aucun, le jour où l'un des deux
 * chemins évolue seul. Les deux appellent ici.
 *
 * UN COURRIER QUI ÉCHOUE NE DOIT RIEN FAIRE ÉCHOUER. Le paiement est encaissé,
 * le plan est ouvert : refuser tout parce que Resend est indisponible
 * transformerait un incident d'envoi en incident de facturation. On trace, et
 * on rend la main.
 *
 * LE DESTINATAIRE EST LE PROPRIÉTAIRE DE L'ESPACE, pas la personne qui a
 * cliqué. C'est lui qui paie et qui gardera la trace comptable — et sur un
 * renouvellement, personne n'a cliqué du tout.
 */

interface Destinataire {
  email: string;
  orgNom: string;
}

async function proprietaire(orgId: string): Promise<Destinataire | null> {
  const admin = createAdminClient();

  const [{ data: org }, { data: membres }] = await Promise.all([
    admin.from("organizations").select("name").eq("id", orgId).maybeSingle(),
    admin
      .from("memberships")
      .select("user_id, role")
      .eq("org_id", orgId)
      .eq("role", "owner")
      .limit(1),
  ]);

  const owner = (membres ?? [])[0] as { user_id: string } | undefined;
  if (!owner) return null;

  const { data: profil } = await admin
    .from("profiles")
    .select("email")
    .eq("id", owner.user_id)
    .maybeSingle();

  const email = (profil as { email: string | null } | null)?.email;
  if (!email) return null;

  return { email, orgNom: (org as { name: string } | null)?.name ?? "votre espace" };
}

function lienAbonnement(): string {
  const base = (process.env.SANZA_PUBLIC_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}/v2/abonnement` : "https://sanza.africa";
}

/**
 * Après un paiement encaissé — souscription ou reconduction.
 *
 * La distinction se fait sur le NOMBRE de factures : la première est une
 * souscription, les suivantes des reconductions. On ne souhaite pas la
 * bienvenue à quelqu'un qui paie pour la sixième fois.
 */
export async function previenirDuPaiement(orgId: string): Promise<void> {
  try {
    const qui = await proprietaire(orgId);
    if (!qui) return;

    const admin = createAdminClient();

    const [{ data: abo }, { data: factures }] = await Promise.all([
      admin
        .from("subscriptions")
        .select("current_period_end, plans!subscriptions_plan_id_fkey(name)")
        .eq("workspace_id", orgId)
        .maybeSingle(),
      admin
        .from("invoices")
        .select("number, total_amount, currency")
        .eq("workspace_id", orgId)
        .order("issued_at", { ascending: false })
        .limit(2),
    ]);

    const lignes = (factures ?? []) as Array<{
      number: string | null;
      total_amount: number;
      currency: string;
    }>;
    const derniere = lignes[0];
    if (!derniere) return; // Sans facture, on n'a rien à annoncer de chiffré.

    const abonnement = abo as {
      current_period_end: string | null;
      plans: { name: string } | Array<{ name: string }> | null;
    } | null;

    const plan = Array.isArray(abonnement?.plans)
      ? abonnement?.plans[0]
      : abonnement?.plans;

    const commun = {
      orgName: qui.orgNom,
      planNom: plan?.name ?? "votre plan",
      montant: formaterMontant(derniere.total_amount, derniere.currency),
      echeance: abonnement?.current_period_end
        ? dateJournal(abonnement.current_period_end)
        : null,
      facture: derniere.number,
      lien: lienAbonnement(),
    };

    const courrier =
      lignes.length > 1 ? renouvellementEmail(commun) : souscriptionEmail(commun);

    const envoi = await sendEmail({ to: qui.email, ...courrier });
    if (!envoi.ok && !envoi.skipped) {
      console.error("[v2 abonnement] courrier de paiement non parti :", envoi.error);
    }
  } catch (erreur) {
    // Le paiement est encaissé et le plan ouvert : un échec ici ne doit
    // remonter à personne d'autre qu'aux journaux.
    console.error("[v2 abonnement] courrier de paiement impossible :", erreur);
  }
}

/** Après une résiliation annoncée. */
export async function previenirDeLaResiliation(orgId: string): Promise<void> {
  try {
    const qui = await proprietaire(orgId);
    if (!qui) return;

    const admin = createAdminClient();
    const { data: abo } = await admin
      .from("subscriptions")
      .select("current_period_end, plans!subscriptions_plan_id_fkey(name)")
      .eq("workspace_id", orgId)
      .maybeSingle();

    const abonnement = abo as {
      current_period_end: string | null;
      plans: { name: string } | Array<{ name: string }> | null;
    } | null;

    const plan = Array.isArray(abonnement?.plans)
      ? abonnement?.plans[0]
      : abonnement?.plans;

    const courrier = resiliationEmail({
      orgName: qui.orgNom,
      planNom: plan?.name ?? "votre plan",
      finLe: abonnement?.current_period_end
        ? dateJournal(abonnement.current_period_end)
        : null,
      lien: lienAbonnement(),
    });

    const envoi = await sendEmail({ to: qui.email, ...courrier });
    if (!envoi.ok && !envoi.skipped) {
      console.error("[v2 abonnement] courrier de résiliation non parti :", envoi.error);
    }
  } catch (erreur) {
    console.error("[v2 abonnement] courrier de résiliation impossible :", erreur);
  }
}
