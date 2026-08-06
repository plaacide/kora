import { montantCourt } from "@/features/v2/domain/engagements";
import {
  nombreEntreprises,
  nombrePretes,
  preparationMoyenne,
  type Priorite,
  priorites,
  SEUIL_PRETE,
  volumeRecherche,
} from "@/features/v2/domain/portefeuille";
import { v2Routes } from "@/features/v2/navigation/routes";
import { listerCohortes } from "@/features/v2/server/cohortes";
import {
  type LigneLue,
  lirePortefeuille,
} from "@/features/v2/server/portefeuille";
import { BarreEtats } from "@/features/v2/ui/BarreEtats";
import { Standalone } from "@/features/v2/ui/Shell";

/** Écran 06 — aucune activité encore. AUCUN indicateur à zéro n'est affiché. */
function Vide() {
  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Portefeuille</h1>
        </div>
      </div>
      <section className="v2-card v2-prog-empty">
        <h2>
          Vos indicateurs attendent les premières activités de vos entreprises
        </h2>
        <p>
          Dès qu’une entreprise rejoint une cohorte et entame sa préparation,
          son avancement apparaît ici.
        </p>
        <div>
          <a className="v2-btn" href={v2Routes.programme.cohortes.list}>
            Voir mes cohortes
          </a>
        </div>
      </section>
    </>
  );
}

interface Chiffre {
  titre: string;
  valeur: string;
  detail: string;
}

/**
 * Les indicateurs, et SEULEMENT ceux qui reposent sur une donnée réelle.
 *
 * Chacun peut manquer à l'appel : une préparation qu'aucune opération ne
 * mesure, un volume qu'aucune n'a renseigné. On n'affiche alors pas la carte
 * plutôt que d'écrire « 0 % » ou « 0 € », qui se lisent comme un résultat
 * alors que ce sont des absences.
 */
function chiffres(lignes: readonly LigneLue[], cohortes: number): Chiffre[] {
  const cartes: Chiffre[] = [
    {
      titre: "Entreprises",
      valeur: String(nombreEntreprises(lignes)),
      detail: cohortes > 1 ? `${cohortes} cohortes actives` : "1 cohorte active",
    },
  ];

  const pretes = nombrePretes(lignes);
  if (pretes > 0) {
    cartes.push({
      titre: "Prêtes",
      valeur: String(pretes),
      detail: `préparation ≥ ${SEUIL_PRETE} %`,
    });
  }

  const moyenne = preparationMoyenne(lignes);
  if (moyenne !== null) {
    cartes.push({
      titre: "Préparation moyenne",
      valeur: `${moyenne} %`,
      // LA TENDANCE MANQUE, ET C'EST ASSUMÉ. La maquette dit « +6 pts sur
      // 30 jours » ; `cohort_snapshots` porte la bonne colonne mais reste
      // vide, faute d'un relevé qui l'alimente. Un écart inventé serait pire
      // qu'un écart absent.
      detail: `sur ${lignes.filter((l) => l.readiness !== null).length} opérations`,
    });
  }

  const volumes = volumeRecherche(lignes);
  const dominant = volumes[0];
  if (dominant) {
    const autres = volumes.length - 1;
    cartes.push({
      titre: "Volume recherché",
      // JAMAIS DE SOMME ENTRE DEVISES — rien ici ne convertit. La devise
      // dominante est affichée, et les autres annoncées sans être mêlées.
      valeur: `${montantCourt(dominant.montant)} ${dominant.devise}`,
      detail:
        autres > 0
          ? `${dominant.operations} opérations · ${autres} autre${autres > 1 ? "s" : ""} devise${autres > 1 ? "s" : ""}`
          : `${dominant.operations} opération${dominant.operations > 1 ? "s" : ""} renseignée${dominant.operations > 1 ? "s" : ""}`,
    });
  }

  return cartes;
}

/** « CoolBricks » → « CB ». Deux lettres, jamais plus. */
function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  return (
    mots
      .slice(0, 2)
      .map((m) => m[0]?.toUpperCase() ?? "")
      .join("") || "—"
  );
}

const TONS = ["orange", "blue", "green", "amber", "neutral"] as const;

/**
 * Une couleur stable par entreprise.
 *
 * Décorative, mais TIRÉE DU NOM et non du rang : une pastille qui change de
 * couleur parce qu'une autre entreprise est passée devant donnerait
 * l'impression qu'un statut a bougé.
 */
function ton(nom: string): (typeof TONS)[number] {
  let somme = 0;
  for (const c of nom) somme = (somme + c.charCodeAt(0)) % 997;
  return TONS[somme % TONS.length]!;
}

function Priorites({ liste }: { liste: readonly Priorite[] }) {
  return (
    <>
      <div className="v2-nav-label" style={{ padding: "0 0 8px" }}>
        À traiter aujourd’hui
      </div>
      <div className="v2-card" style={{ overflow: "hidden" }}>
        {liste.map((p) => (
          <div className="v2-priorite" key={p.startupOrg}>
            <span className="v2-pastille" data-ton={ton(p.nom)}>
              {initiales(p.nom)}
            </span>
            <div>
              <b>{p.nom}</b>
              <div>
                {p.manques} exigence{p.manques > 1 ? "s" : ""} à fournir
              </div>
              <div>
                {p.preparation === null
                  ? "préparation pas encore mesurée"
                  : `préparation ${p.preparation} %`}
              </div>
            </div>
            <a
              className="v2-btn"
              data-variant="secondary"
              href={v2Routes.programme.cohortes.list}
            >
              Voir
            </a>
          </div>
        ))}
      </div>
      {/* TROIS À LA FOIS, et l'écran le dit. Une quatrième ligne ferait de la
          réponse une liste, et d'une liste on ne fait rien. */}
      <p className="v2-dr-note">
        Trois priorités à la fois. Les suivantes apparaîtront lorsque celles-ci
        seront traitées.
      </p>
    </>
  );
}

/** Écran 07 — « qui dois-je contacter aujourd'hui ? ». */
function Rempli({
  cohortes,
  lignes,
}: {
  cohortes: number;
  lignes: readonly LigneLue[];
}) {
  const cartes = chiffres(lignes, cohortes);
  const liste = priorites(lignes);

  return (
    <>
      <div className="v2-prog-head">
        <div>
          <h1>Portefeuille</h1>
          <p>Toutes cohortes confondues</p>
        </div>
        <span className="v2-spacer" />
        <nav>
          {/* L'export bailleur existe depuis la V1 et n'était relié à rien :
              le bouton de la maquette ne menait nulle part. */}
          <a
            className="v2-btn"
            data-variant="secondary"
            href="/api/portefeuille/export"
          >
            Rapport bailleur
          </a>
        </nav>
      </div>

      <div className="v2-chiffres">
        {cartes.map((chiffre) => (
          <div className="v2-card v2-dr-chiffre" key={chiffre.titre}>
            <div className="v2-nav-label" style={{ padding: "0 0 6px" }}>
              {chiffre.titre}
            </div>
            <b>{chiffre.valeur}</b>
            <small>{chiffre.detail}</small>
          </div>
        ))}
      </div>

      {liste.length > 0 && <Priorites liste={liste} />}
    </>
  );
}

export default async function PortefeuillePage({
  searchParams,
}: {
  searchParams: Promise<{ etat?: string }>;
}) {
  const [{ etat }, lignes, cohortes] = await Promise.all([
    searchParams,
    lirePortefeuille(),
    listerCohortes(),
  ]);

  // `?etat=vide` force l'écran 06 pour le relire ; sans donnée réelle, il
  // s'impose de lui-même.
  const vide = etat === "vide" || lignes.length === 0;
  const actives = cohortes.filter((c) => !c.archivee).length;

  return (
    <Standalone search={false} title="Portefeuille">
      {vide ? <Vide /> : <Rempli cohortes={actives} lignes={lignes} />}
      <BarreEtats
        etats={[
          {
            actif: vide,
            href: `${v2Routes.programme.portefeuille}?etat=vide`,
            label: "06 · vide",
          },
          {
            actif: !vide,
            href: v2Routes.programme.portefeuille,
            label: "07 · rempli",
          },
        ]}
      />
    </Standalone>
  );
}
