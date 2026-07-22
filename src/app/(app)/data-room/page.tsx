import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { getCurrentDeal, getDealRole, getAnyRole } from "@/lib/current-deal";
import { Card, CardBody } from "@/components/ui/Card";
import { RoomContenu } from "@/components/dataroom/RoomContenu";
import {
  type DocRow,
  type AccessRow,
  type ViewRow,
} from "@/components/dataroom/DataRoom";
import { NewDealButton } from "@/components/dataroom/NewDealButton";
import { personaFor } from "@/lib/persona";
import { personaLabel } from "@/components/shell/persona-label";
import type { FolderTemplate } from "@/components/dataroom/FolderTemplates";
import type { Level } from "@/lib/permissions";
import type { Locale } from "@/i18n/locales";

export default async function DataRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ dossier?: string }>;
}) {
  // `?dossier=<id>` : la checklist renvoie ici sur le dossier attendu d'une
  // pièce. Sans ce paramètre, on retombe sur le premier dossier racine.
  const { dossier } = await searchParams;
  const t = await getTranslations("dataroom");
  const tt = await getTranslations("tips");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const { deal } = await getCurrentDeal(supabase);

  // L'organisation vient du deal, pas d'une adhésion arbitraire : sinon un
  // upload pouvait être classé sous une autre organisation que le deal.
  const orgId = deal?.org_id;
  const role = deal
    ? await getDealRole(supabase, deal.org_id)
    : await getAnyRole(supabase);
  // Les invités consultent, ils ne restructurent pas la room.
  const canEdit = ["owner", "admin", "member"].includes(role ?? "");

  // Le titre doit dire la même chose que le menu. « Data room » sous une
  // entrée « Mes documents », c'est déjà une hésitation de trop.
  const {
    data: { user: utilisateur },
  } = await supabase.auth.getUser();
  const { data: profilPersona } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", utilisateur?.id ?? "")
    .maybeSingle();
  const persona = personaFor(
    (profilPersona as { account_type?: string } | null)?.account_type,
    role,
  );
  const mot = personaLabel(t, persona);
  // Un fondateur n'ouvre pas une deuxième levée : le bouton ne lui parle pas.
  const peutCreerUnDeal = canEdit && persona === "fund";

  if (!deal || !orgId) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="font-display text-[22px] font-[650] tracking-[-0.02em]">
            {mot("title")}{" "}<InfoTooltip text={tt("dataRoom")} />
          </h1>
          <p className="text-[12.5px] text-ink-secondary mt-0.5">
            {mot("subtitle")}
          </p>
        </div>
        <Card>
          <CardBody>
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-[12.5px] text-ink-secondary max-w-md leading-relaxed">
                {t("emptyState")}
              </p>
              {peutCreerUnDeal && <NewDealButton />}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const [
    { data: folders },
    { data: documents },
    { data: levels },
    { data: accessRows },
    { data: viewEvents },
    { data: templates },
  ] = await Promise.all([
    supabase
      .from("folders")
      .select("id, parent_id, name, index_path, description")
      .eq("deal_id", deal.id)
      .order("index_path"),
    supabase
      .from("documents")
      .select(
        "id, folder_id, name, index_path, status, is_key, document_versions!documents_current_version_fk(id, version_no, size_bytes, created_at)",
      )
      .eq("deal_id", deal.id)
      .order("index_path"),
    supabase.rpc("my_folder_levels", { p_deal: deal.id }),
    supabase.rpc("deal_folder_access", { p_deal: deal.id }),
    // Les "vues" ne sont pas un compteur maison : elles sont lues dans le
    // journal d'audit, donc impossibles à gonfler discrètement.
    supabase
      .from("audit_log")
      .select("target_id, actor_email, created_at")
      .eq("action", "document.page_viewed")
      .eq("deal_id", deal.id)
      .order("id", { ascending: false })
      .limit(400),
    supabase
      .from("folder_templates")
      .select("id, folder_name, title, description, body")
      .order("position"),
  ]);

  // Rattachés par nom de dossier : les modèles sont globaux, jamais copiés
  // dans un deal (un modèle vierge n'est pas une pièce fournie).
  const templatesByFolder: Record<string, FolderTemplate[]> = {};
  for (const tpl of (templates ?? []) as Array<
    FolderTemplate & { folder_name: string }
  >) {
    (templatesByFolder[tpl.folder_name] ??= []).push({
      id: tpl.id,
      title: tpl.title,
      description: tpl.description,
      body: tpl.body,
    });
  }

  const levelByFolder = new Map<string, Level>(
    (levels ?? []).map((l: { folder_id: string; level: Level }) => [
      l.folder_id,
      l.level,
    ]),
  );

  const accessByFolder: Record<string, AccessRow[]> = {};
  for (const a of (accessRows ?? []) as Array<{
    folder_id: string;
    full_name: string;
    role: string;
    level: Level;
    expires_at: string | null;
  }>) {
    (accessByFolder[a.folder_id] ??= []).push({
      name: a.full_name,
      role: a.role,
      level: a.level,
      expires: a.expires_at
        ? new Date(a.expires_at).toLocaleDateString(
            locale === "fr" ? "fr-FR" : "en-US",
            { day: "numeric", month: "short" },
          )
        : null,
    });
  }

  const timeFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
  });

  const viewsByDoc: Record<string, ViewRow[]> = {};
  const viewCount: Record<string, number> = {};
  for (const v of viewEvents ?? []) {
    const id = v.target_id as string;
    viewCount[id] = (viewCount[id] ?? 0) + 1;
    const list = (viewsByDoc[id] ??= []);
    if (list.length < 4) {
      list.push({
        who: (v.actor_email ?? "—").split("@")[0],
        when: timeFmt.format(new Date(v.created_at)),
      });
    }
  }

  const docs: DocRow[] = (documents ?? []).map((d) => {
    const v = d.document_versions as unknown as {
      id: string;
      version_no: number;
      size_bytes: number | null;
      created_at: string;
    } | null;
    return {
      id: d.id,
      folder_id: d.folder_id,
      name: d.name,
      index_path: d.index_path,
      status: d.status,
      version_id: v?.id ?? null,
      version_no: v?.version_no ?? 1,
      size_bytes: v?.size_bytes ?? null,
      modified: v?.created_at ? dateFmt.format(new Date(v.created_at)) : null,
      views: viewCount[d.id] ?? 0,
      permission: levelByFolder.get(d.folder_id) ?? "none",
      is_key: (d as { is_key?: boolean }).is_key ?? false,
    };
  });

  // Onglet « Contenu » de la data room (handoff §3b) : l'en-tête et les onglets
  // sont fournis par RoomTabs (shell), la page ne rend que la table du contenu.
  return (
    <RoomContenu
      key={deal.id}
      orgId={orgId}
      dealId={deal.id}
      folders={folders ?? []}
      documents={docs}
      initialFolderId={dossier ?? null}
      canEdit={canEdit}
    />
  );
}
