import "server-only";

import type {
  Interaction,
  InvestisseurPipeline,
  TypeInteraction,
} from "@/features/v2/domain/pipeline";
import { createClient } from "@/lib/supabase/server";

/**
 * La levée d'une opération — écrans 35, 36, 37 et 45.
 *
 * Une opération n'a qu'UNE levée en cours (`statut = 'en_cours'`), décision
 * posée par `20260726210000_une_levee_active`. Les levées clôturées restent
 * en base : c'est l'historique de financement de l'entreprise, et le
 * récapitulatif de clôture doit rester consultable.
 *
 * Les colonnes sont en français — héritage du moment où cette table est née.
 * On lit ce qui existe plutôt que ce qu'on aurait nommé.
 */

export interface Raise {
  id: string;
  name: string | null;
  /** Montant recherché. `null` tant que la levée n'est pas configurée. */
  target: number | null;
  /** Montant déclaré comme sécurisé — saisi à la main, jamais déduit. */
  secured: number | null;
  currency: string;
  stage: string | null;
  instrument: string | null;
  preMoney: number | null;
  deadline: string | null;
  /** Types d'investisseurs visés : `vc`, `dfi`, `banque`. */
  audience: string[];
  description: string | null;
  /** La fourchette de ticket recherchée — se compare, contrairement à un texte. */
  ticketMin: number | null;
  ticketMax: number | null;
  /** « recherche » · « trouve » · « sans_lead ». `null` = non renseigné. */
  leadStatut: string | null;
  /** Part de capital envisagée, en pourcentage. */
  partCapital: number | null;
  /** Répartition de l'usage des fonds — les postes changent d'une levée à l'autre. */
  usagesFonds: Array<{ poste: string; part: number }>;
  status: string;
  closedAt: string | null;
}

function enRaise(row: Record<string, unknown>): Raise {
  return {
    id: row.id as string,
    name: (row.name as string | null) ?? null,
    target: (row.montant_cible as number | null) ?? null,
    secured: (row.montant_engage as number | null) ?? null,
    currency: (row.devise as string | null) ?? "XOF",
    stage: (row.stade as string | null) ?? null,
    instrument: (row.type_tour as string | null) ?? null,
    preMoney: (row.valorisation_pre as number | null) ?? null,
    deadline: (row.date_cloture as string | null) ?? null,
    audience: (row.audience as string[] | null) ?? [],
    description: (row.description as string | null) ?? null,
    ticketMin: (row.ticket_min as number | null) ?? null,
    ticketMax: (row.ticket_max as number | null) ?? null,
    leadStatut: (row.lead_statut as string | null) ?? null,
    partCapital: (row.part_capital as number | null) ?? null,
    usagesFonds:
      (row.usages_fonds as Array<{ poste: string; part: number }> | null) ?? [],
    status: (row.statut as string | null) ?? "en_cours",
    closedAt: (row.updated_at as string | null) ?? null,
  };
}

/**
 * La levée EN COURS d'une opération, ou `null` s'il n'y en a pas.
 *
 * `null` n'est pas une anomalie : une data room de diligence ou un dossier
 * bancaire n'a pas de levée, et le fondateur peut aussi en créer une plus
 * tard. C'est l'écran 35 qui répond dans ce cas.
 */
export async function activeRaise(operationId: string): Promise<Raise | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("raises")
    .select("*")
    .eq("deal_id", operationId)
    .eq("statut", "en_cours")
    .maybeSingle();

  return data ? enRaise(data as Record<string, unknown>) : null;
}

/** Les levées clôturées, de la plus récente à la plus ancienne. */
export async function closedRaises(operationId: string): Promise<Raise[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("raises")
    .select("*")
    .eq("deal_id", operationId)
    .neq("statut", "en_cours")
    .order("updated_at", { ascending: false });

  return ((data ?? []) as Array<Record<string, unknown>>).map(enRaise);
}

/**
 * Le pipeline investisseur — écrans 38 à 40.
 *
 * Liste curée à la main. Les tickets ne sont PAS sommés pour alimenter le
 * montant sécurisé : la migration qui l'a créée le dit explicitement, ce sont
 * deux choses distinctes. Un ticket est une intention, `montant_engage` est
 * une déclaration du fondateur.
 *
 * L'état d'accès est DÉDUIT des invitations, par l'adresse. C'est le seul lien
 * réel entre le pipeline et la data room : un investisseur qu'on suit ici et
 * qu'on a invité là-bas est la même personne, et l'écran doit le montrer sans
 * qu'on ait à le ressaisir.
 */
export async function pipelineInvestors(
  operationId: string,
): Promise<InvestisseurPipeline[]> {
  const supabase = await createClient();

  const [{ data }, { data: invitations }] = await Promise.all([
    supabase
      .from("raise_investors")
      .select(
        "id, nom, organisation, email, ticket, etape, engagement, categorie, fonction, pays, source, responsable, prochaine_action, date_relance, notes, position",
      )
      .eq("deal_id", operationId)
      .order("position"),
    supabase
      .from("invitations")
      .select("email, status, expires_at")
      .eq("deal_id", operationId),
  ]);

  const maintenant = Date.now();
  const acces = new Map<string, string>();

  for (const inv of (invitations ?? []) as Array<{
    email: string;
    status: string;
    expires_at: string | null;
  }>) {
    const expiree =
      inv.expires_at != null && new Date(inv.expires_at).getTime() <= maintenant;

    const etat =
      inv.status === "revoked"
        ? "Révoqué"
        : expiree
          ? "Expiré"
          : inv.status === "accepted"
            ? "Accès actif"
            : inv.status === "nda_pending"
              ? "NDA en attente"
              : "Invitation envoyée";

    // Plusieurs invitations pour une même adresse : la plus ouverte gagne.
    // Afficher « Révoqué » sur quelqu'un qui a un accès actif par ailleurs
    // ferait croire la porte fermée.
    const rang = ["Révoqué", "Expiré", "Invitation envoyée", "NDA en attente", "Accès actif"];
    const cle = inv.email.toLowerCase();
    const connu = acces.get(cle);
    if (!connu || rang.indexOf(etat) > rang.indexOf(connu)) acces.set(cle, etat);
  }

  return ((data ?? []) as Array<{
    id: string;
    nom: string;
    organisation: string | null;
    email: string | null;
    ticket: number | null;
    etape: string;
    engagement: string;
    categorie: string | null;
    fonction: string | null;
    pays: string | null;
    source: string | null;
    responsable: string | null;
    prochaine_action: string | null;
    date_relance: string | null;
    notes: string | null;
  }>).map((row) => ({
    id: row.id,
    nom: row.nom,
    organisation: row.organisation,
    email: row.email,
    ticket: row.ticket,
    etape: row.etape,
    engagement: row.engagement,
    categorie: row.categorie,
    fonction: row.fonction,
    pays: row.pays,
    source: row.source,
    responsable: row.responsable,
    prochaineAction: row.prochaine_action,
    dateRelance: row.date_relance,
    notes: row.notes,
    acces: row.email ? (acces.get(row.email.toLowerCase()) ?? null) : null,
  }));
}

/**
 * Les interactions consignées sur une opération — écrans 41 et 42.
 *
 * Toutes en une lecture plutôt qu'une par investisseur : le panneau s'ouvre
 * sur une fiche déjà chargée, et une seconde requête au clic ferait attendre
 * là où il n'y a rien à attendre. Le volume le permet — un pipeline se compte
 * en dizaines de relations, pas en milliers.
 */
export async function pipelineInteractions(
  operationId: string,
): Promise<Interaction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("raise_interactions")
    .select(
      "id, investor_id, type, date_interaction, responsable, participants, resume, resultat, prochaine_action, date_relance",
    )
    .eq("deal_id", operationId)
    .order("date_interaction", { ascending: false });

  if (error) console.error("[v2 lever] interactions :", error);

  return ((data ?? []) as Array<{
    id: string;
    investor_id: string;
    type: TypeInteraction;
    date_interaction: string;
    responsable: string | null;
    participants: string | null;
    resume: string | null;
    resultat: string | null;
    prochaine_action: string | null;
    date_relance: string | null;
  }>).map((row) => ({
    id: row.id,
    investorId: row.investor_id,
    type: row.type,
    date: row.date_interaction,
    responsable: row.responsable,
    participants: row.participants,
    resume: row.resume,
    resultat: row.resultat,
    prochaineAction: row.prochaine_action,
    dateRelance: row.date_relance,
  }));
}

export interface ActionAVenir {
  investisseurId: string;
  organisation: string;
  action: string;
  responsable: string | null;
  echeance: string | null;
  /** L'échéance est-elle dépassée ? Calculé au serveur, pas à l'affichage. */
  enRetard: boolean;
}

/**
 * Ce qu'il reste à faire, dérivé du pipeline.
 *
 * PAS DE TABLE DE TÂCHES, et c'est délibéré : une prochaine action appartient à
 * une relation — « relancer Baobab » n'existe pas sans Baobab. La colonne vit
 * donc sur l'investisseur, et cet écran ne fait que rassembler celles qui sont
 * renseignées. Une table séparée aurait créé des tâches orphelines dès la
 * première suppression d'investisseur.
 *
 * Les échéances passées d'abord, puis les plus proches : on ouvre cet écran
 * pour savoir quoi faire aujourd'hui, pas pour lire un inventaire.
 */
export async function prochainesActions(
  operationId: string,
  limite = 6,
): Promise<ActionAVenir[]> {
  const supabase = await createClient();

  const { data: raise } = await supabase
    .from("raises")
    .select("id")
    .eq("deal_id", operationId)
    .eq("statut", "en_cours")
    .maybeSingle();

  const raiseId = (raise as { id: string } | null)?.id;
  if (!raiseId) return [];

  const { data, error } = await supabase
    .from("raise_investors")
    .select("id, nom, organisation, responsable, prochaine_action, date_relance")
    .eq("raise_id", raiseId)
    .not("prochaine_action", "is", null);

  if (error) {
    console.error("[v2 lever] prochaines actions :", error);
    return [];
  }

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  return ((data ?? []) as Array<{
    id: string;
    nom: string;
    organisation: string | null;
    responsable: string | null;
    prochaine_action: string | null;
    date_relance: string | null;
  }>)
    .filter((row) => row.prochaine_action?.trim())
    .map((row) => ({
      investisseurId: row.id,
      organisation: row.organisation?.trim() || row.nom,
      action: row.prochaine_action as string,
      responsable: row.responsable,
      echeance: row.date_relance,
      enRetard: Boolean(row.date_relance && new Date(row.date_relance) < aujourdhui),
    }))
    .sort((a, b) => {
      // Sans échéance, l'action passe en dernier : elle n'est due nulle part.
      if (!a.echeance) return 1;
      if (!b.echeance) return -1;
      return a.echeance.localeCompare(b.echeance);
    })
    .slice(0, limite);
}

export interface LigneActivite {
  id: string;
  action: string;
  cible: string | null;
  at: string;
  auteur: string | null;
}

/** Les actions du journal qui concernent la levée, les plus récentes d'abord. */
const ACTIONS_LEVEE = [
  "raise.opened",
  "raise.updated",
  "raise.closed",
  "raise_investor.saved",
  "commitment.recorded",
  "commitment.requalified",
  "interaction.logged",
  "update.published",
];

/**
 * L'activité récente de la levée.
 *
 * ELLE VIENT DU JOURNAL, pas d'une table dédiée : tout ce qui compte y est déjà
 * écrit, et une seconde source finirait par diverger de la première — celle qui
 * fait foi. On y lit donc, en filtrant sur les actions qui parlent de la levée.
 */
export async function activiteRecenteLevee(
  operationId: string,
  limite = 6,
): Promise<LigneActivite[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_log")
    .select("id, action, metadata, created_at, actor_email")
    .eq("deal_id", operationId)
    .in("action", ACTIONS_LEVEE)
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("[v2 lever] activité récente :", error);
    return [];
  }

  return ((data ?? []) as Array<{
    id: string;
    action: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
    actor_email: string | null;
  }>).map((row) => ({
    id: row.id,
    action: row.action,
    // Le journal porte ce qui a changé : on en tire de quoi nommer la ligne —
    // un investisseur, un montant — plutôt que de répéter le type d'action.
    cible:
      (row.metadata?.organisation as string) ??
      (row.metadata?.nom as string) ??
      (row.metadata?.titre as string) ??
      null,
    at: row.created_at,
    auteur: row.actor_email,
  }));
}
