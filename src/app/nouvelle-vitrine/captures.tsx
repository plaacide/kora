/**
 * Les trois captures produit des sections bénéfices.
 *
 * CE NE SONT PAS DES VIDÉOS. Ni fichier, ni GIF, ni bibliothèque d'animation :
 * trois maquettes de l'application animées en CSS pur, sur une boucle de 14 s
 * partagée. Le chrome vidéo en bas (libellé, « 0:14 », barre de progression)
 * est un décor qui annonce ce qu'elles remplaceront un jour — de vraies
 * captures d'écran filmées, dans le même cadre de 280 px.
 *
 * LES 14 SECONDES SONT UNE CONTRAINTE, PAS UN RÉGLAGE. Chaque scénario est
 * écrit en pourcentages de cette durée : le clic tombe à 26 %, les documents
 * arrivent à 33-39 %, le journal d'audit s'affiche de 57 à 86 %. Changer la
 * durée d'une seule animation désaligne le curseur de ce qu'il est censé
 * cliquer.
 *
 * Elles sortent de `page.tsx` parce qu'elles pèsent trois fois la page à elles
 * seules, et qu'aucune n'a d'état : ce sont des composants serveur, sans une
 * ligne de JavaScript envoyée au navigateur.
 *
 * Source : `sanza_handoff/Website sanza_v2/site-vitrine-2a.html` et son
 * annexe `captures-video-produit.html`.
 */

/** Les trois points inertes de la barre de titre. */
function Points() {
  return (
    <>
      <i className="vit-point" />
      <i className="vit-point" />
      <i className="vit-point" />
    </>
  );
}

/**
 * Le bandeau sombre du bas, commun aux trois.
 *
 * Sa barre de progression court sur les mêmes 14 s que la scène : c'est elle
 * qui donne à la boucle son air de lecture.
 */
function Chrome({ libelle }: { libelle: string }) {
  return (
    <div className="vit-chrome">
      <div className="vit-chrome-tete">
        <span>▶ Aperçu produit — {libelle}</span>
        <span>0:14</span>
      </div>
      <div className="vit-chrome-piste">
        <div className="vit-chrome-barre" />
      </div>
    </div>
  );
}

/** Le curseur qui traverse la scène, et l'anneau de son clic. */
function Curseur({ scenario }: { scenario: "a" | "b" | "c" }) {
  return (
    <>
      <div className="vit-anneau" data-scenario={scenario} aria-hidden="true" />
      <div className="vit-curseur" data-scenario={scenario} aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 24 24">
          <path
            d="M5 2l14 7.5-6.2 1.8L9.5 18z"
            fill="#101828"
            stroke="#fff"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </>
  );
}

/**
 * Data room — on clique le dossier « 02 Finances », trois pièces arrivent en
 * cascade, puis le journal d'audit signale une consultation.
 */
export function CaptureDataRoom() {
  return (
    <div className="vit-capture" data-scenario="a" role="img" aria-label="Aperçu de la data room : un dossier s'ouvre, ses pièces apparaissent, et le journal d'audit signale qu'un financeur a consulté la cap table.">
      <div className="vit-scene" aria-hidden="true">
        <div className="vit-fenetre" data-largeur="84">
          <div className="vit-fenetre-tete">
            <Points />
            <b>Data room · CoolBricks</b>
            <span className="vit-espace" />
            <span className="vit-jeton-pret" data-taille="mini">
              NDA actif
            </span>
          </div>

          <div className="vit-dr">
            <div className="vit-dr-dossiers">
              <span>
                01 Juridique<i>8</i>
              </span>
              <span data-ouvert="">
                02 Finances<i>12</i>
              </span>
              <span>
                03 Équipe<i>4</i>
              </span>
              <span>
                04 Marché<i>6</i>
              </span>
            </div>

            <div className="vit-dr-pieces">
              <span className="vit-piece" data-rang="1">
                <i className="vit-format" data-format="pdf">
                  PDF
                </i>
                États financiers 2023–2025
                <span className="vit-espace" />
                <i className="vit-mention">Filigrane</i>
              </span>
              <span className="vit-piece" data-rang="2">
                <i className="vit-format" data-format="xls">
                  XLS
                </i>
                Cap table — mars 2026
                <span className="vit-espace" />
                <i className="vit-mention">Filigrane</i>
              </span>
              <span className="vit-piece" data-rang="3">
                <i className="vit-format" data-format="pdf">
                  PDF
                </i>
                Rapport d&apos;audit KPMG
                <span className="vit-espace" />
                <i className="vit-mention">Lecture seule</i>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="vit-journal" aria-hidden="true">
        <i />
        Journal d&apos;audit — Banque Atlantique a consulté « Cap table » · il y
        a 2 min
      </div>

      <Curseur scenario="a" />
      <Chrome libelle="Data room" />
    </div>
  );
}

/**
 * Préparation — on dépose le pacte d'associés : la ligne bascule de « À
 * déposer » à « Déposé à l'instant », le compteur passe à 19/24 et la jauge
 * monte de 58 à 79 %.
 */
export function CapturePreparation() {
  return (
    <div className="vit-capture" data-scenario="b" role="img" aria-label="Aperçu de la préparation : une pièce manquante est déposée, le compteur d'exigences prêtes passe de 18 à 19 sur 24 et la jauge de readiness monte de 58 à 79 %.">
      <div className="vit-scene" aria-hidden="true">
        <div className="vit-fenetre" data-largeur="82">
          <div className="vit-fenetre-tete">
            <Points />
            <b>Préparation · Levée Seed 2026</b>
            <span className="vit-espace" />
            <span className="vit-bascule" data-temps="34">
              <span className="vit-avant">
                <i className="vit-jeton-cours">18 / 24 prêtes</i>
              </span>
              <span className="vit-apres">
                <i className="vit-jeton-pret" data-taille="mini">
                  19 / 24 prêtes
                </i>
              </span>
            </span>
          </div>

          <div className="vit-prep">
            <div className="vit-jauge">
              <span>Readiness</span>
              <span className="vit-jauge-piste">
                <span className="vit-jauge-barre" />
              </span>
            </div>

            <span className="vit-exigence">
              <i className="vit-coche">✓</i>États financiers 2023–2025
              <span className="vit-espace" />
              <i className="vit-note">Demandé par Banque Atlantique</i>
            </span>
            <span className="vit-exigence">
              <i className="vit-coche">✓</i>Cap table à jour
              <span className="vit-espace" />
              <i className="vit-note">Requis · Capital</i>
            </span>

            <span className="vit-bascule" data-temps="34">
              <span className="vit-avant vit-exigence" data-manquante="">
                <i className="vit-puce">●</i>Pacte d&apos;associés
                <span className="vit-espace" />
                <i className="vit-note" data-ton="attente">
                  À déposer
                </i>
              </span>
              <span className="vit-apres vit-exigence">
                <i className="vit-coche">✓</i>Pacte d&apos;associés
                <span className="vit-espace" />
                <i className="vit-note">Déposé à l&apos;instant</i>
              </span>
            </span>
          </div>
        </div>
      </div>

      <Curseur scenario="b" />
      <Chrome libelle="Préparation guidée" />
    </div>
  );
}

/**
 * Dealroom — une demande d'accès est approuvée, et une nouvelle arrive
 * pendant qu'on regarde.
 */
export function CaptureDealroom() {
  return (
    <div className="vit-capture" data-scenario="c" role="img" aria-label="Aperçu du dealroom : une demande d'accès investisseur est approuvée, et une nouvelle demande arrive ensuite.">
      <div className="vit-scene" aria-hidden="true">
        <div className="vit-fenetre" data-largeur="84">
          <div className="vit-fenetre-tete">
            <Points />
            <b>Dealroom · Levée Seed 2026</b>
            <span className="vit-espace" />
            <span className="vit-jeton-cours">3 investisseurs</span>
          </div>

          <div className="vit-dl">
            <span className="vit-investisseur">
              <i className="vit-sigle">TC</i>Teranga Capital
              <span className="vit-espace" />
              <i className="vit-jeton-vivant">
                <b />
                Due diligence
              </i>
            </span>

            <span className="vit-investisseur" data-attente="">
              <i className="vit-sigle" data-ton="orange">
                IP
              </i>
              Impact Partners
              <span className="vit-espace" />
              <span className="vit-bascule" data-temps="42">
                <span className="vit-avant vit-arbitrage">
                  <i>Refuser</i>
                  <b>Approuver</b>
                </span>
                <span className="vit-apres">
                  <i className="vit-jeton-pret" data-taille="mini">
                    ✓ Accès accordé
                  </i>
                </span>
              </span>
            </span>

            <span className="vit-investisseur" data-tardive="">
              <i className="vit-sigle">BA</i>Banque Atlantique
              <span className="vit-espace" />
              <i className="vit-jeton-cours">Nouvelle demande d&apos;accès</i>
            </span>
          </div>
        </div>
      </div>

      <Curseur scenario="c" />
      <Chrome libelle="Dealroom" />
    </div>
  );
}
