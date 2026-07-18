import Link from "next/link";
import type { Metadata } from "next";
import { SanzaLogo } from "@/components/ui/SanzaLogo";
import { ResonanceArcs } from "@/components/brand/ResonanceArcs";
import { EchoMotif } from "@/components/brand/EchoMotif";
import { SiteNav } from "@/components/site/SiteNav";
import { Reveal } from "@/components/site/Reveal";
import { CountUp } from "@/components/site/CountUp";
import { WaitlistForm } from "@/components/site/WaitlistForm";

export const metadata: Metadata = {
  title: "Sanza — Le dealflow africain, enfin structuré",
  description:
    "Sanza connecte investisseurs et fondateurs africains : profils startup structurés, data rooms sécurisées, mise en relation directe. Bêta ouverte aux fondateurs.",
  openGraph: {
    title: "Sanza — Le dealflow africain, enfin structuré",
    description:
      "Profils startup structurés, data rooms sécurisées, mise en relation directe. Faites résonner vos deals.",
    type: "website",
    locale: "fr_FR",
    siteName: "Sanza",
  },
};

/**
 * Site public. Surface DISTINCTE du dashboard : mêmes tokens de marque, mais
 * ni shell applicatif ni session. Un visiteur non connecté doit pouvoir tout
 * lire sans qu'une requête d'authentification ne s'interpose.
 */

const PILIERS = [
  {
    titre: "Des profils startup structurés",
    texte:
      "Chaque startup renseigne les mêmes éléments : identité juridique, stade, montant recherché, revenus. Vous comparez des dossiers comparables, au lieu de reconstituer l'information dans dix formats différents.",
    bientot: false,
  },
  {
    titre: "Des data rooms sécurisées",
    texte:
      "Documents chiffrés, droits par dossier, filigrane au nom du lecteur, journal d'audit inviolable. Le fichier ne quitte jamais nos serveurs — même pour être lu.",
    bientot: false,
  },
  {
    titre: "La mise en relation directe",
    texte:
      "L'investisseur demande l'accès, le fondateur décide. Pas d'intermédiaire, pas de mise en relation payante, pas de commission sur le tour.",
    bientot: true,
  },
];

export default function Home() {
  return (
    <div className="bg-bg">
      <SiteNav />

      {/* ---------- Héros ---------- */}
      <section className="relative overflow-hidden bg-encre text-white">
        <div className="sz-arcs-pulse">
          <ResonanceArcs corner="bottom-right" />
        </div>
        <div className="sz-arcs-pulse">
          <ResonanceArcs corner="top-left" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1140px] px-5 pt-[150px] pb-[110px]">
          <div className="max-w-[680px]">
            {/* Seul endroit du site où le logo vibre, comme spécifié. */}
            <SanzaLogo size={40} dark animate />

            <h1 className="mt-7 text-[clamp(34px,6vw,58px)] font-[650] leading-[1.06] tracking-[-0.03em]">
              Le dealflow africain,{" "}
              <span className="text-vibration-soft">enfin structuré.</span>
            </h1>

            <p className="mt-5 text-[clamp(15px,2.2vw,18px)] text-white/72 leading-relaxed max-w-[560px]">
              Des profils de startups comparables, des data rooms sécurisées, et
              une mise en relation directe entre investisseurs et fondateurs.
              Faites résonner vos deals.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/inscription"
                data-analytics="signup_founder_click"
                className="sz-cta text-[14px] px-5 py-3"
              >
                Référencer ma startup
              </Link>
              <a
                href="#investisseurs"
                className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-white/22 px-5 py-3 text-[14px] font-[550] text-white/90 hover:bg-white/8 hover:border-white/35 transition-colors"
              >
                Je suis investisseur
              </a>
            </div>

            <p className="mt-4 text-[12.5px] text-white/45">
              Premier mois offert pour les fondateurs · Accès investisseurs sur
              liste d&apos;attente
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Les 3 piliers ---------- */}
      <section id="produit" className="mx-auto max-w-[1140px] px-5 py-[88px]">
        <Reveal>
          <h2 className="text-[clamp(24px,3.4vw,34px)] font-[650] tracking-[-0.02em] max-w-[620px]">
            Trois choses, faites correctement.
          </h2>
          <p className="mt-3 text-[14px] text-ink-secondary max-w-[560px] leading-relaxed">
            Sanza ne cherche pas à tout faire. Ce qui suit est ce dont un tour
            de table a réellement besoin.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PILIERS.map((p, i) => (
            <Reveal key={p.titre} delay={i * 70}>
              <article className="sz-card h-full p-6 flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[11px] text-ink-muted pt-0.5">
                    0{i + 1}
                  </span>
                  {p.bientot && (
                    <span className="ml-auto rounded-full bg-chip-amber-bg text-chip-amber-fg text-[10.5px] font-[650] px-2 py-0.5">
                      Bientôt
                    </span>
                  )}
                </div>
                <h3 className="text-[16px] font-[650] tracking-[-0.01em] leading-snug">
                  {p.titre}
                </h3>
                <p className="text-[13px] text-ink-secondary leading-relaxed">
                  {p.texte}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Transparence bêta ---------- */}
      <section id="beta" className="bg-surface border-y border-line">
        <div className="mx-auto max-w-[1140px] px-5 py-[80px]">
          <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] items-start">
            <Reveal>
              <EchoMotif />
              <h2 className="mt-5 text-[clamp(24px,3.4vw,34px)] font-[650] tracking-[-0.02em]">
                Pourquoi les fondateurs d&apos;abord.
              </h2>
            </Reveal>

            <Reveal delay={80}>
              <div className="flex flex-col gap-4 text-[14px] text-ink-secondary leading-relaxed">
                <p>
                  Un dealroom sans startups n&apos;a aucun intérêt pour un
                  investisseur. Nous ouvrons donc d&apos;abord aux fondateurs, le
                  temps de constituer un flux de dossiers réellement qualifiés.
                </p>
                <p>
                  Les fonctionnalités côté investisseur — recherche, suivi de
                  portefeuille, mise en relation — sont marquées{" "}
                  <span className="font-[650] text-ink">« Bientôt »</span> tant
                  qu&apos;elles ne sont pas livrées. Nous préférons l&apos;écrire
                  que de vous laisser le découvrir après votre inscription.
                </p>
                <p>
                  La feuille de route est publique, et ce sont les votes qui
                  décident de l&apos;ordre de construction.
                </p>
                <Link
                  href="/roadmap"
                  className="text-[13.5px] font-[550] text-link hover:text-link-hover w-fit"
                >
                  Voir la feuille de route →
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Tarifs ---------- */}
      <section id="tarifs" className="mx-auto max-w-[1140px] px-5 py-[88px]">
        <Reveal>
          <h2 className="text-[clamp(24px,3.4vw,34px)] font-[650] tracking-[-0.02em]">
            Un tarif, sans commission.
          </h2>
          <p className="mt-3 text-[14px] text-ink-secondary max-w-[560px] leading-relaxed">
            Sanza ne prend aucun pourcentage sur les montants levés. Vous payez
            l&apos;outil, pas votre succès.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Reveal>
            <article className="sz-card h-full p-7 flex flex-col gap-4">
              <div>
                <h3 className="text-[15px] font-[650]">Fondateurs</h3>
                <p className="mt-1 text-[12.5px] text-ink-secondary">
                  Votre data room, vos documents, vos investisseurs.
                </p>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-mono text-[38px] font-[600] tracking-[-0.02em] leading-none">
                  <CountUp value={15000} />
                </span>
                <span className="font-mono text-[13px] text-ink-secondary pb-1.5">
                  FCFA / mois
                </span>
              </div>
              <p className="text-[12.5px] font-[650] text-primary">
                Premier mois offert
              </p>
              <ul className="flex flex-col gap-1.5 text-[13px] text-ink-secondary">
                <li>· Data room complète, structure OHADA</li>
                <li>· Visionneuse filigranée, téléchargement bloqué</li>
                <li>· Droits par dossier et NDA e-signé</li>
                <li>· Journal d&apos;audit inviolable</li>
              </ul>
              <Link
                href="/inscription"
                data-analytics="signup_founder_click"
                className="sz-cta mt-auto text-[13.5px]"
              >
                Référencer ma startup
              </Link>
            </article>
          </Reveal>

          <Reveal delay={80}>
            <article
              id="investisseurs"
              className="sz-card h-full p-7 flex flex-col gap-4 scroll-mt-[90px]"
            >
              <div className="flex items-start gap-2">
                <div>
                  <h3 className="text-[15px] font-[650]">Investisseurs</h3>
                  <p className="mt-1 text-[12.5px] text-ink-secondary">
                    Accès au flux de startups qualifiées.
                  </p>
                </div>
                <span className="ml-auto rounded-full bg-chip-amber-bg text-chip-amber-fg text-[10.5px] font-[650] px-2 py-0.5">
                  Bientôt
                </span>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-mono text-[38px] font-[600] tracking-[-0.02em] leading-none">
                  Gratuit
                </span>
              </div>
              <p className="text-[12.5px] text-ink-secondary leading-relaxed">
                Les accès investisseurs ouvriront quand le flux de startups sera
                suffisant. Laissez votre adresse : vous serez prévenu en premier.
              </p>
              <div className="mt-auto">
                <WaitlistForm />
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* ---------- CTA final ---------- */}
      <section className="relative overflow-hidden bg-encre text-white">
        <div className="sz-arcs-pulse">
          <ResonanceArcs corner="top-right" />
        </div>
        <div className="relative z-10 mx-auto max-w-[1140px] px-5 py-[84px] text-center">
          <Reveal>
            <h2 className="text-[clamp(24px,3.6vw,36px)] font-[650] tracking-[-0.025em]">
              Faites résonner vos deals.
            </h2>
            <p className="mt-3 text-[14.5px] text-white/70 max-w-[520px] mx-auto leading-relaxed">
              Structurez votre levée aujourd&apos;hui, montrez-la quand vous
              serez prêt.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/inscription"
                data-analytics="signup_founder_click"
                className="sz-cta text-[14px] px-5 py-3"
              >
                Référencer ma startup
              </Link>
              <a
                href="#investisseurs"
                className="inline-flex items-center justify-center rounded-[9px] border border-white/22 px-5 py-3 text-[14px] font-[550] text-white/90 hover:bg-white/8 hover:border-white/35 transition-colors"
              >
                Rejoindre la liste investisseurs
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Pied de page ---------- */}
      <footer className="bg-encre border-t border-white/10 text-white/55">
        <div className="mx-auto max-w-[1140px] px-5 py-10 flex flex-col sm:flex-row gap-6 sm:items-center">
          <div>
            <SanzaLogo size={22} dark />
            <p className="mt-2 text-[12px]">
              Le dealflow africain, enfin structuré.
            </p>
          </div>
          <nav className="sm:ml-auto flex flex-wrap gap-x-6 gap-y-2 text-[12.5px]">
            <a href="#produit" className="hover:text-white transition-colors">
              Produit
            </a>
            <a href="#tarifs" className="hover:text-white transition-colors">
              Tarifs
            </a>
            <Link href="/roadmap" className="hover:text-white transition-colors">
              Feuille de route
            </Link>
            <Link href="/connexion" className="hover:text-white transition-colors">
              Se connecter
            </Link>
          </nav>
        </div>
        <div className="mx-auto max-w-[1140px] px-5 pb-8">
          <p className="text-[11.5px] text-white/35">
            © {new Date().getFullYear()} Sanza · Données hébergées dans
            l&apos;Union européenne
          </p>
        </div>
      </footer>
    </div>
  );
}
