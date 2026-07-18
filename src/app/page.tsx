import Link from "next/link";
import type { Metadata } from "next";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { SiteNav } from "@/components/site/SiteNav";
import { Reveal } from "@/components/site/Reveal";
import { ResonanceRings } from "@/components/site/ResonanceRings";
import { InvestorWaitlistCTA } from "@/components/site/InvestorWaitlistCTA";

export const metadata: Metadata = {
  title: "Sanza — Le dealflow africain, enfin structuré",
  description:
    "Sanza connecte investisseurs et startups du continent : sourcing qualifié, data rooms sécurisées, syndication et reporting — au même endroit.",
  openGraph: {
    title: "Sanza — Le dealflow africain, enfin structuré",
    description:
      "Sourcing qualifié, data rooms sécurisées, syndication et reporting. Faites résonner vos deals.",
    type: "website",
    locale: "fr_FR",
    siteName: "Sanza",
  },
};

/**
 * Site public, d'après la maquette de référence.
 *
 * Les libellés « Bientôt » ne sont pas décoratifs : ils marquent ce qui n'est
 * PAS encore livré. Deux ont été ajoutés par rapport à la maquette —
 * vérification/conformité et reporting — parce que ces fonctions n'existent
 * pas aujourd'hui et que les annoncer sans réserve à un investisseur serait
 * une promesse qu'on ne tient pas.
 */

const FONCTIONS = [
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
    titre: "Data rooms sécurisées",
    bientot: false,
    texte:
      "Documents chiffrés, accès tracés, NDA intégrés. Les fondateurs contrôlent qui voit quoi, et quand.",
    icone: (
      <>
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
    titre: "Vérification & conformité",
    // Ajouté : le screening n'existe pas encore. Sans ce marqueur, la carte
    // promettrait une conformité réglementaire que nous n'assurons pas.
    bientot: true,
    texte:
      "Screening automatique OFAC, UE, ONU et UEMOA sur toutes les parties. La confiance par défaut.",
    icone: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    titre: "Reporting automatisé",
    bientot: true,
    texte:
      "KPI collectés auprès des startups du portefeuille, consolidés en rapports trimestriels prêts pour vos LPs.",
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

function Check({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="text-primary font-bold flex-none">✓</span>
      <span className="text-[14px] text-ink-secondary leading-[1.5]">
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
  tone?: "muted" | "orange";
}) {
  return (
    <div
      className={
        "text-[12px] font-[600] tracking-[0.1em] uppercase mb-2.5 " +
        (tone === "orange" ? "text-[#C64B1E]" : "text-ink-muted")
      }
    >
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-bg">
      <SiteNav />

      {/* ---------- Héros ---------- */}
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

        <div className="relative mx-auto max-w-[1180px] px-5 md:px-8 pt-[76px] pb-[70px] md:pt-[96px] md:pb-[90px] text-center">
          <div className="flex justify-center mb-7">
            <SanzaLogo size={34} dark animate />
          </div>

          <h1 className="text-[clamp(34px,6.2vw,58px)] font-bold tracking-[-0.02em] leading-[1.12] text-white m-0 mb-5 text-balance">
            Le dealflow africain,
            <br />
            <span className="text-primary">enfin structuré.</span>
          </h1>

          <p className="text-[clamp(15px,2.2vw,18px)] text-[#B9BCC9] leading-[1.6] max-w-[620px] mx-auto mb-9">
            Sanza connecte investisseurs et startups du continent : sourcing
            qualifié, data rooms sécurisées, syndication et reporting — au même
            endroit.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center mb-14">
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

          {/* Ce ne sont pas des chiffres d'usage : ce sont les conditions de
              l'offre. Aucune traction n'est affichée tant qu'elle n'existe pas. */}
          <div className="flex justify-center gap-10 sm:gap-14 flex-wrap">
            {[
              ["Bêta privée", "ouverte aux fondateurs"],
              ["Gratuit", "pendant la phase de test"],
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
            Tout le cycle d&apos;investissement, du sourcing au reporting
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
                {/* Liste volontairement limitée à ce qui existe aujourd'hui. */}
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

      {/* ---------- Deux audiences ---------- */}
      <section className="mx-auto max-w-[1180px] px-5 md:px-8 pt-12 pb-[72px] md:pb-[88px]">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <div
              id="investisseurs"
              className="sz-card h-full p-8 md:p-10 rounded-[20px] scroll-mt-20"
            >
              <Eyebrow tone="orange">Pour les investisseurs</Eyebrow>
              <h3 className="text-[clamp(20px,3vw,25px)] font-bold tracking-[-0.01em] m-0 mb-3.5 text-balance">
                Le sourcing ouvre bientôt — prenez votre place
              </h3>
              <p className="text-[14.5px] text-[#6B6F82] leading-[1.65] mb-6">
                Nous constituons d&apos;abord une base de startups vérifiées,
                avec data rooms et scores de readiness. Inscrivez-vous sur la
                liste d&apos;attente : vous définirez votre thèse et serez parmi
                les premiers à recevoir du dealflow qualifié.
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

          <Reveal delay={80}>
            <div
              id="fondateurs"
              className="sz-card h-full p-8 md:p-10 rounded-[20px] scroll-mt-20"
            >
              <Eyebrow tone="orange">Pour les fondateurs</Eyebrow>
              <h3 className="text-[clamp(20px,3vw,25px)] font-bold tracking-[-0.01em] m-0 mb-3.5 text-balance">
                Levez auprès d&apos;investisseurs qui cherchent votre profil
              </h3>
              <p className="text-[14.5px] text-[#6B6F82] leading-[1.65] mb-6">
                Une fiche startup, un score de readiness et une data room :
                votre dossier arrive directement devant les investisseurs dont
                la thèse correspond à votre secteur et votre stade.
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

      {/* ---------- Tarifs ---------- */}
      <section
        id="tarifs"
        className="mx-auto max-w-[1180px] px-5 md:px-8 py-[72px] md:py-[88px] scroll-mt-20"
      >
        <Reveal>
          <div className="text-center mb-12">
            <Eyebrow>Tarifs</Eyebrow>
            <h2 className="text-[clamp(26px,4vw,36px)] font-bold tracking-[-0.015em] m-0 mb-3.5">
              Le premier mois est offert
            </h2>
            <p className="text-[15.5px] text-[#6B6F82] max-w-[560px] mx-auto leading-[1.6]">
              Testez Sanza sans carte bancaire pendant 30 jours. Ensuite, un
              abonnement simple — annulable à tout moment.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 max-w-[860px] mx-auto">
          <Reveal>
            <div className="relative h-full bg-surface border-2 border-primary rounded-[20px] p-9">
              <span className="absolute -top-[13px] left-9 bg-primary text-white text-[11px] font-[650] tracking-[0.06em] uppercase rounded-full px-3.5 py-[5px]">
                Pendant la bêta
              </span>
              <div className="text-[15px] font-[650] mb-1.5">Premier mois</div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="font-mono text-[44px] font-[600] leading-none">
                  0 F
                </span>
                <span className="text-[14px] text-ink-muted">/ 30 jours</span>
              </div>
              <p className="text-[13.5px] text-[#6B6F82] leading-[1.6] mb-6">
                Accès complet, sans carte bancaire. Nous voulons que vous
                testiez tout.
              </p>
              <div className="flex flex-col gap-2.5 mb-7">
                <Check>Fiche startup + score de readiness</Check>
                <Check>Data room sécurisée, accès tracés</Check>
                <Check>Toutes les fonctionnalités à venir incluses</Check>
              </div>
              <Link
                href="/inscription"
                data-analytics="signup_founder_click"
                className="sz-cta w-full text-[14px]"
              >
                Commencer gratuitement
              </Link>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="h-full sz-card rounded-[20px] p-9">
              <div className="text-[15px] font-[650] mb-1.5">Ensuite</div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="font-mono text-[44px] font-[600] leading-none">
                  15 000 F
                </span>
                <span className="text-[14px] text-ink-muted">/ mois</span>
              </div>
              <p className="text-[13.5px] text-[#6B6F82] leading-[1.6] mb-6">
                À partir du 2ᵉ mois. Annulable à tout moment, vos données
                restent exportables.
              </p>
              <div className="flex flex-col gap-2.5 mb-7">
                <Check>Tout ce qui est inclus dans l&apos;essai</Check>
                <Check>
                  Visibilité auprès des investisseurs à l&apos;ouverture du
                  sourcing
                </Check>
                <Check>Support prioritaire</Check>
              </div>
              <Link
                href="/roadmap"
                className="flex items-center justify-center w-full rounded-[9px] border border-line bg-surface text-ink py-3 text-[14px] font-[650] hover:border-primary transition-colors min-h-[44px]"
              >
                En savoir plus
              </Link>
            </div>
          </Reveal>
        </div>

        <p className="text-center text-[12.5px] text-ink-muted mt-6">
          Prix de lancement indicatif — paiement Mobile Money et carte. Les
          investisseurs en liste d&apos;attente ne paient rien.
        </p>
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
            {/* Motif écho : deux barres orange, une blanche. */}
            <div className="inline-flex gap-[5px] items-end mb-7">
              <span className="w-[7px] h-[22px] rounded-[4px] bg-primary opacity-30 inline-block" />
              <span className="w-[7px] h-[34px] rounded-[4px] bg-primary opacity-55 inline-block" />
              <span className="w-[7px] h-[52px] rounded-[4px] bg-white inline-block" />
            </div>
            <h2 className="text-[clamp(26px,4.2vw,38px)] font-bold tracking-[-0.015em] text-white m-0 mb-3.5">
              Faites résonner vos deals.
            </h2>
            <p className="text-[16px] text-[#B9BCC9] mb-8">
              Fondateurs : rejoignez la bêta. Investisseurs : prenez votre place
              sur la liste d&apos;attente.
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
                href="#investisseurs"
                className="inline-flex items-center justify-center rounded-[10px] bg-white/8 border border-white/16 text-white px-8 py-[15px] text-[15.5px] font-[650] hover:bg-white/14 transition-colors min-h-[44px]"
              >
                Liste d&apos;attente investisseurs
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
              <a href="https://sanza.africa" className="hover:text-white transition-colors">
                sanza.africa
              </a>
            </p>
          </div>

          <div className="flex gap-10 sm:gap-14 flex-wrap">
            <div className="flex flex-col gap-2.5">
              <div className="text-[12px] font-[650] text-[#C9CBD6]">Produit</div>
              <a href="#produit" className="text-[13px] text-ink-muted hover:text-white transition-colors">
                Fonctionnalités
              </a>
              <a href="#tarifs" className="text-[13px] text-ink-muted hover:text-white transition-colors">
                Tarifs
              </a>
              <Link href="/roadmap" className="text-[13px] text-ink-muted hover:text-white transition-colors">
                Feuille de route
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="text-[12px] font-[650] text-[#C9CBD6]">Accès</div>
              <Link href="/connexion" className="text-[13px] text-ink-muted hover:text-white transition-colors">
                Se connecter
              </Link>
              <Link href="/inscription" className="text-[13px] text-ink-muted hover:text-white transition-colors">
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
