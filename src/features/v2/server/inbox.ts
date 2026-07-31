import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * La boîte de réception — écran 65.
 *
 * Le pendant de Partage et accès : là on envoie, ici on reçoit. Deux sources
 * réelles, qui n'ont rien à voir l'une avec l'autre sinon qu'elles attendent
 * toutes deux une réponse :
 *
 *   · les DEMANDES d'accès à une data room (`access_requests`), posées par un
 *     investisseur depuis une vitrine ;
 *   · les INVITATIONS de cohorte (`mes_invitations`), qu'un programme adresse
 *     à l'entreprise.
 *
 * Les rassembler est le propre de cet écran : un fondateur n'a pas deux boîtes
 * en tête, il a des choses à traiter et des choses traitées.
 */

export interface EntreeBoite {
  id: string;
  type: "demande" | "cohorte";
  /** Ce qu'on lit en gras : « Amina Diallo demande un accès ». */
  titre: string;
  /** Le contexte : opération, organisation, instrument. */
  contexte: string;
  at: string;
  /** Où mène l'action, et comment elle s'appelle. */
  action: { label: string; href: string };
  /** Initiales de l'avatar. */
  initiales: string;
}

function initiales(texte: string): string {
  const mots = texte.trim().split(/\s+/).slice(0, 2);
  return mots.map((mot) => mot[0]?.toUpperCase() ?? "").join("") || "?";
}

const DECISIONS: Record<string, string> = {
  granted: "accès accordé",
  refused: "accès refusé",
  recommended: "recommandée au fondateur",
  forwarded: "transmise",
  dismissed: "écartée",
};

export interface Boite {
  aTraiter: EntreeBoite[];
  traitees: EntreeBoite[];
}

export async function inbox(organizationId: string): Promise<Boite> {
  const supabase = await createClient();

  const [{ data: demandes }, { data: cohortes }] = await Promise.all([
    // Les demandes adressées à MON organisation. La RLS borne déjà, mais
    // filtrer ici évite d'afficher celles qu'un programme voit pour d'autres.
    supabase
      .from("access_requests")
      .select(
        "id, status, instrument, message, created_at, decided_at, deal_id, investor_user, deals(name)",
      )
      .eq("startup_org_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.rpc("mes_invitations"),
  ]);

  const lignes = (demandes ?? []) as unknown as Array<{
    id: string;
    status: string;
    instrument: string | null;
    message: string | null;
    created_at: string;
    decided_at: string | null;
    deal_id: string;
    investor_user: string;
    deals: { name: string } | Array<{ name: string }> | null;
  }>;

  // Le nom de l'investisseur : `access_requests` ne garde que son
  // identifiant. Sans cette jointure, la ligne dirait « quelqu'un demande un
  // accès », ce qui n'aide à rien décider.
  const identifiants = [...new Set(lignes.map((row) => row.investor_user))];
  const noms = new Map<string, string>();

  if (identifiants.length > 0) {
    const { data: profils } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", identifiants);

    for (const p of (profils ?? []) as Array<{
      id: string;
      full_name: string | null;
      email: string | null;
    }>) {
      noms.set(p.id, p.full_name || p.email?.split("@")[0] || "Un investisseur");
    }
  }

  const aTraiter: EntreeBoite[] = [];
  const traitees: EntreeBoite[] = [];

  for (const row of lignes) {
    const deal = Array.isArray(row.deals) ? row.deals[0] : row.deals;
    const qui = noms.get(row.investor_user) ?? "Un investisseur";

    const contexte = [
      deal?.name,
      row.instrument ? `instrument : ${row.instrument}` : null,
      row.message ? `« ${row.message.slice(0, 60)} »` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const entree: EntreeBoite = {
      id: row.id,
      type: "demande",
      titre:
        row.status === "pending"
          ? `${qui} demande un accès`
          : `${qui} — ${DECISIONS[row.status] ?? row.status}`,
      contexte,
      at: row.decided_at ?? row.created_at,
      action:
        row.status === "pending"
          ? { label: "Examiner", href: `/v2/invitations?demande=${row.id}` }
          : {
              label: "Voir l’accès",
              href: `/v2/operations/${row.deal_id}/access`,
            },
      initiales: initiales(qui),
    };

    if (row.status === "pending") aTraiter.push(entree);
    else traitees.push(entree);
  }

  for (const row of ((cohortes ?? []) as Array<{
    token: string;
    programme: string;
    cohorte: string | null;
    invitee_le: string;
  }>)) {
    aTraiter.push({
      id: row.token,
      type: "cohorte",
      titre: `${row.programme} vous invite à rejoindre ${row.cohorte ?? "sa cohorte"}`,
      contexte: "Programme · choisissez l’opération à présenter",
      at: row.invitee_le,
      action: {
        label: "Voir l’invitation",
        href: `/v2/invitations/rejoindre?token=${row.token}`,
      },
      initiales: initiales(row.programme),
    });
  }

  const parDate = (a: EntreeBoite, b: EntreeBoite) => b.at.localeCompare(a.at);

  return {
    aTraiter: aTraiter.sort(parDate),
    traitees: traitees.sort(parDate).slice(0, 10),
  };
}

/** Une demande d'accès, pour le panneau d'examen. */
export interface DemandeDetail {
  id: string;
  investisseur: string;
  email: string | null;
  operationId: string;
  operationName: string;
  instrument: string | null;
  message: string | null;
  createdAt: string;
}

export async function accessRequest(
  organizationId: string,
  requestId: string,
): Promise<DemandeDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("access_requests")
    .select(
      "id, instrument, message, created_at, deal_id, investor_user, deals(name)",
    )
    .eq("startup_org_id", organizationId)
    .eq("id", requestId)
    .maybeSingle();

  if (!data) return null;

  const row = data as unknown as {
    id: string;
    instrument: string | null;
    message: string | null;
    created_at: string;
    deal_id: string;
    investor_user: string;
    deals: { name: string } | Array<{ name: string }> | null;
  };

  const { data: profil } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", row.investor_user)
    .maybeSingle();

  const p = profil as { full_name: string | null; email: string | null } | null;
  const deal = Array.isArray(row.deals) ? row.deals[0] : row.deals;

  return {
    id: row.id,
    investisseur: p?.full_name || p?.email?.split("@")[0] || "Un investisseur",
    email: p?.email ?? null,
    operationId: row.deal_id,
    operationName: deal?.name ?? "Opération",
    instrument: row.instrument,
    message: row.message,
    createdAt: row.created_at,
  };
}
