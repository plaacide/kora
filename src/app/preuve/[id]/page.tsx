import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/nda/PrintButton";

/**
 * Preuve de signature d'un NDA — page imprimable (hors shell app pour un rendu
 * propre à l'impression / enregistrement PDF). Accès : équipe interne du deal
 * ou le signataire (contrôlé par le RPC `nda_proof`).
 */
const mono = { fontFamily: "var(--font-plex-mono), monospace" } as const;

interface Proof {
  signer_name: string;
  signer_email: string;
  signed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  signature_hash: string;
  deal_name: string;
  org_name: string;
  nda_template: string | null;
}

export default async function PreuvePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data, error } = await supabase.rpc("nda_proof", { p_id: id });
  const row = (error ? null : ((data ?? []) as Proof[])[0]) ?? null;

  if (!row) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F5F4F0] px-4 text-center">
        <div>
          <p className="text-[14px] font-[600] text-[#1A1B1F]">Preuve introuvable ou accès refusé.</p>
          <a href="/nda" className="inline-block mt-3 text-[13px] font-[600] text-[#C24619]">← Retour aux signatures</a>
        </div>
      </div>
    );
  }

  const date = new Date(row.signed_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });

  const lignes: { k: string; v: string; m?: boolean }[] = [
    { k: "Signataire", v: row.signer_name },
    { k: "E-mail", v: row.signer_email },
    { k: "Signé le", v: date },
    { k: "Adresse IP", v: row.ip_address || "—", m: true },
    { k: "Navigateur", v: row.user_agent || "—" },
    { k: "Empreinte (SHA-256)", v: row.signature_hash, m: true },
  ];

  return (
    <div className="min-h-screen bg-[#F5F4F0] py-10 px-4 text-[#1A1B1F] print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <a href="/nda" className="text-[13px] font-[600] text-[#C24619] hover:text-[#1A1B1F]">← Retour aux signatures</a>
          <PrintButton />
        </div>

        <div className="bg-white rounded-[8px] border border-[#ECEBE6] p-10 print:border-0 print:p-0">
          <div className="flex items-baseline justify-between border-b border-[#ECEBE6] pb-4 mb-6">
            <div>
              <div className="text-[18px] font-[700] tracking-[-0.01em]">Preuve de signature — NDA</div>
              <div className="text-[12.5px] text-[#6E727A] mt-0.5">{row.org_name} · Data room « {row.deal_name} »</div>
            </div>
            <div style={mono} className="text-[9px] font-[600] uppercase text-[#147A5C] bg-[#E4F3EC] rounded-[4px] px-2 py-[3px] print:border print:border-[#147A5C]">Signé</div>
          </div>

          <table className="w-full text-[12.5px]">
            <tbody>
              {lignes.map((l) => (
                <tr key={l.k} className="border-b border-[#F1F0EC]">
                  <td className="py-2.5 pr-4 text-[#6E727A] align-top w-[170px]">{l.k}</td>
                  <td className="py-2.5 text-[#1A1B1F] break-all" style={l.m ? mono : undefined}>{l.v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-7">
            <div style={mono} className="text-[9px] font-[600] uppercase tracking-[0.08em] text-[#8B8E96] mb-2">Accord signé</div>
            <div className="text-[12.5px] text-[#33353B] leading-relaxed whitespace-pre-wrap">
              {row.nda_template?.trim()
                ? row.nda_template
                : "En signant, le destinataire s'engage à garder strictement confidentielles toutes les informations contenues dans cette data room, à ne pas les divulguer à des tiers, et à ne les utiliser que dans le cadre de l'évaluation de l'opportunité présentée."}
            </div>
          </div>

          <p className="mt-8 pt-4 border-t border-[#ECEBE6] text-[11px] text-[#9DA0A8] leading-relaxed">
            Cette preuve est générée par Sanza. L&apos;empreinte SHA-256 lie le signataire, l&apos;horodatage et l&apos;origine de la signature — toute altération la casserait. Le journal d&apos;audit de la data room conserve l&apos;enregistrement correspondant.
          </p>
        </div>
      </div>
    </div>
  );
}
