import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/site/Reveal";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Rings } from "@/components/marketing/Rings";
import { Chrome } from "@/components/marketing/Chrome";

export const metadata: Metadata = {
  title: "Sanza — Accélérateurs & hubs",
  description:
    "Menez toute votre cohorte jusqu'à la levée : vue portefeuille de readiness, préparation à la levée par financeur, reporting bailleurs consolidé.",
};

const APPORTS = [
  {
    titre: "Vue portefeuille de cohorte",
    texte:
      "Le readiness de chaque startup et l'état de sa data room, sur un seul écran. Vous voyez qui avance et qui décroche, sans relancer par mail.",
  },
  {
    titre: "Préparation à la levée",
    texte:
      "Modèles de data room OHADA et checklist par financeur pour chaque startup. Vos entrepreneurs savent quoi préparer, dans quel ordre, pour quel type d'investisseur.",
  },
  {
    titre: "Demo day & mise en relation",
    texte:
      "Présentez les dossiers prêts aux investisseurs de la plateforme au bon moment — quand le readiness est là, pas avant.",
  },
];

const COHORTE = [
  { nom: "Kalyx Foods", readiness: 82 },
  { nom: "Baobab Health", readiness: 64 },
  { nom: "Sahel Logistics", readiness: 48 },
  { nom: "Nokwe Agritech", readiness: 91 },
  { nom: "Zangbeto Pay", readiness: 37 },
];

const BAILLEURS = [
  { label: "Capitaux levés", value: "4,8 M$", note: "sur 12 startups" },
  { label: "Emplois soutenus", value: "1 240", note: "+310 sur la cohorte" },
  { label: "Dossiers prêts", value: "7/12", note: "readiness ≥ 70 %" },
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

export default function AccelerateursPage() {
  const moyen = Math.round(
    COHORTE.reduce((s, c) => s + c.readiness, 0) / COHORTE.length,
  );
  const max = Math.max(...COHORTE.map((c) => c.readiness));

  return (
    <div className="bg-white">
      <MarketingNav active="accelerateurs" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#14161F]">
        <Rings size={600} style={{ right: -240, top: -260 }} />
        <div className="relative mx-auto max-w-[1240px] px-6 md:px-10 pt-16 md:pt-20 pb-16 md:pb-20">
          <div className="max-w-[720px]">
            <Eyebrow soft>ACCÉLÉRATEURS · INCUBATEURS · HUBS</Eyebrow>
            <h1 className="font-display text-[clamp(32px,4.6vw,52px)] font-bold tracking-[-0.03em] leading-[1.1] text-white m-0 mb-5 text-balance">
              Menez toute votre cohorte jusqu&apos;à la levée.
            </h1>
            <p className="text-[clamp(15px,2vw,18px)] text-[#B9BCC9] leading-[1.6] max-w-[600px] mb-8">
              Suivez le readiness de chaque startup, préparez des data rooms
              conformes par financeur, et consolidez le reporting que vos
              bailleurs attendent — sans tableur.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:equipe@sanza.africa?subject=Sanza%20pour%20notre%20programme"
                className="inline-flex items-center justify-center rounded-[7px] bg-[#E85C2B] text-white px-7 py-[14px] text-[15px] font-[650] hover:bg-[#D24E1F] transition-colors"
              >
                Parler à l&apos;équipe
              </a>
              <Link
                href="/institutions"
                className="inline-flex items-center justify-center rounded-[7px] bg-white/8 border border-white/16 text-white px-7 py-[14px] text-[15px] font-[650] hover:bg-white/14 transition-colors"
              >
                Vous financez des startups ?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ce que Sanza apporte */}
      <section className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20">
        <Reveal>
          <Eyebrow>Ce que Sanza apporte</Eyebrow>
          <h2 className="font-display text-[clamp(26px,3.4vw,34px)] font-bold tracking-[-0.02em] m-0 mb-11 max-w-[620px] text-balance">
            Un poste de pilotage pour toute la cohorte.
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

      {/* Tableau de bord cohorte */}
      <section className="bg-[#FAFAF8] border-y border-[#ECEBE6]">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-14 items-center">
            <Reveal>
              <Eyebrow>Tableau de bord cohorte</Eyebrow>
              <h2 className="font-display text-[clamp(26px,3.4vw,34px)] font-bold tracking-[-0.02em] m-0 mb-6 text-balance">
                Voyez d&apos;un coup d&apos;œil qui est prêt à lever.
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  "Onboarding groupé de toute la promotion",
                  "Rôle mentor / lecteur en lecture seule sur les data rooms",
                  "Alertes sur les dossiers en retard",
                ].map((p) => (
                  <div key={p} className="flex gap-3 items-start">
                    <span className="text-[#E85C2B] text-[14px] font-bold leading-[1.5]">
                      ✓
                    </span>
                    <span className="text-[14px] text-[#4A4E63] leading-[1.55]">
                      {p}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={90}>
              <Chrome url="sanza.africa/app/cohorte">
                <div className="bg-white p-4 sm:p-5">
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-[13px] font-[650] text-[#1A1B1F]">
                      Readiness de la cohorte
                    </span>
                    <span className="font-mono text-[12px] text-[#C24619]">
                      dossier prêt moyen · {moyen} %
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {COHORTE.map((c) => (
                      <div key={c.nom} className="flex items-center gap-3">
                        <span className="w-[112px] shrink-0 text-[12.5px] text-[#4A4E63] truncate">
                          {c.nom}
                        </span>
                        <span className="flex-1 h-[8px] rounded-full bg-[#F1F0EC] overflow-hidden">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${c.readiness}%`,
                              background:
                                c.readiness >= 70
                                  ? "#147A5C"
                                  : c.readiness >= 50
                                    ? "#E85C2B"
                                    : "#C24619",
                            }}
                          />
                        </span>
                        <span className="font-mono text-[11.5px] text-[#6E727A] w-9 text-right">
                          {c.readiness}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-end gap-1.5 h-[54px] pt-3 border-t border-[#F1F0EC]">
                    {COHORTE.map((c) => (
                      <span
                        key={c.nom}
                        className="flex-1 rounded-t-[2px] bg-[#E85C2B]"
                        style={{ height: `${(c.readiness / max) * 100}%`, opacity: 0.25 + (c.readiness / max) * 0.6 }}
                      />
                    ))}
                  </div>
                </div>
              </Chrome>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Reporting bailleurs */}
      <section className="relative overflow-hidden bg-[#14161F]">
        <Rings size={520} style={{ left: -200, bottom: -220 }} />
        <div className="relative mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20">
          <Reveal>
            <Eyebrow soft>Reporting bailleurs</Eyebrow>
            <h2 className="font-display text-[clamp(26px,3.4vw,34px)] font-bold tracking-[-0.02em] text-white m-0 mb-4 max-w-[620px] text-balance">
              Le rapport que vos bailleurs attendent, déjà consolidé.
            </h2>
            <p className="text-[15px] text-[#B9BCC9] leading-[1.6] max-w-[600px] mb-10">
              Sanza agrège capitaux levés, emplois soutenus et avancement de la
              cohorte en un rapport prêt pour vos partenaires publics et
              bailleurs.
            </p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-3">
            {BAILLEURS.map((b, i) => (
              <Reveal key={b.label} delay={i * 70}>
                <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-6">
                  <div className="text-[12px] font-[600] text-white/60 mb-2">
                    {b.label}
                  </div>
                  <div className="font-mono text-[30px] font-[600] tracking-[-0.02em] text-white leading-none mb-2">
                    {b.value}
                  </div>
                  <div className="text-[12px] text-[#F08A5E]">{b.note}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20 text-center">
        <Reveal>
          <h2 className="font-display text-[clamp(24px,3.4vw,34px)] font-bold tracking-[-0.02em] m-0 mb-3.5">
            Équipez votre prochaine promotion.
          </h2>
          <p className="text-[15px] text-[#6E727A] mb-8 max-w-[520px] mx-auto">
            Parlons de votre programme : nombre de startups, calendrier,
            attentes de vos bailleurs. Nous cadrons l&apos;offre avec vous.
          </p>
          <a
            href="mailto:equipe@sanza.africa?subject=Sanza%20pour%20notre%20programme"
            className="inline-flex items-center justify-center rounded-[7px] bg-[#E85C2B] text-white px-8 py-[15px] text-[15.5px] font-[650] hover:bg-[#D24E1F] transition-colors"
          >
            Parler à l&apos;équipe
          </a>
        </Reveal>
      </section>

      <MarketingFooter />
    </div>
  );
}
