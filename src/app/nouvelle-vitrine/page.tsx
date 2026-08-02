import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";

import {
  CaptureDataRoom,
  CaptureDealroom,
  CapturePreparation,
} from "./captures";
import "./vitrine.css";

/**
 * La nouvelle vitrine — direction 2a.
 *
 * Source de vérité : `sanza_handoff/Website sanza_v2/site-vitrine-2a.html`,
 * dont le brief impose de reproduire le design à l'identique et interdit de
 * réinterpréter. Toute valeur vient de là ; rien n'est arrondi ni dérivé.
 *
 * POURQUOI UNE ROUTE À PART, et non `app/page.tsx`. La page se construit
 * section par section : la poser directement à la racine laisserait l'accueil
 * de `sanza.africa` à moitié fait entre deux livraisons. Elle prendra la place
 * de l'actuelle quand les neuf sections y seront, d'un seul remplacement.
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

export const metadata: Metadata = {
  title: "Sanza — Levez des fonds sans jamais perdre le fil de votre dossier",
  description:
    "Data room sécurisée, préparation guidée selon les exigences réelles des financeurs, et mise en relation quand vous êtes prêt. Tout au même endroit.",
  // Page en construction : elle ne doit pas être indexée avant de remplacer
  // l'accueil, sinon deux versions du même contenu se feraient concurrence.
  robots: { index: false, follow: false },
};

/** Là où mènent les deux points d'entrée pendant la bêta. */
const APP = "https://v2.sanza.africa";

export default function NouvelleVitrine() {
  return (
    <div className={`vit ${titre.variable} ${texte.variable}`}>
      <div className="vit-page">
        {/* 1 — Nav */}
        <header className="vit-nav">
          <div className="vit-marque">
            <span aria-hidden="true">S</span>
            <b>Sanza</b>
          </div>

          <nav aria-label="Sections du site">
            <a href="#produit">Produit</a>
            <a href="#programmes">Pour les programmes</a>
            <a href="#financeurs">Pour les financeurs</a>
            <a href="#tarifs">Tarifs</a>
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
          */}
          <div className="vit-apercu">
            <div className="vit-apercu-tete">
              <b>Levée Seed 2026 · CoolBricks</b>
              <span className="vit-jeton-pret">Readiness 82 %</span>
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
              <a className="vit-lien-fleche" href="#produit">
                Découvrir la data room →
              </a>
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
                Chaque pièce déposée fait monter votre score de readiness,
                visible par vous seul.
              </p>
              <a className="vit-lien-fleche" href="#produit">
                Voir la préparation guidée →
              </a>
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
              <a className="vit-lien-fleche" href="#produit">
                Comment ça marche →
              </a>
            </div>
            <CaptureDealroom />
          </section>
        </div>

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
