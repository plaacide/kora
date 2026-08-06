import { getTranslations } from "next-intl/server";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { LoginForm } from "@/components/auth/LoginForm";

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] border border-white/10 px-3 py-1.5 text-[12px] text-white/85">
      <span className="text-[#f08a5e]">{icon}</span>
      {label}
    </span>
  );
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; suivant?: string; email?: string }>;
}) {
  const { erreur, suivant, email } = await searchParams;
  const t = await getTranslations("auth.panel");

  return (
    <AuthSplit
      arcsCorner="top-left"
      panel={
        <div>
          {/* Badge pill, titre 36px, puis carte produit en verre (handoff §3). */}
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] border border-white/10 px-3 py-1.5 text-[11.5px] text-white/80">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a1f]" />
            {t("badge")}
          </span>

          <h2 className="mt-5 text-[36px] font-[700] leading-[1.1] tracking-[-0.025em]">
            {t("headline")}{" "}
            <span className="text-[#ff5a1f]">{t("headlineAccent")}</span>
          </h2>
          <p className="mt-3 text-[13.5px] text-white/70 leading-relaxed">
            {t("sub")}
          </p>

          {/* Carte produit — exemple illustratif, pas des données réelles. */}
          <div className="mt-6 rounded-[16px] border border-white/10 bg-white/[0.055] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[14.5px] font-[650] truncate">Kalyx Foods</div>
                <div style={{ fontFamily: "var(--font-plex-mono), monospace" }} className="text-[10.5px] text-white/45 mt-0.5">
                  {t("exampleRef")}
                </div>
              </div>
              <span style={{ fontFamily: "var(--font-plex-mono), monospace" }} className="shrink-0 text-[9px] font-[600] uppercase tracking-[0.06em] text-[#f08a5e] bg-[#ff5a1f]/15 rounded-[4px] px-2 py-[3px]">
                {t("exampleStage")}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[11.5px] text-white/60">
                <span>{t("fileDone")}</span>
                <span style={{ fontFamily: "var(--font-plex-mono), monospace" }} className="text-white/85">82 %</span>
              </div>
              <span className="block h-1.5 rounded-[3px] bg-white/10 overflow-hidden mt-2">
                <span className="block h-full bg-[#ff5a1f]" style={{ width: "82%" }} />
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
              {[
                { v: "2,4 M$", l: t("mSought") },
                { v: "14", l: t("mAccess") },
                { v: "6 j", l: t("mActivity") },
              ].map((m) => (
                <div key={m.l}>
                  <div style={{ fontFamily: "var(--font-plex-mono), monospace" }} className="text-[15px] font-[600]">{m.v}</div>
                  <div className="text-[10.5px] text-white/50 mt-0.5">{m.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
              }
              label={t("badgeKyc")}
            />
            <Badge
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20h-20" /></svg>
              }
              label={t("badgeDeals")}
            />
          </div>
        </div>
      }
    >
      <LoginForm notice={erreur} suivant={suivant} email={email} />
    </AuthSplit>
  );
}
