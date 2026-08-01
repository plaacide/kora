import "server-only";

import { nomActeur, nomCourt } from "@/features/v2/domain/journal";
import {
  compter,
  estAActualiser,
  requises,
  prochaineAction,
  type Compte,
  type ExigenceBrute,
  type ProchaineAction,
} from "@/features/v2/domain/preparation";
import { createClient } from "@/lib/supabase/server";
import { countActiveAccesses } from "./access";
import { listRequirementsFull } from "./preparation";

/**
 * La vue d'ensemble d'une opération — écrans 08, 09 et 10.
 *
 * Ce ne sont pas trois écrans mais un seul, à trois moments de la vie d'un
 * dossier : rien n'est encore fait, la préparation avance, la data room est
 * partagée. Ce qui change n'est pas la mise en page mais ce qu'il y a à
 * montrer — un écran qui affiche « 0 consultation » quand personne n'a été
 * invité fait du bruit avec du vide.
 */

export interface OperationEnTete {
  name: string;
  /** « Levée en capital », « Dette », … tel que l'opération le porte. */
  objectif: string | null;
  amount: number | null;
  currency: string | null;
  /** Échéance de la levée, quand il y en a une. */
  deadline: string | null;
  /** Le menu « ⋯ » propose « Archiver » ou « Remettre en activité ». */
  archivee: boolean;
}

export interface PieceRecente {
  id: string;
  name: string;
  folderName: string | null;
  at: string;
}

export interface TraceRecente {
  id: number;
  actor: string;
  texte: string;
  at: string;
}

export interface VueDEnsemble {
  operation: OperationEnTete;
  requirements: ExigenceBrute[];
  compte: Compte;
  /** Recommandées prêtes sur recommandées dues — la maquette 09 les compte à part. */
  recommandees: { ready: number; due: number };
  action: ProchaineAction;
  /** Ce qui demande un geste, le plus urgent d'abord. Écran 09. */
  aTraiter: ExigenceBrute[];
  folderCount: number;
  documentCount: number;
  activeAccesses: number;
  recentDocuments: PieceRecente[];
  recentActivity: TraceRecente[];
}

/** Les actions du journal, dites en français. Mêmes mots que le reste. */
const ACTIONS: Record<string, string> = {
  "document.uploaded": "a déposé",
  "document.version_added": "a déposé une nouvelle version de",
  "document.restored": "a restauré",
  "document.hidden": "a masqué",
  "document.unhidden": "a rendu visible",
  "checklist.document_linked": "a rattaché",
  "checklist.document_unlinked": "a retiré",
  "checklist.suggestion_dismissed": "a écarté",
  "invitation.created": "a invité",
  "invitation.accepted": "a rejoint la data room —",
  "invitation.revoked": "a révoqué l'accès de",
  "nda.signed": "a signé l'accord de confidentialité —",
  "checklist.status_changed": "a changé le statut de",
  "checklist.document_suggested": "— Sanza a proposé",
  "checklist.item_added": "a ajouté l'exigence",
  "checklist.template_applied": "a posé le référentiel —",
};

export async function operationOverview(
  operationId: string,
): Promise<VueDEnsemble> {
  const supabase = await createClient();
  const maintenant = new Date();

  const [
    { data: deal },
    { data: raise },
    { data: folders },
    { data: documents },
    { data: journal },
    requirements,
    activeAccesses,
  ] = await Promise.all([
    supabase
      .from("deals")
      .select("name, objectif, amount, currency, archived_at")
      .eq("id", operationId)
      .maybeSingle(),
    // Les colonnes de `raises` sont en français, celles de `deals` en anglais :
    // héritage de deux moments du projet. On lit ce qui existe plutôt que ce
    // qu'on aurait nommé.
    supabase
      .from("raises")
      .select("montant_cible, devise, date_cloture")
      .eq("deal_id", operationId)
      .maybeSingle(),
    supabase.from("folders").select("id, name").eq("deal_id", operationId),
    supabase
      .from("documents")
      .select("id, name, folder_id, created_at")
      .eq("deal_id", operationId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("audit_log")
      .select("id, action, actor_email, created_at, metadata")
      .eq("deal_id", operationId)
      .order("created_at", { ascending: false })
      .limit(8),
    listRequirementsFull(operationId),
    countActiveAccesses(operationId),
  ]);

  const nomsDossiers = new Map(
    ((folders ?? []) as Array<{ id: string; name: string }>).map((f) => [
      f.id,
      f.name,
    ]),
  );

  const pieces = (documents ?? []) as Array<{
    id: string;
    name: string;
    folder_id: string | null;
    created_at: string;
  }>;

  // Les compteurs portent sur le REQUIS : c'est lui qui bloque un closing.
  // Les recommandées ont leur propre chiffre, comme dans la maquette 09.
  const compte = compter(requises(requirements), maintenant);

  const recommandeesDues = requirements.filter(
    (item) => item.level === "recommended" && item.status !== "not_applicable",
  );

  // L'ordre est celui de l'urgence, pas celui du plan : périmé d'abord, puis
  // requis manquant, puis le reste. C'est la même règle que « prochaine
  // action » — la liste n'est que sa suite.
  const poids = (item: ExigenceBrute) => {
    if (estAActualiser(item, maintenant)) return 0;
    if (item.pending > 0 && item.proofs === 0) return 2;
    if (item.level === "required") return 1;
    return 3;
  };

  const aTraiter = requirements
    .filter(
      (item) =>
        item.status !== "not_applicable" &&
        (item.status !== "done" || estAActualiser(item, maintenant)),
    )
    .sort((a, b) => poids(a) - poids(b))
    .slice(0, 4);

  // Le journal ne garde que l'adresse : « Amara Diallo a déposé » se lit,
  // « amara.diallo@nimba.sn a déposé » se déchiffre. Même règle que le
  // panneau d'une exigence.
  const adresses = [
    ...new Set(
      ((journal ?? []) as Array<{ actor_email: string | null }>)
        .map((row) => row.actor_email?.toLowerCase())
        .filter((email): email is string => Boolean(email)),
    ),
  ];

  const nomsPersonnes = new Map<string, string>();
  if (adresses.length > 0) {
    const { data: profils } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("email", adresses);

    for (const p of (profils ?? []) as Array<{
      email: string | null;
      full_name: string | null;
    }>) {
      if (p.email && p.full_name) nomsPersonnes.set(p.email.toLowerCase(), p.full_name);
    }
  }

  const dealRow = deal as {
    name: string;
    objectif: string | null;
    amount: number | null;
    currency: string | null;
    archived_at: string | null;
  } | null;

  const raiseRow = raise as {
    montant_cible: number | null;
    devise: string | null;
    date_cloture: string | null;
  } | null;

  return {
    operation: {
      name: dealRow?.name ?? "Opération",
      objectif: dealRow?.objectif ?? null,
      // La levée fait foi quand elle existe : c'est elle que le fondateur
      // tient à jour, `deals.amount` n'est renseigné qu'à la création.
      amount: raiseRow?.montant_cible ?? dealRow?.amount ?? null,
      currency: raiseRow?.devise ?? dealRow?.currency ?? null,
      deadline: raiseRow?.date_cloture ?? null,
      archivee: Boolean(dealRow?.archived_at),
    },
    requirements,
    compte,
    recommandees: {
      ready: recommandeesDues.filter((item) => item.status === "done").length,
      due: recommandeesDues.length,
    },
    action: prochaineAction(requirements, activeAccesses, maintenant),
    aTraiter,
    folderCount: nomsDossiers.size,
    documentCount: pieces.length,
    activeAccesses,
    recentDocuments: pieces.slice(0, 4).map((doc) => ({
      id: doc.id,
      name: doc.name,
      folderName: doc.folder_id ? (nomsDossiers.get(doc.folder_id) ?? null) : null,
      at: doc.created_at,
    })),
    recentActivity: ((journal ?? []) as Array<{
      id: number;
      action: string;
      actor_email: string | null;
      created_at: string;
      metadata: Record<string, unknown> | null;
    }>).map((row) => {
      // Pas de repli sur `label` pour les gestes documentaires : c'est
      // l'intitulé de l'EXIGENCE, et « a retiré Extrait RCCM de moins de
      // 3 mois » ferait croire qu'on a supprimé l'exigence, pas la pièce.
      const surUnDocument = row.action.includes("document");
      const cible =
        (row.metadata?.document_name as string) ??
        (row.metadata?.email as string) ??
        (surUnDocument ? "une pièce" : (row.metadata?.label as string)) ??
        "";

      return {
        id: row.id,
        actor: nomActeur(
          row.actor_email,
          nomsPersonnes.get(row.actor_email?.toLowerCase() ?? ""),
        ),
        texte: `${ACTIONS[row.action] ?? row.action}${
          cible ? ` ${nomCourt(cible)}` : ""
        }`,
        at: row.created_at,
      };
    }),
  };
}
