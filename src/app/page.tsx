import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/site/Reveal";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Rings } from "@/components/marketing/Rings";
import { HeroPreview } from "@/components/marketing/HeroPreview";
import { ProductTabs } from "@/components/marketing/ProductTabs";
import { MarketingWaitlist } from "@/components/marketing/MarketingWaitlist";
import { TRUST, FINANCEURS } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Sanza — Le dealflow africain, enfin structuré",
  description:
    "La dealroom pour lever des fonds en Afrique : data room sécurisée, suivi de due diligence et investisseurs dans un seul espace — adapté à qui vous finance (VC, DFI, banque).",
  openGraph: {
    title: "Sanza — La dealroom pour lever des fonds en Afrique",
    description:
      "Data room sécurisée, diligence adaptée au financeur, journal infalsifiable. Angle OHADA / SYSCOHADA.",
    type: "website",
    locale: "fr_FR",
    siteName: "Sanza",
  },
};

const CONSTAT = [
  {
    titre: "Vos pièces sont éparpillées",
    texte:
      "Statuts dans un mail, prévisionnels dans un tableur, pacte sur une clé USB. Le jour où un investisseur demande, vous cherchez au lieu de répondre.",
  },
  {
    titre: "Chaque financeur veut autre chose",
    texte:
      "Un VC regarde la croissance, un DFI l'impact, une banque le remboursement. Vous refaites le dossier à chaque interlocuteur.",
  },
  {
    titre: "Vous n'avez aucune visibilité",
    texte:
      "Qui a ouvert quoi ? Qui a signé le NDA ? Sans traçabilité, vous relancez à l'aveugle et vous ne savez jamais où en est vraiment votre tour.",
  },
];

const SECURITE = [
  {
    titre: "Servi page par page",
    texte:
      "Les documents sont rendus en images filigranées au nom du lecteur — jamais le fichier source. Le téléchargement se contrôle, et se refuse.",
  },
  {
    titre: "Journal chaîné",
    texte:
      "Chaque consultation s'inscrit dans un journal d'audit chaîné par empreinte : infalsifiable, vérifiable, opposable.",
  },
  {
    titre: "Accès révocables",
    texte:
      "Droits par dossier, expiration programmée, révocation immédiate. L'accès d'hier ne vaut plus demain si vous le décidez.",
  },
  {
    titre: "Chiffré · SOC 2 en préparation",
    texte:
      "Chiffrement en transit et au repos, hébergement en Union européenne. La démarche SOC 2 est engagée — nous n'annonçons pas de label que nous n'avons pas encore.",
  },
];

function Eyebrow({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "soft";
}) {
  return (
    <div
      className="font-mono text-[11px] tracking-[0.14em] uppercase mb-3"
      style={{ color: tone === "soft" ? "#F08A5E" : "#9DA0A8" }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-white">
      <MarketingNav />

      {/* ---------- Hero sombre ---------- */}
      <section className="relative overflow-hidden bg-[#14161F]">
        <Rings size={620} style={{ right: -240, top: -260 }} />
        <div className="relative mx-auto max-w-[1240px] px-6 md:px-10 pt-16 md:pt-20 pb-16 md:pb-20">
          <div className="grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-14 items-center">
            <div>
              <Eyebrow tone="soft">DEALROOM · AFRIQUE · OHADA</Eyebrow>
              <h1 className="font-display text-[clamp(34px,5vw,56px)] font-bold tracking-[-0.03em] leading-[1.08] text-white m-0 mb-5 text-balance">
                Levez des fonds sans jamais perdre le fil de votre dossier.
              </h1>
              <p className="text-[clamp(15px,2vw,18px)] text-[#B9BCC9] leading-[1.6] max-w-[560px] mb-8">
                Data room sécurisée, suivi de due diligence et investisseurs dans
                un seul espace —{" "}
                <strong className="text-white font-[650]">
                  adapté à qui vous finance
                </strong>{" "}
                : VC, DFI ou banque.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/inscription"
                  data-analytics="signup_founder_click"
                  className="inline-flex items-center justify-center rounded-[7px] bg-[#E85C2B] text-white px-7 py-[14px] text-[15px] font-[650] hover:bg-[#D24E1F] transition-colors"
                >
                  Créer ma dealroom
                </Link>
                <a
                  href="#produit"
                  className="inline-flex items-center justify-center rounded-[7px] bg-white/8 border border-white/16 text-white px-7 py-[14px] text-[15px] font-[650] hover:bg-white/14 transition-colors"
                >
                  Voir le produit
                </a>
              </div>
            </div>

            <Reveal>
              <HeroPreview />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Bande de confiance ---------- */}
      <section className="border-b border-[#ECEBE6] bg-[#FAFAF8]">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10 py-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
          {TRUST.map((t) => (
            <span
              key={t}
              className="font-mono text-[11.5px] text-[#6E727A] flex items-center gap-2"
            >
              <span className="text-[#E85C2B]">◈</span>
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- Le constat ---------- */}
      <section className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20">
        <Reveal>
          <Eyebrow>Le constat</Eyebrow>
          <h2 className="font-display text-[clamp(26px,3.4vw,34px)] font-bold tracking-[-0.02em] m-0 mb-11 max-w-[620px] text-balance">
            Lever des fonds en Afrique, aujourd&apos;hui, c&apos;est trois
            frictions de trop.
          </h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {CONSTAT.map((c, i) => (
            <Reveal key={c.titre} delay={i * 70}>
              <div className="h-full border border-[#ECEBE6] rounded-[8px] p-6 border-t-2 border-t-[#E85C2B]">
                <h3 className="text-[16px] font-[650] mb-2.5 text-[#1A1B1F]">
                  {c.titre}
                </h3>
                <p className="text-[13.5px] text-[#6E727A] leading-[1.6]">
                  {c.texte}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Le produit en action ---------- */}
      <section id="produit" className="bg-[#FAFAF8] border-y border-[#ECEBE6] scroll-mt-16">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20">
          <Reveal>
            <Eyebrow>Le produit en action</Eyebrow>
            <h2 className="font-display text-[clamp(26px,3.4vw,34px)] font-bold tracking-[-0.02em] m-0 mb-3 max-w-[620px] text-balance">
              Un espace, quatre choses que vous ne perdez plus de vue.
            </h2>
            <p className="text-[15px] text-[#6E727A] leading-[1.6] max-w-[560px] mb-10">
              La diligence s&apos;adapte au financeur — c&apos;est le cœur de
              Sanza. Changez de financeur, la checklist change.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <ProductTabs />
          </Reveal>
        </div>
      </section>

      {/* ---------- Financeurs ---------- */}
      <section id="financeurs" className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20 scroll-mt-16">
        <Reveal>
          <Eyebrow>Un dossier, trois lectures</Eyebrow>
          <h2 className="font-display text-[clamp(26px,3.4vw,34px)] font-bold tracking-[-0.02em] m-0 mb-11 max-w-[620px] text-balance">
            Le même dossier, présenté comme chaque financeur l&apos;attend.
          </h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {FINANCEURS.map((f, i) => (
            <Reveal key={f.id} delay={i * 70}>
              <div className="h-full border border-[#ECEBE6] rounded-[8px] p-6">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[19px] font-[700] text-[#1A1B1F]">
                    {f.title}
                  </span>
                  <span className="font-mono text-[11.5px] text-[#C24619]">
                    {f.kind}
                  </span>
                </div>
                <p className="text-[13px] text-[#6E727A] mb-4">{f.regarde}</p>
                <div className="flex flex-col gap-2 pt-4 border-t border-[#F1F0EC]">
                  {f.points.map((p) => (
                    <div key={p} className="flex gap-2.5 items-start">
                      <span className="text-[#E85C2B] text-[13px] font-bold leading-[1.5]">
                        ✓
                      </span>
                      <span className="text-[13px] text-[#4A4E63] leading-[1.5]">
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Investisseurs — liste d'attente ---------- */}
      <section id="investisseurs" className="bg-[#14161F] scroll-mt-16">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-14 items-center">
            <Reveal>
              <Eyebrow tone="soft">Investisseurs</Eyebrow>
              <h2 className="font-display text-[clamp(26px,3.4vw,34px)] font-bold tracking-[-0.02em] text-white m-0 mb-4 text-balance">
                L&apos;accès investisseurs ouvre bientôt — prenez votre place.
              </h2>
              <p className="text-[15px] text-[#B9BCC9] leading-[1.6] max-w-[520px]">
                Nous constituons d&apos;abord une base de dossiers prêts, instruits
                à votre grille de lecture. Inscrivez-vous : vous serez parmi les
                premiers à voir passer le dealflow, sans engagement.
              </p>
            </Reveal>
            <Reveal delay={90}>
              <MarketingWaitlist />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Sécurité ---------- */}
      <section id="securite" className="relative overflow-hidden bg-[#14161F] border-t border-white/8 scroll-mt-16">
        <Rings size={560} style={{ left: -220, bottom: -240 }} />
        <div className="relative mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20">
          <Reveal>
            <Eyebrow tone="soft">Sécurité</Eyebrow>
            <h2 className="font-display text-[clamp(26px,3.4vw,34px)] font-bold tracking-[-0.02em] text-white m-0 mb-11 max-w-[620px] text-balance">
              Vos documents sont servis, jamais livrés.
            </h2>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SECURITE.map((s, i) => (
              <Reveal key={s.titre} delay={i * 60}>
                <div className="h-full rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-[14.5px] font-[650] text-white mb-2">
                    {s.titre}
                  </div>
                  <p className="text-[12.5px] text-white/70 leading-[1.6]">
                    {s.texte}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA final ---------- */}
      <section className="mx-auto max-w-[1240px] px-6 md:px-10 py-16 md:py-20 text-center">
        <Reveal>
          <div className="inline-flex gap-[5px] items-end mb-6">
            <span className="w-[7px] h-[20px] rounded-[3px] bg-[#E85C2B] opacity-30 inline-block" />
            <span className="w-[7px] h-[32px] rounded-[3px] bg-[#E85C2B] opacity-55 inline-block" />
            <span className="w-[7px] h-[48px] rounded-[3px] bg-[#E85C2B] inline-block" />
          </div>
          <h2 className="font-display text-[clamp(26px,3.8vw,38px)] font-bold tracking-[-0.02em] m-0 mb-3.5">
            Faites résonner vos deals.
          </h2>
          <p className="text-[16px] text-[#6E727A] mb-8 max-w-[520px] mx-auto">
            Créez votre dealroom, structurez votre levée, et présentez à chaque
            financeur exactement ce qu&apos;il attend.
          </p>
          <Link
            href="/inscription"
            data-analytics="signup_founder_click"
            className="inline-flex items-center justify-center rounded-[7px] bg-[#E85C2B] text-white px-8 py-[15px] text-[15.5px] font-[650] hover:bg-[#D24E1F] transition-colors"
          >
            Créer ma dealroom
          </Link>
        </Reveal>
      </section>

      <MarketingFooter />
    </div>
  );
}
