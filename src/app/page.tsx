import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import Link from "next/link";

import { SanzaLogo } from "@/components/ui/SanzaLogo";

import {
  CaptureDataRoom,
  CaptureDealroom,
  CapturePreparation,
} from "@/components/vitrine/captures";
import "@/components/vitrine/vitrine.css";

/**
 * L'accueil de sanza.africa — vitrine, direction 2a.
 *
 * Source de vérité : `sanza_handoff/Website sanza_v2/site-vitrine-2a.html`,
 * dont le brief impose de reproduire le design à l'identique et interdit de
 * réinterpréter. Toute valeur vient de là ; rien n'est arrondi ni dérivé. Seul
 * écart de texte : « Dossier prêt » pour « Readiness », tranché par le
 * fondateur — voir `docs/site/DECISIONS.md` §2.
 *
 * ELLE REMPLACE L'ANCIENNE PAGE, construite sur un autre système visuel (nav et
 * pied de page `components/marketing`, anneaux, révélations au défilement).
 * `/institutions` et `/accelerateurs` vivent encore sur ce système-là : tant
 * qu'elles ne sont pas reprises en 2a, le site porte deux habillages.
 *
 * LES POLICES NE VIENNENT PAS DE GOOGLE. Le brief prévoit un `<link>` vers
 * `fonts.googleapis.com` ; la politique de sécurité du site pose
 * `font-src 'self' data:` et l'aurait bloqué en silence — la page serait
 * tombée sur une police système sans que rien ne le signale. `next/font` les
 * héberge à la compilation : mêmes fontes, même rendu, servies depuis notre
 * domaine.
 */

const titre = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-vit-titre",
  display: "swap",
});

const texte = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-vit-texte",
  display: "swap",
});

/**
 * Le `noindex` de la route d'attente est levé : c'est l'accueil, il doit être
 * indexé. L'`openGraph` est repris de l'ancienne page — sans lui, tout partage
 * du lien en message ou en publication perd son aperçu — et son texte accordé
 * au nouveau discours.
 */
export const metadata: Metadata = {
  title: "Sanza — Levez des fonds sans jamais perdre le fil de votre dossier",
  description:
    "Data room sécurisée, préparation guidée selon les exigences réelles des financeurs, et mise en relation quand vous êtes prêt. Tout au même endroit.",
  openGraph: {
    title: "Sanza — Levez des fonds sans jamais perdre le fil de votre dossier",
    description:
      "Data room sécurisée, préparation guidée selon les exigences réelles des financeurs, et mise en relation quand vous êtes prêt.",
    type: "website",
    locale: "fr_FR",
    siteName: "Sanza",
  },
};

/** Là où mènent les deux points d'entrée pendant la bêta. */
const APP = "https://v2.sanza.africa";

export default function Accueil() {
  return (
    <div className={`vit ${titre.variable} ${texte.variable}`}>
      <div className="vit-page">
        {/*
          1 — Nav.

          LE LOGO NE VIENT PAS DE LA MAQUETTE. Elle dessine un carré orange
          portant un « S » capitale, suivi de « Sanza » en Archivo — ce n'est pas
          la marque. La vraie signature est la « vibration » : `sanza` en bas de
          casse, Instrument Sans 700, le dernier `a` doublé de deux échos orange
          posés DERRIÈRE la lettre. Elle vit dans `SanzaLogo`, d'où la tirent
          déjà la topbar, l'onboarding, la 404 et l'écran de chargement.

          Les décalages d'écho ne sont définis que là et ne se recopient nulle
          part : reproduire le dessin à la main ici aurait créé un deuxième logo
          à maintenir.
        */}
        <header className="vit-nav">
          <div className="vit-marque">
            <SanzaLogo size={22} />
          </div>

          {/*
            DEUX DE CES QUATRE ENTRÉES ONT UNE PAGE, LES DEUX AUTRES NON. La
            maquette les pose en ancres — `#produit`, `#programmes`,
            `#financeurs`, `#tarifs` — qui ne désignent rien : elle n'avait pas
            à savoir ce que le site contient.

            « Pour les programmes » et « Pour les financeurs » mènent aux pages
            qui existent déjà, `/accelerateurs` et `/institutions`. Elles portent
            encore l'ancien habillage, mais elles répondent, et c'est ce que ces
            deux intitulés promettent.

            « Produit » et « Tarifs » n'ont aucune page. `/abonnement` n'en est
            pas une : c'est l'écran d'abonnement échu, derrière l'authentification,
            qui renvoie au tableau de bord tant que rien n'a expiré — l'ancienne
            nav y envoyait « Tarifs », et c'était déjà trompeur. Ces deux-là
            restent donc des intitulés sans lien, comme les flèches des bénéfices.
          */}
          <nav aria-label="Sections du site">
            <span data-attente="">Produit</span>
            <Link href="/accelerateurs">Pour les programmes</Link>
            <Link href="/institutions">Pour les financeurs</Link>
            <span data-attente="">Tarifs</span>
          </nav>

          <span className="vit-espace" />

          <a className="vit-lien-discret" href={`${APP}/v2/connexion`}>
            Se connecter
          </a>
          <a className="vit-cta" href={`${APP}/v2/inscription`}>
            Commencer gratuitement
          </a>
        </header>

        {/* 2 — Hero centré */}
        <section className="vit-hero">
          <span className="vit-pilule">
            Data room · Préparation · Mise en relation investisseurs
          </span>

          <h1>Levez des fonds sans jamais perdre le fil de votre dossier.</h1>

          <p className="vit-sous-titre">
            Data room sécurisée, préparation guidée selon les exigences réelles
            des financeurs, et mise en relation quand vous êtes prêt. Tout au
            même endroit.
          </p>

          <div className="vit-hero-actions">
            <a
              className="vit-cta"
              data-taille="hero"
              href={`${APP}/v2/inscription`}
            >
              Commencer gratuitement
            </a>
            <a className="vit-cta-ligne" href="#demo">
              Réserver une démo
            </a>
          </div>

          <p className="vit-rassurance">
            <span>Sans carte bancaire</span>
            <i aria-hidden="true">·</i>
            <span>Data room prête en 14 jours</span>
            <i aria-hidden="true">·</i>
            <span>Vos documents restent sous votre contrôle</span>
          </p>

          {/*
            3 — Aperçu produit.

            IL APPARTIENT AU HERO, il n'en est pas une section voisine. La
            source le pose dans le même conteneur, après la ligne de
            réassurance : c'est de là qu'il tient son écart de 20 px, son
            centrage et le dégradé qui passe derrière lui.

            SA COUPURE EST L'EFFET RECHERCHÉ, pas un oubli. Il n'a ni bordure
            ni rayon en bas, et le hero ne laisse aucune marge sous lui : la
            barre de logos qui suivra au lot 4 vient donc le trancher net,
            comme une fenêtre dont on ne voit que le haut. Y ajouter un rayon
            bas ou une marge le décollerait et casserait l'illusion.

            L'ombre est portée VERS LE HAUT (décalage négatif) — l'unique
            ombre de la page, et la seule chose qui détache la carte du
            dégradé une fois son bas absorbé.

            « DOSSIER PRÊT » S'ÉCARTE DE LA SOURCE, QUI DIT « READINESS ». Seule
            divergence de texte de toute la page, sur décision du fondateur : le
            terme anglais n'a pas sa place sur une page française, et l'app dit
            déjà « dossier prêt ». Voir `docs/site/DECISIONS.md`.
          */}
          <div className="vit-apercu">
            <div className="vit-apercu-tete">
              <b>Levée Seed 2026 · CoolBricks</b>
              <span className="vit-jeton-pret">Dossier prêt 82 %</span>
            </div>

            <div className="vit-apercu-tuiles">
              <div>
                <b>Data room</b>
                <span>30 pièces · 4 dossiers · NDA actif</span>
              </div>
              <div>
                <b>Préparation</b>
                <span>18 / 24 exigences prêtes</span>
              </div>
              <div>
                <b>Investisseurs</b>
                <span>3 en due diligence · 2 demandes</span>
              </div>
            </div>
          </div>
        </section>

        {/*
          4 — Barre de logos.

          C'EST ELLE QUI TRANCHE L'APERÇU du hero : son filet supérieur passe
          exactement au ras du bas de la carte, dont la bordure s'arrête là.

          LES CINQ NOMS SONT DES EXEMPLES DE MAQUETTE, pas des clients établis.
          « Ils font confiance à Sanza » est une affirmation publique sur des
          tiers nommés — Banque Atlantique, BOAD et les autres doivent être
          vérifiés, et leurs logos obtenus, AVANT que cette page remplace
          l'accueil. Le handoff prévoit d'ailleurs de remplacer ces noms par les
          vrais logos en niveaux de gris.
        */}
        <section className="vit-confiance" aria-label="Références clients">
          <span className="vit-sur-titre">Ils font confiance à Sanza</span>
          <span>Savane Accelerator</span>
          <span>Banque Atlantique</span>
          <span>Impact Partners</span>
          <span>BOAD</span>
          <span>Teranga Capital</span>
        </section>

        {/*
          5 — Les trois bénéfices, texte et capture en alternance.

          LA DEUXIÈME INVERSE L'ORDRE : capture à gauche, texte à droite. C'est
          la source qui l'impose, et c'est ce qui donne son rythme à la suite.
          Sous 900 px l'alternance n'a plus de sens une fois la grille empilée —
          le texte repasse alors devant sa capture, partout.

          LES TROIS FLÈCHES NE MÈNENT NULLE PART, ET C'EST VOULU. Elles
          appellent la page Produit, qui reste à écrire : la brancher sur `#produit`
          l'aurait faite pointer sur la section qu'on lit déjà, et sur une page
          inexistante le jour où l'ancre disparaîtrait. Même arbitrage qu'au pied
          de page — un intitulé qui attend sa destination plutôt qu'un lien qui
          ment.
        */}
        <div className="vit-benefices">
          <section className="vit-benefice">
            <div>
              <span className="vit-amorce">Data room</span>
              <h2>Une data room qui rassure dès la première visite</h2>
              <p>
                Permissions par dossier, NDA avant accès, filigrane, journal
                d&apos;audit complet. Vous savez qui a vu quoi, quand — et vous
                coupez l&apos;accès en un clic.
              </p>
              <span className="vit-lien-fleche" data-attente="">
                Découvrir la data room →
              </span>
            </div>
            <CaptureDataRoom />
          </section>

          <section className="vit-benefice">
            <CapturePreparation />
            <div>
              <span className="vit-amorce">Préparation</span>
              <h2>Vous savez toujours quoi faire ensuite</h2>
              <p>
                Checklists par pays et par type de financeur — OHADA compris.
                Chaque pièce déposée fait monter votre score « Dossier prêt »,
                visible par vous seul.
              </p>
              <span className="vit-lien-fleche" data-attente="">
                Voir la préparation guidée →
              </span>
            </div>
          </section>

          <section className="vit-benefice">
            <div>
              <span className="vit-amorce">Mise en relation</span>
              <h2>Présenté aux financeurs quand vous êtes prêt</h2>
              <p>
                Dealrooms privées, demandes d&apos;accès que vous approuvez une à
                une. Rien ne circule sans votre accord explicite.
              </p>
              <span className="vit-lien-fleche" data-attente="">
                Comment ça marche →
              </span>
            </div>
            <CaptureDealroom />
          </section>
        </div>

        {/*
          6 — Témoignage et métriques.

          RIEN ICI N'EST VÉRIFIÉ. Aminata Koné, CoolBricks, les cinq semaines de
          due diligence, les 250 entreprises, les 12 pays : ce sont les valeurs
          de la maquette, écrites pour montrer la mise en page. Publiées telles
          quelles, elles seraient un témoignage inventé attribué à une personne
          nommée, et quatre chiffres d'entreprise invérifiables.

          La page n'est pas indexée et ne sert pas d'accueil, donc rien n'est
          publié aujourd'hui. Mais tout ce bloc doit être remplacé par un vrai
          client, une vraie citation recueillie avec son accord, et des chiffres
          qu'on peut soutenir — avant le remplacement, pas après.
        */}
        <section className="vit-preuve" aria-label="Témoignage client et chiffres">
          <div className="vit-temoignage">
            <p>
              « Avant Sanza, chaque investisseur recevait un Drive différent.
              Aujourd&apos;hui notre dossier est prêt en permanence — la due
              diligence de notre Seed a pris 5 semaines au lieu de 4 mois. »
            </p>
            <div className="vit-temoin">
              <span aria-hidden="true">AK</span>
              <div>
                <b>Aminata Koné</b>
                <span>CEO, CoolBricks · Levée Seed 500 K€ — Abidjan</span>
              </div>
            </div>
          </div>

          <div className="vit-metriques">
            <div>
              <b>−60 %</b>
              <span>de temps passé en due diligence</span>
            </div>
            <div>
              <b>14 jours</b>
              <span>pour une data room prête</span>
            </div>
            <div>
              <b>250+</b>
              <span>entreprises accompagnées</span>
            </div>
            <div>
              <b>12 pays</b>
              <span>Afrique de l&apos;Ouest et centrale</span>
            </div>
          </div>
        </section>

        {/*
          7 — Bande sécurité.

          Elle porte l'ancre `#securite` que le pied de page vise depuis le
          lot 1 — c'était la destination annoncée, la voici.
        */}
        <section className="vit-securite" id="securite">
          <span className="vit-sur-titre">Sécurité</span>
          <span>Chiffrement AES-256</span>
          <span>Journal d&apos;audit complet</span>
          <span>NDA &amp; filigrane natifs</span>
          <span>Vous restez propriétaire de vos données</span>
        </section>

        {/*
          8 — Appel final.

          « VOIR LES TARIFS » N'A PAS DE PAGE OÙ ALLER. La grille tarifaire est
          hors périmètre du handoff, et l'ancre `#tarifs` de la nav ne désigne
          rien non plus. Le bouton garde donc son dessin sans destination, comme
          les flèches du lot 5 — c'est le seul des deux qui manque, « Créer mon
          espace » menant bien à l'inscription.
        */}
        <section className="vit-final">
          <div>
            <h2>
              Commencez gratuitement. Passez au niveau supérieur quand la levée
              démarre.
            </h2>
            <p>
              Plan Ready gratuit — data room et préparation incluses. Sans
              engagement, sans carte bancaire.
            </p>
          </div>
          <div className="vit-final-actions">
            <a className="vit-cta" data-taille="final" href={`${APP}/v2/inscription`}>
              Créer mon espace
            </a>
            <span className="vit-cta-clair" data-attente="">
              Voir les tarifs
            </span>
          </div>
        </section>

        {/*
          9 — Pied de page.

          LES DEUX PREMIERS LIENS NE MÈNENT NULLE PART, ET C'EST DÉLIBÉRÉ. La
          source est une maquette : ses `<a>` n'ont pas de destination. Aucune
          page « Confidentialité » ni « Sécurité » n'existe sur le site — les
          brancher sur des adresses inventées produirait deux 404 depuis le pied
          de page, sur les liens mêmes qui doivent rassurer.

          « Sécurité » pointe donc vers la section sécurité de cette page, qui
          existera au lot 7. « Confidentialité » attend sa page ; le lien est
          inerte plutôt que faux, et se branchera le jour où elle sera écrite.
        */}
        <footer className="vit-pied">
          <span>© 2026 Sanza</span>
          <nav aria-label="Liens légaux">
            <span className="vit-pied-attente">Confidentialité</span>
            <a href="#securite">Sécurité</a>
            <a href="mailto:contact@sanza.africa">Contact</a>
          </nav>
        </footer>
      </div>
    </div>
  );
}
