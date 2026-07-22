import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentDeal, getDealRole } from "@/lib/current-deal";
import { NdaSettings } from "@/components/nda/NdaSettings";
import type { Locale } from "@/i18n/locales";

/**
 * Signatures — onglet de la data room (handoff §3b), style maquette.
 *
 * En-tête/onglets fournis par RoomTabs. Ici : NDA exigé (toggle) + modèle, la
 * phrase de preuve, puis la table Signataire · Signé le · Empreinte · Preuve.
 * Données réelles (`my_ndas`) : chaque signature porte son horodatage et son
 * empreinte, non modifiables.
 */

interface Nda {
  id: string;
  signer_name: string;
  signer_email: string;
  signed_at: string;
  signature_hash: string;
}

const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase() || "?";
}

export default async function NdaPage() {
  const t = await getTranslations("nda");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("my_ndas");
  const ndas = (error ? [] : (data ?? [])) as unknown as Nda[];

  // Réglages NDA de la data room courante (équipe interne seulement). Tolérant
  // si les colonnes nda_* n'existent pas encore.
  const { deal } = await getCurrentDeal(supabase);
  const role = deal ? await getDealRole(supabase, deal.org_id) : null;
  const isInternal = ["owner", "admin", "member"].includes(role ?? "");
  let ndaRequired = false;
  let ndaTemplate = "";
  if (deal && isInternal) {
    const { data: reglages } = await supabase
      .from("deals")
      .select("nda_required, nda_template")
      .eq("id", deal.id)
      .maybeSingle();
    ndaRequired = !!(reglages as { nda_required?: boolean } | null)?.nda_required;
    ndaTemplate = ((reglages as { nda_template?: string | null } | null)?.nda_template) ?? "";
  }

  const fmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="text-[#1A1B1F]">
      {deal && isInternal && (
        <NdaSettings
          dealId={deal.id}
          required={ndaRequired}
          template={ndaTemplate}
          label={t("requiredBefore")}
          editLabel={t("editTemplate")}
        />
      )}
      <p className="text-[12.5px] text-[#6E727A] mb-4">{t("proofLine")}</p>

      <div style={mono} className="grid grid-cols-[2fr_1.3fr_1.1fr_90px] gap-3 px-2 pb-2 border-b border-[#ECEBE6] text-[9px] tracking-[0.08em] text-[#A0A3AB]">
        <span>{t("colSigner")}</span><span>{t("colSignedAt")}</span><span>{t("colFingerprint")}</span><span className="text-right">{t("colProof")}</span>
      </div>

      {ndas.length === 0 ? (
        <p className="text-[12px] text-[#9DA0A8] text-center py-8">{t("empty")}</p>
      ) : (
        ndas.map((n) => (
          <div key={n.id} className="grid grid-cols-[2fr_1.3fr_1.1fr_90px] gap-3 items-center px-2 py-3.5 border-b border-[#F1F0EC] hover:bg-[#FAFAF8]">
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="grid place-items-center w-8 h-8 rounded-[6px] bg-[#1A1B1F] text-white text-[11px] font-[700] shrink-0">{initials(n.signer_name)}</span>
              <span className="min-w-0">
                <span className="block text-[13px] font-[600] truncate">{n.signer_name}</span>
                <span className="block text-[11px] text-[#9DA0A8] truncate">{n.signer_email}</span>
              </span>
            </span>
            <span style={mono} className="text-[11.5px] text-[#55585F]">{fmt.format(new Date(n.signed_at))}</span>
            <span style={mono} className="text-[10.5px] text-[#9DA0A8] truncate">{n.signature_hash.slice(0, 10)}…</span>
            <span className="text-right"><Link href={`/preuve/${n.id}`} className="text-[12px] font-[600] text-[#C24619] hover:text-[#1A1B1F]">Preuve ↓</Link></span>
          </div>
        ))
      )}
    </div>
  );
}
