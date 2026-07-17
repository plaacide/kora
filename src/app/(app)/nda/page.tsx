import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Mono } from "@/components/ui/Table";
import type { Locale } from "@/i18n/locales";

interface Nda {
  id: string;
  deal_name: string;
  org_name: string;
  signer_name: string;
  signer_email: string;
  signed_at: string;
  ip_address: string | null;
  signature_hash: string;
  is_mine: boolean;
}

/**
 * Accords signés — lisibles après coup.
 *
 * Un engagement qu'on ne peut pas relire n'en est pas vraiment un : le
 * signataire doit retrouver ce qu'il a signé, et l'équipe doit pouvoir
 * produire la preuve.
 */
export default async function NdaPage() {
  const t = await getTranslations("nda");
  const ti = await getTranslations("invitations");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const { data } = await supabase.rpc("my_ndas");
  const ndas = (data ?? []) as unknown as Nda[];

  const fmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-[22px] font-[650] tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="text-[12.5px] text-ink-secondary mt-0.5">
          {t("subtitle")}
        </p>
      </div>

      {ndas.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-[12.5px] text-ink-secondary py-3">
              {t("empty")}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {ndas.map((n) => (
            <Card key={n.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-[650]">
                        {n.deal_name}
                      </span>
                      {n.is_mine && <Chip tone="indigo">{t("mine")}</Chip>}
                    </div>
                    <p className="text-[12px] text-ink-secondary mt-0.5">
                      {t("signedBy", { name: n.signer_name })} ·{" "}
                      {n.signer_email}
                    </p>
                  </div>
                  <Chip tone="success">{t("signed")}</Chip>
                </div>

                {/* Le texte exact auquel le signataire s'est engagé. */}
                <div className="bg-bg border border-separator-soft rounded-card p-3.5 my-3.5">
                  <p className="text-[11px] font-[650] text-ink mb-1.5">
                    {ti("ndaHeading")}
                  </p>
                  <p className="text-[12px] text-ink-secondary leading-relaxed">
                    {ti("ndaBody", { org: n.org_name, deal: n.deal_name })}
                  </p>
                </div>

                {/* La preuve : elle doit être lisible, pas cachée en base. */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] font-[650] uppercase tracking-[0.05em] text-ink-muted">
                      {t("signedAt")}
                    </div>
                    <Mono className="text-[11px] text-ink">
                      {fmt.format(new Date(n.signed_at))}
                    </Mono>
                  </div>
                  <div>
                    <div className="text-[10px] font-[650] uppercase tracking-[0.05em] text-ink-muted">
                      {t("ip")}
                    </div>
                    <Mono className="text-[11px] text-ink">
                      {n.ip_address ?? "—"}
                    </Mono>
                  </div>
                  <div>
                    <div className="text-[10px] font-[650] uppercase tracking-[0.05em] text-ink-muted">
                      {t("fingerprint")}
                    </div>
                    <Mono className="text-[11px] text-ink break-all">
                      {n.signature_hash.slice(0, 24)}…
                    </Mono>
                  </div>
                </div>

                <p className="text-[11px] text-ink-muted leading-relaxed mt-3">
                  {t("proofNote")}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
