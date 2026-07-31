"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createV2Access,
  revokeV2Access,
} from "@/app/v2/(workspace)/operations/[operationId]/access/actions";
import {
  correspondAuFiltre,
  etatAcces,
  etatLabel,
  perimetreLabel,
  type FiltreAcces,
} from "@/features/v2/domain/access";
import { accessLevelLabel, initials } from "@/features/v2/domain/activity";
import type { AccessRow, ShareFolder } from "@/features/v2/server/access";
import { EmptyMedallion } from "./EmptyArt";
import { Icon } from "./Icon";

/** « 12 juil. 2026 » — même format que le reste du produit. */
function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** « il y a 2 h », « hier », « le 12 juil. » — pour la dernière activité. */
function depuis(value: string, maintenant: Date): string {
  const ecart = maintenant.getTime() - new Date(value).getTime();
  const heures = Math.floor(ecart / 3_600_000);
  if (heures < 1) return "à l’instant";
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} j`;
  return `le ${shortDate(value)}`;
}

/**
 * Les quatre étapes, nommées UNE fois.
 *
 * Elles vivaient dans deux tableaux séparés — les liens disaient `verify`, la
 * table de correspondance connaissait `review`. La dernière étape retombait
 * donc sur « étape inconnue », et le fondateur qui cliquait « Continuer →
 * Vérification » se retrouvait renvoyé au premier écran. Rien ne cassait :
 * l'étape inconnue valait 1, en silence.
 *
 * Le type ci-dessous ferme la porte : un nom d'étape qui n'existe pas ne
 * compile plus.
 */
const ETAPES = [
  ["recipient", "Destinataire"],
  ["content", "Contenu"],
  ["security", "Sécurité"],
  ["review", "Vérification"],
] as const;

type Etape = (typeof ETAPES)[number][0];

const wizardSteps = ETAPES.map(([, label]) => label);
const stepOrder = Object.fromEntries(
  ETAPES.map(([nom], index) => [nom, index + 1]),
) as Record<string, number>;

function AccessStepper({ current }: { current: number }) {
  return (
    <ol className="v2-access-steps" aria-label="Étapes de création d’un accès">
      {wizardSteps.map((label, index) => {
        const number = index + 1;
        return (
          <li
            className={number < current ? "is-done" : number === current ? "is-current" : ""}
            key={label}
          >
            {index > 0 && <i />}
            <span>{number < current ? "✓" : number}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * La carte d'une étape.
 *
 * L'action de pied est soit un LIEN (on avance d'une étape), soit un BOUTON
 * (on exécute — dernière étape). Les deux ne se confondent pas : un lien qui
 * déclenche une écriture serait rejoué par un simple retour arrière.
 */
function WizardCard({
  children,
  title,
  description,
  backHref,
  nextHref,
  nextLabel,
  nextDisabled = false,
  onConfirm,
  confirmLabel,
  confirmDisabled = false,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  backHref: string;
  nextHref?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
}) {
  return (
    <section className="v2-wizard-card">
      <header>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="v2-wizard-body">{children}</div>
      <footer>
        <Link href={backHref}>{backHref === "?" ? "Annuler" : "← Retour"}</Link>
        <div>
          {onConfirm ? (
            <button
              className="v2-btn"
              disabled={confirmDisabled}
              onClick={onConfirm}
              type="button"
            >
              {confirmLabel}
            </button>
          ) : (
            nextHref && (
              <Link
                aria-disabled={nextDisabled}
                className="v2-btn"
                data-disabled={nextDisabled}
                href={nextDisabled ? "#" : nextHref}
              >
                {nextLabel}
              </Link>
            )
          )}
        </div>
      </footer>
    </section>
  );
}

/** Ce que chaque niveau autorise, dit au fondateur au moment de choisir. */
const NIVEAUX: Array<[string, string, string]> = [
  ["watermark", "Lecture filigranée", "Chaque page porte le nom du lecteur. Aucun téléchargement."],
  ["view", "Lecture seule", "Consultation à l’écran, sans filigrane ni téléchargement."],
  ["download", "Téléchargement", "L’invité peut récupérer les fichiers d’origine."],
];

export function AccessWizard({
  step,
  operationId,
  operationName,
  folders,
  draft,
}: {
  step: string;
  operationId: string;
  operationName: string;
  folders: readonly ShareFolder[];
  draft: { email: string; level: string; nda: string; expires: string; dossiers: string };
}) {
  const current = stepOrder[step] ?? 1;

  return (
    <div className="v2-access-wizard">
      <div className="v2-wizard-heading">
        <span>Partage et accès /</span>
        <strong>{operationName}</strong>
        <em>Vous allez ouvrir cette data room à un invité.</em>
        <Link href="?">×</Link>
      </div>
      <AccessStepper current={current} />
      {current === 1 && <RecipientStep draft={draft} />}
      {current === 2 && <ContentStep draft={draft} folders={folders} />}
      {current === 3 && <SecurityStep draft={draft} />}
      {current === 4 && (
        <ReviewStep draft={draft} folders={folders} operationId={operationId} />
      )}
    </div>
  );
}

/** Les valeurs déjà saisies voyagent d'une étape à l'autre par l'URL. */
function lien(
  etape: Etape,
  draft: { email: string; level: string; nda: string; expires: string; dossiers: string },
  patch: Partial<{ email: string; level: string; nda: string; expires: string; dossiers: string }> = {},
): string {
  const valeurs = { ...draft, ...patch };
  const params = new URLSearchParams({ share: etape });
  for (const [cle, valeur] of Object.entries(valeurs)) {
    if (valeur) params.set(cle, valeur);
  }
  return `?${params}`;
}

function RecipientStep({
  draft,
}: {
  draft: { email: string; level: string; nda: string; expires: string; dossiers: string };
}) {
  const [email, setEmail] = useState(draft.email);

  return (
    <WizardCard
      title="À qui donnez-vous accès ?"
      description="L’accès est nominatif : chaque personne est identifiée et journalisée."
      backHref="?"
      nextHref={lien("content", draft, { email })}
      nextLabel="Continuer → Contenu"
      nextDisabled={!email.includes("@")}
    >
      <label className="v2-field">
        <span>E-mail professionnel</span>
        <span className="v2-control">
          <input
            onChange={(event) => setEmail(event.target.value)}
            placeholder="prenom.nom@fonds.com"
            type="email"
            value={email}
          />
        </span>
      </label>
      <p className="v2-panel-note">
        L’invitation part à cette adresse et à elle seule : un lien transféré à
        quelqu’un d’autre est refusé.
      </p>
    </WizardCard>
  );
}

/**
 * Écran 21 — le choix du périmètre.
 *
 * Deux modes, et la différence n'est pas cosmétique : « Tous les dossiers
 * autorisés » n'enregistre AUCUN périmètre, ce qui vaut « tout ce qui existe »
 * — y compris les dossiers créés après l'envoi. Une sélection fige au
 * contraire la liste : un dossier ajouté demain ne s'ouvrira pas tout seul.
 */
function ContentStep({
  draft,
  folders,
}: {
  draft: { email: string; level: string; nda: string; expires: string; dossiers: string };
  folders: readonly ShareFolder[];
}) {
  // `dossiers` vide = mode « tous ». C'est exactement ce que la base entend
  // par un périmètre absent : les deux représentations n'ont pas à diverger.
  const [tous, setTous] = useState(!draft.dossiers);
  const [choisis, setChoisis] = useState<string[]>(() =>
    draft.dossiers ? draft.dossiers.split(",").filter(Boolean) : [],
  );

  const retenus = tous ? folders.map((folder) => folder.id) : choisis;
  const ouverts = folders.filter((folder) => retenus.includes(folder.id));
  const pieces = ouverts.reduce((somme, folder) => somme + folder.documentCount, 0);

  // Deux façons pour une pièce de ne pas être vue, à ne pas confondre : elle
  // est dans un dossier non coché, ou elle est masquée dans un dossier ouvert.
  // La seconde se décide dans la data room et se rappelle ici.
  const nonOuvertes =
    folders.reduce((somme, folder) => somme + folder.documentCount, 0) - pieces;
  const exceptions = ouverts.flatMap((folder) =>
    folder.hidden.map((nom) => ({ nom, dossier: folder.name })),
  );

  function basculer(id: string) {
    setChoisis((liste) =>
      liste.includes(id) ? liste.filter((autre) => autre !== id) : [...liste, id],
    );
  }

  return (
    <WizardCard
      title={`Que verra ${draft.email || "cet invité"} ?`}
      description="Sélectionnez les dossiers. Un dossier ouvert l’est avec tous ses sous-dossiers."
      backHref={lien("recipient", draft)}
      nextHref={lien("security", draft, {
        dossiers: tous ? "" : choisis.join(","),
      })}
      nextLabel="Continuer → Sécurité"
      nextDisabled={!tous && choisis.length === 0}
    >
      <div className="v2-scope-modes">
        <button
          data-active={!tous}
          onClick={() => setTous(false)}
          type="button"
        >
          Sélection de dossiers
        </button>
        <button data-active={tous} onClick={() => setTous(true)} type="button">
          Tous les dossiers autorisés
        </button>
      </div>

      <div className="v2-share-folders">
        {folders.map((folder) => (
          <label data-off={!retenus.includes(folder.id)} key={folder.id}>
            <input
              checked={retenus.includes(folder.id)}
              disabled={tous}
              onChange={() => basculer(folder.id)}
              type="checkbox"
            />
            <Icon name="folder" />
            <strong>{folder.name}</strong>
            <span>
              {folder.documentCount} pièce{folder.documentCount > 1 ? "s" : ""}
            </span>
          </label>
        ))}
      </div>

      {exceptions.length > 0 && (
        <p className="v2-share-warning">
          <Icon name="eye" />
          <span>
            <b>
              {exceptions.length} exception{exceptions.length > 1 ? "s" : ""} :
            </b>{" "}
            {exceptions
              .map((piece) => `« ${piece.nom} » restera masquée dans ${piece.dossier}`)
              .join(" ; ")}
            . Le masquage se règle sur la pièce, dans la data room.
          </span>
        </p>
      )}

      <p className="v2-scope-summary">
        Résumé : <b>{ouverts.length} dossier{ouverts.length > 1 ? "s" : ""}</b> ·{" "}
        <b>{pieces} pièce{pieces > 1 ? "s" : ""} visible{pieces > 1 ? "s" : ""}</b>
        {nonOuvertes > 0 && (
          <> · {nonOuvertes} dans des dossiers non ouverts</>
        )}
        {exceptions.length > 0 && (
          <> · {exceptions.length} masquée{exceptions.length > 1 ? "s" : ""}</>
        )}
      </p>

      <p className="v2-panel-note">
        {tous
          ? "Tous les dossiers de la data room s’ouvriront, y compris ceux créés après l’envoi."
          : "Seuls les dossiers cochés s’ouvriront. Un dossier créé plus tard restera fermé tant que vous ne l’aurez pas ajouté."}{" "}
        Les pièces laissées à la racine de la data room restent invisibles dans
        tous les cas. Pour retirer une pièce précise d’un dossier ouvert,
        masquez-la depuis la data room : elle disparaît de tous les accès sans
        changer de dossier.
      </p>
    </WizardCard>
  );
}

function SecurityStep({
  draft,
}: {
  draft: { email: string; level: string; nda: string; expires: string; dossiers: string };
}) {
  const [level, setLevel] = useState(draft.level || "watermark");
  const [nda, setNda] = useState(draft.nda !== "0");
  const [expires, setExpires] = useState(draft.expires);

  return (
    <WizardCard
      title="Règles de sécurité de cet accès"
      description="Les valeurs par défaut sont les plus prudentes."
      backHref={lien("content", draft)}
      nextHref={lien("review", draft, {
        level,
        nda: nda ? "1" : "0",
        expires,
      })}
      nextLabel="Continuer → Vérification"
    >
      <fieldset className="v2-chip-field">
        <legend>Ce que l’invité pourra faire</legend>
        <div className="v2-level-choices">
          {NIVEAUX.map(([valeur, titre, detail]) => (
            <label
              className="v2-level-choice"
              data-selected={level === valeur}
              key={valeur}
            >
              <input
                checked={level === valeur}
                name="level"
                onChange={() => setLevel(valeur)}
                type="radio"
                value={valeur}
              />
              <span>
                <strong>{titre}</strong>
                <small>{detail}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="v2-level-choice" data-selected={nda}>
        <input checked={nda} onChange={(e) => setNda(e.target.checked)} type="checkbox" />
        <span>
          <strong>Signature d’un accord de confidentialité</strong>
          <small>L’accès reste fermé tant que le NDA n’est pas signé.</small>
        </span>
      </label>

      <label className="v2-field">
        <span>
          Échéance de l’accès{" "}
          <small>— dernier jour entier, 90 jours par défaut</small>
        </span>
        <span className="v2-control">
          <input
            onChange={(event) => setExpires(event.target.value)}
            type="date"
            value={expires}
          />
        </span>
      </label>
    </WizardCard>
  );
}

function ReviewStep({
  draft,
  folders,
  operationId,
}: {
  draft: { email: string; level: string; nda: string; expires: string; dossiers: string };
  folders: readonly ShareFolder[];
  operationId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const nda = draft.nda !== "0";
  const niveau = NIVEAUX.find(([valeur]) => valeur === draft.level) ?? NIVEAUX[0];

  const choisis = draft.dossiers ? draft.dossiers.split(",").filter(Boolean) : [];
  const ouverts =
    choisis.length > 0
      ? folders.filter((folder) => choisis.includes(folder.id))
      : folders;
  const pieces = ouverts.reduce((somme, folder) => somme + folder.documentCount, 0);

  async function envoyer() {
    setErreur(null);
    setBusy(true);

    const res = await createV2Access({
      operationId,
      email: draft.email,
      level: draft.level || "watermark",
      ndaRequired: nda,
      // On envoie le jour, pas une heure : `fin_de_journee` en base le porte à
      // 23:59:59. Calculer l'heure ici donnerait deux règles pour la même
      // question, et c'est celle de la base qui gouverne l'expiration.
      expiresAt: draft.expires ? new Date(draft.expires).toISOString() : null,
      // `null` porte « tous les dossiers », y compris ceux à venir. Envoyer la
      // liste complète à la place figerait le périmètre sans que le fondateur
      // l'ait demandé.
      folderIds: choisis.length > 0 ? choisis : null,
    });

    setBusy(false);
    if (!res.ok) {
      setErreur(res.error ?? "L’accès n’a pas pu être créé.");
      return;
    }

    // Le lien ne transite par l'URL que si l'e-mail n'est PAS parti : c'est
    // alors la seule façon pour le fondateur de le transmettre lui-même.
    const suffixe = res.emailFailed && res.link
      ? `?sent=manuel&lien=${encodeURIComponent(res.link)}`
      : "?sent=1";
    router.push(`/v2/operations/${operationId}/access${suffixe}`);
  }

  return (
    <WizardCard
      title="Vérifiez avant d’envoyer"
      description="Rien n’est envoyé tant que vous n’avez pas confirmé."
      backHref={lien("security", draft)}
      onConfirm={envoyer}
      confirmLabel={busy ? "Envoi…" : "Envoyer l’accès"}
      confirmDisabled={busy}
    >
      {erreur && (
        <p className="v2-auth-error" role="alert">
          {erreur}
        </p>
      )}

      <div className="v2-detail-grid">
        <div><small>Destinataire</small><strong>{draft.email}</strong></div>
        <div><small>Niveau</small><strong>{niveau[1]}</strong></div>
        <div>
          <small>Accord de confidentialité</small>
          <strong>{nda ? "Requis avant tout accès" : "Non requis"}</strong>
        </div>
        <div>
          <small>Échéance</small>
          <strong>
            {draft.expires
              ? new Date(draft.expires).toLocaleDateString("fr-FR")
              : "90 jours"}
          </strong>
          {/* La date seule laissait croire que l'accès meurt AU début du jour
              dit — ce qu'il faisait vraiment avant la normalisation. */}
          <small>jusqu’à 23:59 ce jour-là</small>
        </div>
        <div>
          <small>Périmètre</small>
          <strong>
            {ouverts.length} dossier{ouverts.length > 1 ? "s" : ""} ·{" "}
            {pieces} pièce{pieces > 1 ? "s" : ""}
          </strong>
          {choisis.length === 0 && <small>toute la data room</small>}
        </div>
      </div>

      <p className="v2-panel-note">
        {niveau[2]} L’accès s’ouvrira à la vérification de l’adresse
        {nda ? " et à la signature du NDA" : ""}.
      </p>
    </WizardCard>
  );
}

/**
 * Écran 24 — le tableau des accès, sur les invitations réelles.
 *
 * Une invitation révoquée ou expirée reste affichée : un auditeur doit pouvoir
 * constater qu'un accès a existé, et à quelles conditions. L'effacer
 * effacerait la preuve.
 */
export function AccessTable({
  accesses,
  operationId,
  sent,
  lien,
}: {
  accesses: readonly AccessRow[];
  operationId: string;
  sent: "1" | "manuel" | null;
  /** Lien nominatif à transmettre à la main quand l'e-mail n'est pas parti. */
  lien: string | null;
}) {
  const [filtre, setFiltre] = useState<FiltreAcces>("tous");
  const [recherche, setRecherche] = useState("");

  // Une seule référence de temps pour toute la table : deux appels à `new
  // Date()` dans la même liste peuvent classer deux lignes différemment.
  const maintenant = new Date();

  const etats = accesses.map((row) => etatAcces(row.status, row.expiresAt, maintenant));
  const actifs = etats.filter((etat) => etat === "active" || etat === "expiring").length;

  const terme = recherche.trim().toLowerCase();
  const visibles = accesses.filter((row, index) => {
    if (!correspondAuFiltre(etats[index], filtre)) return false;
    if (!terme) return true;
    return (
      row.email.toLowerCase().includes(terme) ||
      (row.name ?? "").toLowerCase().includes(terme)
    );
  });

  return (
    <div className="v2-access-page">
      {sent === "1" && (
        <div className="v2-success-banner">
          <Icon name="shield-check" />
          Accès envoyé. Il reste inactif jusqu’à la vérification de l’e-mail
          {" "}et la signature du NDA.
        </div>
      )}

      {sent === "manuel" && (
        <div className="v2-success-banner" data-tone="amber">
          <Icon name="shield-check" />
          <span>
            L’accès est créé, mais l’e-mail n’est pas parti. Transmettez ce lien
            nominatif vous-même : <code>{lien}</code>
          </span>
        </div>
      )}

      <div className="v2-access-filters">
        <div className="v2-access-tabs" role="tablist">
          {(
            [
              ["tous", "Tous"],
              ["actifs", "Actifs"],
              ["attente", "En attente"],
              ["clos", "Expirés / révoqués"],
            ] as Array<[FiltreAcces, string]>
          ).map(([valeur, label]) => (
            <button
              aria-selected={filtre === valeur}
              key={valeur}
              onClick={() => setFiltre(valeur)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <input
          aria-label="Rechercher un accès"
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Rechercher un accès…"
          type="search"
          value={recherche}
        />
        <span>
          {actifs === 0
            ? "Aucun accès actif"
            : `${actifs} accès actif${actifs > 1 ? "s" : ""}`}
          {" · invités externes uniquement — "}
          <Link href="/v2/team">gérer l’équipe</Link>
        </span>
      </div>

      {accesses.length === 0 ? (
        <section className="v2-drop-empty">
          <EmptyMedallion icon="users" />
          <h2>Personne n’a accès à cette opération</h2>
          <p>
            Votre data room reste privée tant que vous n’invitez personne. Chaque
            accès est nominatif, daté, et son activité est journalisée.
          </p>
          <div>
            <Link className="v2-btn" href="?share=recipient">Créer un accès</Link>
          </div>
        </section>
      ) : (
        <div className="v2-access-table-wrap">
          <table className="v2-access-table">
            <thead>
              <tr>
                <th>Personne</th><th>État d’accès</th><th>Périmètre</th>
                <th>Niveau</th><th>NDA</th><th>Dernière activité</th>
                <th>Expiration</th><th />
              </tr>
            </thead>
            <tbody>
              {visibles.map((row) => {
                const brut = etatAcces(row.status, row.expiresAt, maintenant);
                const etat = etatLabel(brut);

                return (
                  <tr key={row.id}>
                    <td>
                      <span className="v2-person-avatar">
                        {initials(row.name ?? row.email)}
                      </span>
                      <div>
                        <strong>{row.name ?? row.email}</strong>
                        {row.name && <small>{row.email}</small>}
                      </div>
                    </td>
                    <td>
                      <span className="v2-status" data-tone={etat.tone}>
                        {etat.label}
                      </span>
                    </td>
                    <td>
                      {perimetreLabel(row.scope)}
                      {row.scopePending ? (
                        <small>à l’acceptation</small>
                      ) : (
                        row.scope.folders === 0 && <small>aucun droit écrit</small>
                      )}
                    </td>
                    <td>{accessLevelLabel(row.level)}</td>
                    <td>
                      {row.ndaSignedAt
                        ? `Signé le ${shortDate(row.ndaSignedAt)}`
                        : row.ndaRequired
                          ? "Requis"
                          : "Non requis"}
                    </td>
                    <td>
                      {row.lastActivityAt
                        ? depuis(row.lastActivityAt, maintenant)
                        : "—"}
                    </td>
                    <td>{row.expiresAt ? shortDate(row.expiresAt) : "Sans échéance"}</td>
                    <td className="v2-access-actions">
                      <Link href={`?apercu=${row.id}`}>Détail</Link>
                      {/* Un accès déjà clos n'a plus rien à fermer : proposer
                          « Révoquer » ferait douter de ce qui est en cours. */}
                      {brut !== "revoked" && brut !== "expired" && (
                        <RevokeButton
                          email={row.name ?? row.email}
                          invitationId={row.id}
                          operationId={operationId}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibles.length === 0 && (
            <p className="v2-panel-note">Aucun accès ne correspond à ce filtre.</p>
          )}
          <footer>
            L’historique d’activité est conservé après révocation ou expiration.
          </footer>
        </div>
      )}
    </div>
  );
}

/**
 * Révoquer, en deux temps.
 *
 * Pas de fenêtre de confirmation : un clic de trop se rattrape ici en cliquant
 * ailleurs. Mais pas un seul clic non plus — refermer une data room à un
 * investisseur qui la consulte n'est pas un geste qu'on annule.
 */
function RevokeButton({
  operationId,
  invitationId,
  email,
}: {
  operationId: string;
  invitationId: string;
  email: string;
}) {
  const router = useRouter();
  const [arme, setArme] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function revoquer() {
    setBusy(true);
    setErreur(null);

    const res = await revokeV2Access({ operationId, invitationId });

    setBusy(false);
    setArme(false);

    if (!res.ok) {
      setErreur(res.error ?? "L’accès n’a pas pu être fermé.");
      return;
    }
    router.refresh();
  }

  if (erreur) {
    return (
      <span className="v2-revoke-error" role="alert" title={erreur}>
        Échec — réessayer
        <button onClick={() => setErreur(null)} type="button">×</button>
      </span>
    );
  }

  if (!arme) {
    return (
      <button
        aria-label={`Révoquer l’accès de ${email}`}
        onClick={() => setArme(true)}
        type="button"
      >
        Révoquer
      </button>
    );
  }

  return (
    <span className="v2-revoke-confirm">
      <button disabled={busy} onClick={revoquer} type="button">
        {busy ? "Fermeture…" : "Confirmer"}
      </button>
      <button disabled={busy} onClick={() => setArme(false)} type="button">
        Annuler
      </button>
    </span>
  );
}

export function RequestPanel() {
  return (
    <>
      <Link className="v2-scrim" href="?" aria-label="Fermer la demande" />
      <aside className="v2-sidepanel">
        <header>
          <div>
            <span className="v2-status" data-tone="blue">Demande d’accès</span>
            <h2>Impact Capital Africa demande l’accès au dossier financier</h2>
          </div>
          <Link href="?" aria-label="Fermer">×</Link>
        </header>
        <div className="v2-sidepanel-body">
          <div className="v2-request-person">
            <span className="v2-person-avatar">CM</span>
            <div><strong>Clara Morel</strong><small>Impact Capital Africa · Investisseur · via votre fiche dealroom</small></div>
          </div>
          <section><small>Message joint</small><p className="v2-request-quote">Suite à notre échange, nous aimerions examiner vos états financiers et votre plan de trésorerie avant le comité du 12 août.</p></section>
          <div className="v2-detail-grid"><div><small>Périmètre demandé</small><strong>Finance et comptabilité</strong></div></div>
          <p className="v2-panel-note">
            Accorder ouvrira l’assistant de partage : vous choisirez le périmètre exact et les règles avant tout envoi.
          </p>
        </div>
        <footer className="v2-sidepanel-footer">
          <Link href="?">Refuser</Link>
          <button className="v2-btn" data-variant="secondary" type="button">Répondre d’abord</button>
          <Link className="v2-btn" href="?share=recipient">Accorder un accès…</Link>
        </footer>
      </aside>
    </>
  );
}

/**
 * Écran 25 — voir la data room avec les yeux de l'invité.
 *
 * Ce n'est pas une illustration : les dossiers, les comptes et les pièces
 * viennent de la base, filtrés par ce que cet accès ouvre vraiment. C'est le
 * seul écran qui répond à la question qui inquiète un fondateur avant
 * d'envoyer — « qu'est-ce qu'il voit, exactement ? ».
 */
export function GuestPreview({
  access,
  operationName,
  folders,
  documents,
  folderId,
}: {
  access: AccessRow;
  operationName: string;
  folders: readonly ShareFolder[];
  documents: readonly { id: string; name: string }[];
  folderId: string | null;
}) {
  const niveau = NIVEAUX.find(([valeur]) => valeur === access.level);
  const ouvert = folders.find((folder) => folder.id === folderId);

  return (
    <div className="v2-guest-preview">
      <header className="v2-preview-bar">
        <div>
          <span className="v2-status" data-tone="green">Prévisualisation</span>
          <strong>Vous voyez le dossier comme {access.name ?? access.email}</strong>
          <em>
            {/* Le compte annoncé est celui du rail ci-dessous : le périmètre
                total (sous-dossiers compris) est dans le tableau des accès. */}
            {folders.length} dossier{folders.length > 1 ? "s" : ""} ·{" "}
            {access.scope.documents} pièce
            {access.scope.documents > 1 ? "s" : ""} visibles ·{" "}
            {access.level === "download"
              ? "téléchargement autorisé"
              : "téléchargement désactivé"}
          </em>
        </div>
        <Link className="v2-btn" data-variant="secondary" href="?">
          Quitter la prévisualisation
        </Link>
      </header>

      <div className="v2-preview-body">
        <aside>
          <small>Dossier partagé par</small>
          <strong>{operationName}</strong>
          <nav>
            {folders.map((folder) => (
              <Link
                data-current={folder.id === folderId}
                href={`?apercu=${access.id}&dossier=${folder.id}`}
                key={folder.id}
              >
                <Icon name="folder" />
                <span>{folder.name}</span>
                <em>{folder.documentCount}</em>
              </Link>
            ))}
          </nav>
          <p className="v2-panel-note">
            {niveau ? `${niveau[1]} · ` : ""}consultation journalisée
            {access.expiresAt
              ? ` · expire le ${shortDate(access.expiresAt)}`
              : ""}
          </p>
        </aside>

        <section>
          <h2>{ouvert?.name ?? "Aucun dossier ouvert"}</h2>
          {documents.length === 0 ? (
            <p className="v2-panel-note">
              Ce dossier ne contient aucune pièce visible.
            </p>
          ) : (
            <ul className="v2-preview-files">
              {documents.map((document) => (
                <li key={document.id}>
                  <Icon name="file" />
                  <strong>{document.name}</strong>
                  <Link href={`/v2/documents/${document.id}`}>Consulter</Link>
                </li>
              ))}
            </ul>
          )}
          <p className="v2-panel-note">
            Les invités ne voient jamais ce qui leur est masqué — pas même son
            existence. Les pièces laissées à la racine de la data room
            n’apparaissent nulle part ici.
          </p>
        </section>
      </div>
    </div>
  );
}
