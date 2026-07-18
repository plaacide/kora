import Link from "next/link";
import type { Metadata } from "next";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { SiteNav } from "@/components/site/SiteNav";
import { Reveal } from "@/components/site/Reveal";
import { ResonanceRings } from "@/components/site/ResonanceRings";
import { InvestorWaitlistCTA } from "@/components/site/InvestorWaitlistCTA";
import { SaeDemoCTA } from "@/components/site/SaeDemoCTA";

export const metadata: Metadata = {
  title: "Sanza — Le dealflow africain, enfin structuré",
  description:
    "Sanza guide les fondateurs africains vers un dossier de levée que les investisseurs prennent au sérieux : data room OHADA, score de readiness, contrôle total du partage.",
  openGraph: {
    title: "Sanza — Le dealflow africain, enfin structuré",
    description:
      "Levez comme si ce n'était pas votre première fois. Data room OHADA, score de readiness, contrôle total du partage.",
    type: "website",
    locale: "fr_FR",
    siteName: "Sanza",
  },
};

/**
 * Site public — repositionnement acté : le héros parle au FONDATEUR (c'est
 * l'acheteur d'aujourd'hui), une section dédiée s'adresse aux structures
 * d'accompagnement (SAE, segment le plus rentable), et la marque « Le dealflow
 * africain, enfin structuré » devient la tagline au-dessus du titre.
 *
 * Règle inchangée : rien n'est annoncé sans réserve s'il n'est pas livré.
 * Les badges « Bientôt » marquent ce qui n'existe pas encore.
 */

const FONCTIONS = [
  {
    titre: "Levée guidée",
    bientot: false,
    texte:
      "Sachez exactement quoi préparer : checklist OHADA par stade, score de readiness, et la liste précise de ce qui manque avant de montrer votre dossier.",
    icone: (
      <>
        <path d="M4 6.5l1.6 1.6L8.5 5" />
        <path d="M4 12.5l1.6 1.6L8.5 11" />
        <path d="M4 18.5l1.6 1.6L8.5 17" />
        <path d="M12 6.8h8M12 12.8h8M12 18.8h5" />
      </>
    ),
  },
  {
    titre: "Data rooms sécurisées",
    bientot: false,
    texte:
      "Documents chiffrés, accès tracés, NDA intégrés. Vous contrôlez qui voit quoi, et quand — chaque page consultée est journalisée.",
    icone: (
      <>
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  },
  {
    titre: "Sourcing qualifié",
    bientot: true,
    texte:
      "Des deals filtrés selon votre thèse — secteurs, géographies, stades — avec un score de readiness sur chaque startup. Ouverture aux investisseurs après la bêta fondateurs.",
    icone: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
  },
  {
    titre: "Syndication",
    bientot: true,
    texte:
      "Invitez des co-investisseurs sur un deal, suivez les engagements et bouclez le tour dans un espace commun.",
    icone: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    titre: "Reporting automatisé",
    bientot: true,
    texte:
      "KPI collectés auprès des startups du portefeuille, consolidés en rapports trimestriels prêts pour vos bailleurs et vos LPs.",
    icone: (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 3 3 5-6" />
      </>
    ),
  },
];

const ETAPES = [
  {
    n: "01",
    titre: "Définissez votre thèse",
    texte: "Secteurs, géographies, stades, ticket — deux minutes suffisent.",
  },
  {
    n: "02",
    titre: "Recevez des deals qualifiés",
    texte:
      "À l'ouverture du sourcing : chaque startup arrive avec son score de readiness et ses documents clés.",
  },
  {
    n: "03",
    titre: "Analysez en confiance",
    texte:
      "Data room filigranée, Q&A, journal d'audit inviolable — chaque consultation est tracée.",
  },
  {
    n: "04",
    titre: "Closez et suivez",
    texte:
      "Engagements consolidés, puis reporting KPI du portefeuille — à venir après la bêta.",
  },
];

const FAQ = [
  {
    q: "À qui appartiennent mes données ?",
    r: "À vous, sans ambiguïté. Vos documents restent exportables à tout moment, nous ne les exploitons pour rien d'autre que vous les servir, et leur suppression est effective sur simple demande.",
  },
  {
    q: "Qui peut voir mon dossier ?",
    r: "Personne, tant que vous n'avez pas invité explicitement. Les droits se règlent dossier par dossier, l'accès peut exiger un NDA e-signé, les pages sont filigranées au nom du lecteur, et chaque consultation s'inscrit dans un journal d'audit infalsifiable.",
  },
  {
    q: "Que se passe-t-il si je résilie ?",
    r: "L'abonnement est mensuel et annulable à tout moment. Avant la clôture, vous exportez l'intégralité de vos documents — rien n'est retenu.",
  },
  {
    q: "Et la conformité OHADA ?",
    r: "La data room suit l'arborescence attendue dans l'espace OHADA — existence légale, gouvernance, états financiers SYSCOHADA. C'est une structure de travail éprouvée, pas un conseil juridique : votre avocat reste votre avocat.",
  },
];

function Icone({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[42px] h-[42px] rounded-[11px] bg-[rgba(232,92,43,0.10)] grid place-items-center mb-[18px]">
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#E85C2B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    </div>
  );
}

function Bientot() {
  return (
    <span className="text-[10.5px] font-[650] tracking-[0.06em] uppercase text-[#C64B1E] bg-[rgba(232,92,43,0.10)] rounded-[6px] px-2 py-[3px]">
      Bientôt
    </span>
  );
}

function Check({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="flex gap-2.5 items-start">
      <span
        className={
          "font-bold flex-none " + (dark ? "text-vibration-soft" : "text-primary")
        }
      >
        ✓
      </span>
      <span
        className={
          "text-[14px] leading-[1.5] " +
          (dark ? "text-white/80" : "text-ink-secondary")
        }
      >
        {children}
      </span>
    </div>
  );
}

function Eyebrow({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "orange" | "soft";
}) {
  const couleur =
    tone === "orange"
      ? "text-[#C64B1E]"
      : tone === "soft"
        ? "text-vibration-soft"
        : "text-ink-muted";
  return (
    <div
      className={`text-[12px] font-[600] tracking-[0.1em] uppercase mb-2.5 ${couleur}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-bg">
      <SiteNav />

      {/* ---------- Héros — il parle au fondateur ---------- */}
      <section className="relative overflow-hidden bg-encre">
        <ResonanceRings
          className="sz-arcs-pulse"
          style={{ right: -220, top: -220 }}
          radii={[100, 170, 240, 312]}
          strokes={[
            "rgba(232,92,43,0.22)",
            "rgba(232,92,43,0.14)",
            "rgba(255,255,255,0.08)",
            "rgba(255,255,255,0.05)",
          ]}
        />
        <ResonanceRings
          className="sz-arcs-pulse"
          style={{ left: -260, bottom: -260 }}
          radii={[100, 170, 240]}
          strokes={[
            "rgba(232,92,43,0.16)",
            "rgba(255,255,255,0.07)",
            "rgba(255,255,255,0.05)",
          ]}
        />

        <div className="relative mx-auto max-w-[1180px] px-5 md:px-8 pt-[70px] pb-[64px] md:pt-[88px] md:pb-[84px] text-center">
          <div className="flex justify-center mb-6">
            <SanzaLogo size={34} dark animate />
          </div>

          {/* La signature de marque devient la tagline. */}
          <div className="text-[12.5px] font-[600] tracking-[0.09em] uppercase text-vibration-soft mb-4">
            Le dealflow africain, enfin structuré
          </div>

          <h1 className="text-[clamp(32px,5.4vw,54px)] font-bold tracking-[-0.02em] leading-[1.12] text-white m-0 mb-5 text-balance">
            Levez comme si ce n&apos;était pas
            <br className="hidden sm:block" /> votre première fois.
          </h1>

          <p className="text-[clamp(15px,2.2vw,18px)] text-[#B9BCC9] leading-[1.6] max-w-[640px] mx-auto mb-9">
            Sanza vous guide pièce par pièce vers un dossier que les
            investisseurs prennent au sérieux — et vous gardez le contrôle
            total de qui voit quoi.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center mb-6">
            <Link
              href="/inscription"
              data-analytics="signup_founder_click"
              className="sz-cta text-[15.5px] px-8 py-[15px]"
            >
              Référencer ma startup
            </Link>
            <a
              href="#investisseurs"
              className="inline-flex items-center justify-center rounded-[10px] bg-white/8 border border-white/16 text-white px-8 py-[15px] text-[15.5px] font-[650] hover:bg-white/14 transition-colors min-h-[44px]"
            >
              Investisseur ? Rejoindre la liste d&apos;attente
            </a>
          </div>

          <a
            href="#sae"
            className="inline-block text-[13.5px] text-white/60 hover:text-white transition-colors mb-12"
          >
            Vous accompagnez une cohorte de startups ? Découvrez l&apos;offre
            Portfolio →
          </a>

          {/* Conditions de l'offre — pas une traction inventée. */}
          <div className="flex justify-center gap-10 sm:gap-14 flex-wrap">
            {[
              ["Bêta privée", "ouverte aux fondateurs"],
              ["Gratuit", "pendant le premier mois"],
              ["Panafricain", "dès le premier jour"],
            ].map(([titre, sous]) => (
              <div key={titre}>
                <div className="font-mono text-[22px] sm:text-[28px] font-[600] text-white">
                  {titre}
                </div>
                <div className="text-[13px] text-ink-muted mt-1">{sous}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- La plateforme ---------- */}
      <section
        id="produit"
        className="mx-auto max-w-[1180px] px-5 md:px-8 pt-[72px] md:pt-[88px] pb-10 scroll-mt-20"
      >
        <Reveal>
          <Eyebrow>La plateforme</Eyebrow>
          <h2 className="text-[clamp(26px,4vw,36px)] font-bold tracking-[-0.015em] m-0 mb-11 max-w-[560px] text-balance">
            De la levée guidée au reporting, tout le cycle
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FONCTIONS.map((f, i) => (
            <Reveal key={f.titre} delay={(i % 3) * 70}>
              <article className="sz-card h-full p-[30px] rounded-[16px]">
                <Icone>{f.icone}</Icone>
                <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                  <span className="text-[16.5px] font-[650]">{f.titre}</span>
                  {f.bientot && <Bientot />}
                </div>
                <p className="text-[14px] text-[#6B6F82] leading-[1.6]">
                  {f.texte}
                </p>
              </article>
            </Reveal>
          ))}

          <Reveal delay={140}>
            <article className="relative overflow-hidden h-full p-[30px] rounded-[16px] bg-encre">
              <ResonanceRings
                size={260}
                style={{ right: -90, bottom: -90 }}
                radii={[50, 88, 124]}
                strokes={[
                  "rgba(232,92,43,0.25)",
                  "rgba(255,255,255,0.08)",
                  "rgba(255,255,255,0.05)",
                ]}
              />
              <div className="relative">
                <div className="text-[16.5px] font-[650] text-white mb-2">
                  Et bien plus
                </div>
                <p className="text-[14px] text-[#B9BCC9] leading-[1.6] mb-[18px]">
                  Pipeline kanban, Q&A investisseurs, checklist de due
                  diligence, versions de documents, journal d&apos;audit…
                </p>
                <Link
                  href="/roadmap"
                  className="text-[14px] font-[650] text-vibration-soft hover:text-white transition-colors"
                >
                  Voir la feuille de route →
                </Link>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* ---------- Deux audiences — le fondateur d'abord ---------- */}
      <section className="mx-auto max-w-[1180px] px-5 md:px-8 pt-12 pb-[72px] md:pb-[88px]">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <div
              id="fondateurs"
              className="sz-card h-full p-8 md:p-10 rounded-[20px] scroll-mt-20"
            >
              <Eyebrow tone="orange">Pour les fondateurs</Eyebrow>
              <h3 className="text-[clamp(20px,3vw,25px)] font-bold tracking-[-0.01em] m-0 mb-3.5 text-balance">
                Un dossier que les investisseurs prennent au sérieux
              </h3>
              <p className="text-[14.5px] text-[#6B6F82] leading-[1.65] mb-6">
                Une fiche startup, un score de readiness et une data room
                structurée OHADA : vous savez quoi préparer, dans quel ordre, et
                ce qu&apos;il manque avant de pitcher.
              </p>
              <div className="flex flex-col gap-[11px] mb-7">
                <Check>
                  Dossier prêt le jour où le sourcing ouvre aux investisseurs
                </Check>
                <Check>
                  Score de readiness pour savoir quoi améliorer avant de pitcher
                </Check>
                <Check>
                  Suivi des accès à votre data room, NDA compris
                </Check>
              </div>
              <Link
                href="/inscription"
                data-analytics="signup_founder_click"
                className="inline-flex items-center justify-center rounded-[9px] bg-encre text-white px-6 py-3 text-[14px] font-[650] hover:bg-primary transition-colors min-h-[44px]"
              >
                Référencer ma startup
              </Link>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div
              id="investisseurs"
              className="sz-card h-full p-8 md:p-10 rounded-[20px] scroll-mt-20"
            >
              <Eyebrow tone="orange">Pour les investisseurs</Eyebrow>
              <h3 className="text-[clamp(20px,3vw,25px)] font-bold tracking-[-0.01em] m-0 mb-3.5 text-balance">
                Le sourcing ouvre bientôt — prenez votre place
              </h3>
              <p className="text-[14.5px] text-[#6B6F82] leading-[1.65] mb-6">
                Nous constituons d&apos;abord une base de startups avec data
                rooms et scores de readiness. Inscrivez-vous : vous définirez
                votre thèse et serez parmi les premiers servis. L&apos;accès au
                flux restera gratuit — les outils avancés (recherche, alertes)
                seront payants plus tard.
              </p>
              <div className="flex flex-col gap-[11px] mb-7">
                <Check>Accès prioritaire au dealflow à l&apos;ouverture</Check>
                <Check>
                  Thèse enregistrée dès maintenant — le matching démarre au jour 1
                </Check>
                <Check>Regard privilégié sur la bêta et son avancement</Check>
              </div>
              <InvestorWaitlistCTA label="Rejoindre la liste d'attente" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- SAE — le segment le plus rentable a sa porte ---------- */}
      <section id="sae" className="relative overflow-hidden bg-encre scroll-mt-20">
        <ResonanceRings
          size={560}
          className="sz-arcs-pulse"
          style={{ right: -180, top: -180 }}
          radii={[90, 150, 210]}
          strokes={[
            "rgba(232,92,43,0.18)",
            "rgba(255,255,255,0.07)",
            "rgba(255,255,255,0.05)",
          ]}
        />
        <div className="relative mx-auto max-w-[1180px] px-5 md:px-8 py-[72px] md:py-[84px]">
          <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] items-start">
            <Reveal>
              <Eyebrow tone="soft">Incubateurs · accélérateurs · SAE</Eyebrow>
              <h2 className="text-[clamp(24px,3.8vw,34px)] font-bold tracking-[-0.015em] text-white m-0 mb-4 text-balance">
                Vous accompagnez des startups ? Équipez toute votre cohorte.
              </h2>
              <p className="text-[15px] text-[#B9BCC9] leading-[1.65] mb-6 max-w-[520px]">
                Suivez la complétude des dossiers et la valeur totale en levée —
                le reporting que vos bailleurs attendent, sans tableur. Les
                abonnements Fondateur de toute la cohorte sont inclus : vos
                startups n&apos;ont rien à payer.
              </p>
              <div className="flex flex-col gap-[11px] mb-8">
                <Check dark>
                  Chaque startup de la cohorte équipée du plan Fondateur complet
                </Check>
                <Check dark>
                  Vue d&apos;ensemble : complétude, stades, montants recherchés
                </Check>
                <Check dark>
                  Le fondateur reste seul maître des accès à sa data room
                </Check>
              </div>
              <SaeDemoCTA dark />
            </Reveal>

            <Reveal delay={90}>
              <div className="rounded-[16px] border border-white/12 bg-white/5 p-7">
                <div className="text-[13px] font-[650] text-white mb-4">
                  Ce que la démo couvre
                </div>
                <div className="flex flex-col gap-3 text-[13.5px] text-white/75 leading-relaxed">
                  <p>
                    · La data room et le parcours guidé, du point de vue
                    d&apos;une startup de votre cohorte
                  </p>
                  <p>
                    · Le suivi de complétude par startup — ce qui existe
                    aujourd&apos;hui, en production
                  </p>
                  <p>
                    · Le dashboard agrégé et l&apos;export bailleurs, en
                    construction : les premiers programmes en co-décident la
                    forme
                  </p>
                </div>
                <p className="mt-5 pt-4 border-t border-white/10 text-[12px] text-white/50 leading-relaxed">
                  Vente en rendez-vous uniquement. À partir de 150 000 FCFA/mois
                  jusqu&apos;à 10 startups — sous le seuil de décision
                  d&apos;une ligne outillage.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Comment ça marche ---------- */}
      <section className="bg-[#F4EFE6] border-y border-line">
        <div className="mx-auto max-w-[1180px] px-5 md:px-8 py-[72px] md:py-20">
          <Reveal>
            <Eyebrow>Comment ça marche</Eyebrow>
            <h2 className="text-[clamp(24px,3.6vw,32px)] font-bold tracking-[-0.015em] m-0 mb-11">
              De la rencontre au closing, en quatre temps
            </h2>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ETAPES.map((e, i) => (
              <Reveal key={e.n} delay={i * 70}>
                <div>
                  <div className="font-mono text-[13px] font-[600] text-[#C64B1E] mb-3">
                    {e.n}
                  </div>
                  <div className="text-[16px] font-[650] mb-2">{e.titre}</div>
                  <p className="text-[13.5px] text-[#6B6F82] leading-[1.6]">
                    {e.texte}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Tarifs — trois plans, deux payeurs ---------- */}
      <section
        id="tarifs"
        className="mx-auto max-w-[1180px] px-5 md:px-8 py-[72px] md:py-[88px] scroll-mt-20"
      >
        <Reveal>
          <div className="text-center mb-12">
            <Eyebrow>Tarifs</Eyebrow>
            <h2 className="text-[clamp(26px,4vw,36px)] font-bold tracking-[-0.015em] m-0 mb-3.5">
              Le fondateur possède, le programme supervise,
              <br className="hidden md:block" /> l&apos;investisseur consulte
            </h2>
            <p className="text-[15.5px] text-[#6B6F82] max-w-[560px] mx-auto leading-[1.6]">
              Aucune commission sur les montants levés. Vous payez l&apos;outil,
              pas votre succès.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          <Reveal>
            <div className="relative h-full bg-surface border-2 border-primary rounded-[20px] p-8 flex flex-col">
              <span className="absolute -top-[13px] left-8 bg-primary text-white text-[11px] font-[650] tracking-[0.06em] uppercase rounded-full px-3.5 py-[5px]">
                1er mois offert
              </span>
              <div className="text-[15px] font-[650] mb-1.5">Fondateur</div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="font-mono text-[38px] font-[600] leading-none">
                  15 000 F
                </span>
                <span className="text-[14px] text-ink-muted">/ mois</span>
              </div>
              <p className="text-[13.5px] text-[#6B6F82] leading-[1.6] mb-5">
                Premier mois complet sans carte bancaire. Annulable à tout
                moment, données exportables.
              </p>
              <div className="flex flex-col gap-2.5 mb-7">
                <Check>Data room structurée OHADA</Check>
                <Check>Checklist par stade + score de readiness</Check>
                <Check>Visionneuse filigranée, NDA e-signé</Check>
                <Check>Droits par dossier, journal d&apos;audit</Check>
              </div>
              <Link
                href="/inscription"
                data-analytics="signup_founder_click"
                className="sz-cta w-full text-[14px] mt-auto"
              >
                Commencer gratuitement
              </Link>
            </div>
          </Reveal>

          <Reveal delay={70}>
            <div className="relative overflow-hidden h-full bg-encre rounded-[20px] p-8 flex flex-col">
              <ResonanceRings
                size={300}
                style={{ right: -110, bottom: -110 }}
                radii={[60, 100, 140]}
                strokes={[
                  "rgba(232,92,43,0.22)",
                  "rgba(255,255,255,0.07)",
                  "rgba(255,255,255,0.05)",
                ]}
              />
              <div className="relative flex flex-col h-full">
                <div className="text-[15px] font-[650] text-white mb-1.5">
                  Portfolio — programmes &amp; SAE
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="font-mono text-[15px] text-white/60">
                    à partir de
                  </span>
                  <span className="font-mono text-[38px] font-[600] leading-none text-white">
                    150 000 F
                  </span>
                  <span className="text-[14px] text-white/50">/ mois</span>
                </div>
                <p className="text-[13.5px] text-white/65 leading-[1.6] mb-5">
                  Jusqu&apos;à 10 startups, paliers 25 et 50. Deux mois offerts
                  en facturation annuelle.
                </p>
                <div className="flex flex-col gap-2.5 mb-7">
                  <Check dark>
                    Abonnements Fondateur de toute la cohorte inclus
                  </Check>
                  <Check dark>Suivi de complétude par startup</Check>
                  <Check dark>
                    Dashboard cohorte &amp; export bailleurs — co-construits
                    avec les premiers programmes
                  </Check>
                </div>
                <div className="mt-auto">
                  <a
                    href="#sae"
                    className="inline-flex w-full items-center justify-center rounded-[9px] bg-white/10 border border-white/20 text-white py-3 text-[14px] font-[650] hover:bg-white/16 transition-colors min-h-[44px]"
                  >
                    Demander une démo
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="h-full sz-card rounded-[20px] p-8 flex flex-col">
              <div className="text-[15px] font-[650] mb-1.5">Investisseur</div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="font-mono text-[38px] font-[600] leading-none">
                  Gratuit
                </span>
              </div>
              <p className="text-[13.5px] text-[#6B6F82] leading-[1.6] mb-5">
                Liste d&apos;attente aujourd&apos;hui. L&apos;accès au flux
                restera gratuit ; les outils avancés — recherche, alertes —
                seront payants plus tard.
              </p>
              <div className="flex flex-col gap-2.5 mb-7">
                <Check>Profils startup comparables</Check>
                <Check>Demande d&apos;accès aux data rooms</Check>
                <Check>Thèse enregistrée dès l&apos;inscription</Check>
              </div>
              <a
                href="#investisseurs"
                className="flex items-center justify-center w-full rounded-[9px] border border-line bg-surface text-ink py-3 text-[14px] font-[650] hover:border-primary transition-colors min-h-[44px] mt-auto"
              >
                Rejoindre la liste d&apos;attente
              </a>
            </div>
          </Reveal>
        </div>

        <p className="text-center text-[12.5px] text-ink-muted mt-6">
          Prix de lancement indicatifs — paiement Mobile Money et carte à
          l&apos;ouverture de la facturation.
        </p>
      </section>

      {/* ---------- FAQ — les objections de confiance, frontalement ---------- */}
      <section className="bg-surface border-y border-line">
        <div className="mx-auto max-w-[1180px] px-5 md:px-8 py-[72px] md:py-20">
          <Reveal>
            <Eyebrow>Questions directes, réponses directes</Eyebrow>
            <h2 className="text-[clamp(24px,3.6vw,32px)] font-bold tracking-[-0.015em] m-0 mb-11">
              Ce que vous êtes en droit de demander
            </h2>
          </Reveal>
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            {FAQ.map((item, i) => (
              <Reveal key={item.q} delay={(i % 2) * 70}>
                <div>
                  <h3 className="text-[16px] font-[650] mb-2">{item.q}</h3>
                  <p className="text-[14px] text-[#6B6F82] leading-[1.65]">
                    {item.r}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA final ---------- */}
      <section className="relative overflow-hidden bg-encre">
        <ResonanceRings
          size={560}
          className="sz-arcs-pulse"
          style={{ left: -200, top: -200 }}
          radii={[90, 150, 210]}
          strokes={[
            "rgba(232,92,43,0.18)",
            "rgba(255,255,255,0.07)",
            "rgba(255,255,255,0.05)",
          ]}
        />
        <div className="relative mx-auto max-w-[1180px] px-5 md:px-8 py-[72px] md:py-[84px] text-center">
          <Reveal>
            <div className="inline-flex gap-[5px] items-end mb-7">
              <span className="w-[7px] h-[22px] rounded-[4px] bg-primary opacity-30 inline-block" />
              <span className="w-[7px] h-[34px] rounded-[4px] bg-primary opacity-55 inline-block" />
              <span className="w-[7px] h-[52px] rounded-[4px] bg-white inline-block" />
            </div>
            <h2 className="text-[clamp(26px,4.2vw,38px)] font-bold tracking-[-0.015em] text-white m-0 mb-3.5">
              Faites résonner vos deals.
            </h2>
            <p className="text-[16px] text-[#B9BCC9] mb-8">
              Fondateurs : structurez votre levée dès aujourd&apos;hui.
              Programmes : équipez votre cohorte. Investisseurs : prenez votre
              place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/inscription"
                data-analytics="signup_founder_click"
                className="sz-cta text-[15.5px] px-9 py-[15px]"
              >
                Référencer ma startup
              </Link>
              <a
                href="#sae"
                className="inline-flex items-center justify-center rounded-[10px] bg-white/8 border border-white/16 text-white px-8 py-[15px] text-[15.5px] font-[650] hover:bg-white/14 transition-colors min-h-[44px]"
              >
                Demander une démo Portfolio
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Pied de page ---------- */}
      <footer className="bg-[#12141F]">
        <div className="mx-auto max-w-[1180px] px-5 md:px-8 py-11 flex flex-wrap justify-between items-start gap-10">
          <div>
            <div className="mb-3">
              <SanzaLogo size={22} dark />
            </div>
            <p className="text-[12.5px] text-ink-muted leading-[1.6]">
              Plateforme de dealflow panafricaine
              <br />
              Abidjan, Côte d&apos;Ivoire ·{" "}
              <a
                href="https://sanza.africa"
                className="hover:text-white transition-colors"
              >
                sanza.africa
              </a>
            </p>
          </div>

          <div className="flex gap-10 sm:gap-14 flex-wrap">
            <div className="flex flex-col gap-2.5">
              <div className="text-[12px] font-[650] text-[#C9CBD6]">Produit</div>
              <a
                href="#produit"
                className="text-[13px] text-ink-muted hover:text-white transition-colors"
              >
                Fonctionnalités
              </a>
              <a
                href="#tarifs"
                className="text-[13px] text-ink-muted hover:text-white transition-colors"
              >
                Tarifs
              </a>
              <Link
                href="/roadmap"
                className="text-[13px] text-ink-muted hover:text-white transition-colors"
              >
                Feuille de route
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="text-[12px] font-[650] text-[#C9CBD6]">
                Audiences
              </div>
              <a
                href="#fondateurs"
                className="text-[13px] text-ink-muted hover:text-white transition-colors"
              >
                Fondateurs
              </a>
              <a
                href="#sae"
                className="text-[13px] text-ink-muted hover:text-white transition-colors"
              >
                Programmes &amp; SAE
              </a>
              <a
                href="#investisseurs"
                className="text-[13px] text-ink-muted hover:text-white transition-colors"
              >
                Investisseurs
              </a>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="text-[12px] font-[650] text-[#C9CBD6]">Accès</div>
              <Link
                href="/connexion"
                className="text-[13px] text-ink-muted hover:text-white transition-colors"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className="text-[13px] text-ink-muted hover:text-white transition-colors"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/7">
          <div className="mx-auto max-w-[1180px] px-5 md:px-8 py-[18px] font-mono text-[11.5px] text-white/35">
            © {new Date().getFullYear()} Sanza · Données hébergées dans
            l&apos;Union européenne
          </div>
        </div>
      </footer>
    </div>
  );
}
