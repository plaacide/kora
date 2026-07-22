import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/site/Reveal";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Rings } from "@/components/marketing/Rings";
import { Chrome } from "@/components/marketing/Chrome";
import { GRILLE } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Sanza — Banques & DFI",
  description:
    "Sourcez, analysez et suivez vos financements sur des dossiers déjà conformes OHADA-SYSCOHADA. Instruction à votre grille, suivi post-financement, traçabilité complète.",
};

const APPORTS = [
  {
    titre: "Dealflow qualifié",
    texte:
      "Des dossiers dont les pièces OHADA / SYSCOHADA sont déjà en règle et la data room prête. Vous instruisez, vous ne reconstituez pas.",
  },
  {
    titre: "Instruction accélérée",
    texte:
      "La diligence se présente à votre grille de lecture — DSCR et garanties côté banque, impact et E&S côté DFI. Chaque dossier arrive lisible pour vous.",
  },
  {
    titre: "Suivi post-financement",
    texte:
      "Reporting SYSCOHADA et covenants côté banque, indicateurs d'impact côté DFI. Le suivi ne s'arrête pas au décaissement.",
  },
];

const CONFORMITE = [
  "Screening OFAC / UE / ONU / UEMOA + KYC-AML avant tout accès",
  "Journal d'audit chaîné par empreinte — infalsifiable et opposable",
  "NDA e-signé exigé avant l'ouverture des documents",
  "États financiers au format SYSCOHADA, arborescence OHADA",
];

const JOURNAL = [
  { tag: "PAGE CONSULTÉE", qui: "Proparco", quand: "14/07 · 09:22", tone: "neutre" },
  { tag: "NDA SIGNÉ", qui: "Amani Capital", quand: "12/07 · 16:04", tone: "ok" },
  { tag: "EXPORT REFUSÉ", qui: "Invité externe", quand: "13/07 · 11:38", tone: "stop" },
];

function Eyebrow({ children, soft = false }: { children: React.ReactNode; soft?: boolean }) {
  return (
    <div
      className="font-mono text-[11px] tracking-[0.14em] uppercase mb-3"
      style={{ color: soft ? "#F08A5E" : "#9DA0A8" }}
    >
      {children}
    </div>
  );
}

export default function InstitutionsPage() {
  return (
    <div className="bg-white">
      <MarketingNav active="institutions" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#14161F]">
        <Rings size={600} style={{ right: -240, top: -260 }} />
        <div className="relative mx-auto max-w-[1240px] px-6 md:px-10 pt-16 md:pt-20 pb-16 md:pb-20">
          <div className="max-w-[720px]">
            <Eyebrow soft>BANQUES · DFI · PRÊTEURS</Eyebrow>
            <h1 className="font-display text-[clamp(32px,4.6vw,52px)] font-bold tracking-[-0.03em] leading-[1.1] text-white m-0 mb-5 text-balance">
              Sourcez, analysez et suivez vos financements — sur des dossiers
              déjà conformes.
            </h1>
            <p className="text-[clamp(15px,2vw,18px)] text-[#B9BCC9] leading-[1.6] max-w-[600px] mb-8">
              Sanza vous apporte un dealflow instruit à votre grille de lecture,
              avec la traçabilité et la conformité qu&apos;exige un financeur
              institutionnel en zone OHADA.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:institutions@sanza.africa?subject=Demande%20d%27acc%C3%A8s%20Sanza%20Institutions"
                className="inline-flex items-center justify-center rounded-[7px] bg-[#E85C2B] text-white px-7 py-[14px] text-[15px] font-[650] hover:bg-[#D24E1F] transition-colors"
              >
                Demander un accès
              </a>
              <Link
                href="/accelerateurs"
                className="inline-flex items-center justify-center rounded-[7px] bg-white/8 border border-white/16 text-white px-7 py-[14px] text-[15px] font-[650] hover:bg-white/14 transition-colors"
              >
                Vous accompagnez des startups ?
              </Link>
            </div>
            <p className="font-mono text-[11.5px] text-white/40 mt-5">
              Accès sur invitation — réservé aux institutions financières.
            </p>
          </div>
        </div>
      </section>

      {/* Ce que Sanza apporte */}
      <section className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20">
        <Reveal>
          <Eyebrow>Ce que Sanza apporte</Eyebrow>
          <h2 className="font-display text-[clamp(26px,3.4vw,34px)] font-bold tracking-[-0.02em] m-0 mb-11 max-w-[620px] text-balance">
            De l&apos;origination au suivi, sur un dossier qui parle votre
            langue.
          </h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {APPORTS.map((a, i) => (
            <Reveal key={a.titre} delay={i * 70}>
              <div className="h-full border border-[#ECEBE6] rounded-[8px] p-6">
                <h3 className="text-[16px] font-[650] mb-2.5 text-[#1A1B1F]">
                  {a.titre}
                </h3>
                <p className="text-[13.5px] text-[#6E727A] leading-[1.6]">
                  {a.texte}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* À votre grille de lecture */}
      <section className="bg-[#FAFAF8] border-y border-[#ECEBE6]">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20">
          <Reveal>
            <Eyebrow>À votre grille de lecture</Eyebrow>
            <h2 className="font-display text-[clamp(26px,3.4vw,34px)] font-bold tracking-[-0.02em] m-0 mb-3 max-w-[620px] text-balance">
              Le même dossier, lu comme vous le lisez.
            </h2>
            <p className="text-[15px] text-[#6E727A] leading-[1.6] max-w-[560px] mb-10">
              Une banque cherche la capacité de remboursement, un DFI l&apos;impact.
              Sanza présente les mêmes données selon l&apos;angle qui vous concerne.
            </p>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-2">
            {[GRILLE.banque, GRILLE.dfi].map((g, i) => (
              <Reveal key={g.title} delay={i * 80}>
                <div className="h-full bg-white border border-[#ECEBE6] rounded-[8px] overflow-hidden">
                  <div className="flex items-baseline gap-2 px-5 py-3.5 border-b border-[#F1F0EC]">
                    <span className="text-[16px] font-[700] text-[#1A1B1F]">
                      {g.title}
                    </span>
                    <span className="font-mono text-[11.5px] text-[#C24619]">
                      {g.kind}
                    </span>
                  </div>
                  <div>
                    {g.rows.map((r) => (
                      <div
                        key={r[0]}
                        className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-5 py-2.5 border-b border-[#F1F0EC] last:border-0"
                      >
                        <span className="text-[13px] text-[#4A4E63]">{r[0]}</span>
                        <span className="text-[11.5px] text-[#9DA0A8]">{r[1]}</span>
                        <span className="font-mono text-[12.5px] font-[600] text-[#1A1B1F] text-right min-w-[92px]">
                          {r[2]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Conformité & traçabilité */}
      <section className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-14 items-center">
          <Reveal>
            <Eyebrow>Conformité & traçabilité</Eyebrow>
            <h2 className="font-display text-[clamp(26px,3.4vw,34px)] font-bold tracking-[-0.02em] m-0 mb-6 text-balance">
              Chaque geste laisse une trace opposable.
            </h2>
            <div className="flex flex-col gap-3">
              {CONFORMITE.map((c) => (
                <div key={c} className="flex gap-3 items-start">
                  <span className="text-[#E85C2B] text-[14px] font-bold leading-[1.5]">
                    ✓
                  </span>
                  <span className="text-[14px] text-[#4A4E63] leading-[1.55]">
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={90}>
            <Chrome url="sanza.africa/app/audit" dark>
              <div className="p-4 sm:p-5">
                <div className="text-[12.5px] font-[650] text-white mb-3.5">
                  Journal d&apos;audit
                </div>
                <div className="flex flex-col gap-2">
                  {JOURNAL.map((j) => {
                    const c =
                      j.tone === "ok"
                        ? { bg: "rgba(20,122,92,0.18)", fg: "#5FD3A8" }
                        : j.tone === "stop"
                          ? { bg: "rgba(194,70,25,0.20)", fg: "#F08A5E" }
                          : { bg: "rgba(255,255,255,0.08)", fg: "#B9BCC9" };
                    return (
                      <div
                        key={j.tag + j.quand}
                        className="flex items-center gap-3 rounded-[6px] border border-white/8 px-3.5 py-2.5"
                      >
                        <span
                          className="font-mono text-[10px] font-[600] tracking-[0.04em] rounded-[4px] px-2 py-1 whitespace-nowrap"
                          style={{ background: c.bg, color: c.fg }}
                        >
                          {j.tag}
                        </span>
                        <span className="flex-1 text-[12.5px] text-white/85">
                          {j.qui}
                        </span>
                        <span className="font-mono text-[11px] text-white/40">
                          {j.quand}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3.5 pt-3 border-t border-white/8 font-mono text-[10.5px] text-white/40">
                  chaîne vérifiée · 634 entrées · empreinte a3f1…9c2e
                </div>
              </div>
            </Chrome>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FAFAF8] border-t border-[#ECEBE6]">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 text-center">
          <Reveal>
            <h2 className="font-display text-[clamp(24px,3.4vw,34px)] font-bold tracking-[-0.02em] m-0 mb-3.5">
              Instruisez votre prochain dossier sur Sanza.
            </h2>
            <p className="text-[15px] text-[#6E727A] mb-8 max-w-[520px] mx-auto">
              L&apos;accès est sur invitation. Écrivez-nous : nous ouvrons les
              premiers accès institutionnels par cohortes.
            </p>
            <a
              href="mailto:institutions@sanza.africa?subject=Demande%20d%27acc%C3%A8s%20Sanza%20Institutions"
              className="inline-flex items-center justify-center rounded-[7px] bg-[#E85C2B] text-white px-8 py-[15px] text-[15.5px] font-[650] hover:bg-[#D24E1F] transition-colors"
            >
              Demander un accès
            </a>
          </Reveal>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
