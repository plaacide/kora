"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  correctV2Update,
  deleteV2Update,
  publishV2Update,
  saveV2Update,
} from "@/app/v2/(workspace)/operations/[operationId]/lever/actions";
import { dateJournal } from "@/features/v2/domain/journal";
import type { InvestisseurPipeline } from "@/features/v2/domain/pipeline";
import {
  CATALOGUE,
  FINANCEURS,
  INSTRUMENTS,
  disponibles,
  libelleFinanceur,
  libelleInstrument,
  libelleVerification,
  pourquoiCesIndicateurs,
  recommandes,
  trimestreEchu,
  VERIFICATIONS,
  type Definition,
  type Financeur,
  type IndicateurRetenu,
  type Instrument,
} from "@/features/v2/domain/updates";
import type { MiseAJour, MiseAJourResume } from "@/features/v2/server/updates";

import { EmptyMedallion } from "./EmptyArt";
import { Icon } from "./Icon";

function href(view: string, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({ view, ...extra });
  return `?${params.toString()}`;
}

/**
 * Les mises à jour — écrans 46 à 50.
 *
 * Trois états, une seule route : la liste, l'assistant, la mise à jour publiée.
 * L'URL porte l'identifiant, ce qui fait qu'un brouillon repris trois jours
 * plus tard revient là où il a été laissé — et non au début de l'assistant.
 */
export function LeverUpdates({
  courante,
  investisseurs,
  liste,
  operationId,
  step,
}: {
  /** La mise à jour ouverte, brouillon ou publiée. `null` sur la liste. */
  courante: MiseAJour | null;
  investisseurs: readonly InvestisseurPipeline[];
  liste: readonly MiseAJourResume[];
  operationId: string;
  step?: string;
}) {
  if (courante?.statut === "publiee") {
    return <UpdatePublished maj={courante} operationId={operationId} />;
  }
  if (courante) {
    return (
      <UpdateWizard
        brouillon={courante}
        investisseurs={investisseurs}
        operationId={operationId}
        step={step ?? "audience"}
      />
    );
  }
  if (step === "nouvelle") {
    return (
      <UpdateWizard
        brouillon={null}
        investisseurs={investisseurs}
        operationId={operationId}
        step="audience"
      />
    );
  }
  return <UpdatesList liste={liste} operationId={operationId} />;
}

// ---------------------------------------------------------------------------
// Écran 46 — la liste
// ---------------------------------------------------------------------------

function UpdatesList({
  liste,
  operationId,
}: {
  liste: readonly MiseAJourResume[];
  operationId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function supprimer(id: string) {
    setBusy(id);
    await deleteV2Update({ operationId, id });
    setBusy(null);
    router.refresh();
  }

  if (liste.length === 0) {
    return (
      <section className="v2-drop-empty">
        <EmptyMedallion icon="mail" />
        <h2>Aucune mise à jour</h2>
        <p>
          Une mise à jour est un instantané daté que vous adressez à un
          financeur précis : ses indicateurs, votre commentaire, votre demande.
          Une fois publiée elle ne change plus — une correction crée une
          nouvelle version.
        </p>
        <Link className="v2-btn" href={href("updates", { step: "nouvelle" })}>
          <Icon name="plus" />
          Créer une mise à jour
        </Link>
      </section>
    );
  }

  return (
    <div className="v2-update-table-wrap">
      <table className="v2-update-table">
        <thead>
          <tr>
            <th>Période</th>
            <th>Audience</th>
            <th>Instrument</th>
            <th>Destinataires</th>
            <th>État</th>
            <th>Date</th>
            <th>Consultations</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {liste.map((maj) => (
            <tr key={maj.id}>
              <td>
                <Link href={href("updates", { maj: maj.id })}>
                  <strong>{maj.periode}</strong>
                </Link>
                {/* L'espace est un vrai caractère, pas une marge : une marge
                    sépare à l'œil mais laisse « T2 2026V2 » à la copie et à la
                    lecture d'écran. */}
                {maj.version > 1 && (
                  <small className="v2-version-tag">{" "}V{maj.version}</small>
                )}
              </td>
              <td>{libelleFinanceur(maj.financeur)}</td>
              <td>{libelleInstrument(maj.instrument)}</td>
              <td>
                {maj.destinataires.length > 0
                  ? maj.destinataires.join(" · ")
                  : "—"}
              </td>
              <td>
                <span
                  className="v2-status"
                  data-tone={maj.statut === "publiee" ? "green" : "neutral"}
                >
                  {maj.statut === "publiee" ? "Publiée" : "Brouillon"}
                </span>
              </td>
              <td>{maj.publieeLe ? dateJournal(maj.publieeLe) : "—"}</td>
              <td>
                {maj.statut === "publiee"
                  ? `${maj.consultations} consultation${maj.consultations > 1 ? "s" : ""}`
                  : "—"}
              </td>
              <td>
                {maj.statut === "brouillon" && (
                  <button
                    disabled={busy === maj.id}
                    onClick={() => supprimer(maj.id)}
                    type="button"
                  >
                    {busy === maj.id ? "…" : "Supprimer"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        <Icon name="lock" />
        Chaque mise à jour publiée est un instantané historisé. Une audience ne
        voit jamais les autres destinataires. Les consultations restent des
        signaux de lecture.
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Écrans 47 à 49 — l'assistant
// ---------------------------------------------------------------------------

const ETAPES = [
  ["audience", "Audience"],
  ["indicators", "Indicateurs"],
  ["comment", "Commentaire"],
  ["review", "Vérification"],
] as const;

function UpdateWizard({
  brouillon,
  investisseurs,
  operationId,
  step,
}: {
  brouillon: MiseAJour | null;
  investisseurs: readonly InvestisseurPipeline[];
  operationId: string;
  step: string;
}) {
  const router = useRouter();
  const index = Math.max(0, ETAPES.findIndex(([cle]) => cle === step));

  const [instrument, setInstrument] = useState<Instrument>(
    brouillon?.instrument ?? "capital",
  );
  const [financeur, setFinanceur] = useState<Financeur>(
    brouillon?.financeur ?? "vc",
  );
  const [periode, setPeriode] = useState(
    brouillon?.periode ?? trimestreEchu(new Date()),
  );
  const [destinataires, setDestinataires] = useState<string[]>(
    brouillon?.destinataires.map((d) => d.investorId) ?? [],
  );
  const [indicateurs, setIndicateurs] = useState<IndicateurRetenu[]>(
    brouillon?.indicateurs ?? [],
  );
  const [resume, setResume] = useState(brouillon?.resume ?? "");
  const [demande, setDemande] = useState(brouillon?.demande ?? "");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  /**
   * Chaque passage d'étape enregistre.
   *
   * Sans cela, quitter à l'étape 3 perdrait les deux premières — et un
   * assistant qui punit l'interruption pousse à tout saisir d'un trait, donc
   * mal.
   */
  async function avancer(vers: string) {
    setBusy(true);
    setErreur(null);

    const res = await saveV2Update({
      operationId,
      id: brouillon?.id ?? null,
      instrument,
      financeur,
      periode,
      resume,
      demande,
      indicateurs,
      destinataires,
    });

    setBusy(false);
    if (!res.ok) {
      setErreur(res.error ?? "Le brouillon n’a pas pu être enregistré.");
      return;
    }

    const id = brouillon?.id ?? res.id;
    router.push(
      vers === "updates"
        ? href("updates")
        : href("updates", id ? { maj: id, step: vers } : { step: vers }),
    );
    router.refresh();
  }

  async function publier() {
    if (!brouillon) return;
    setBusy(true);
    setErreur(null);

    const enregistre = await saveV2Update({
      operationId,
      id: brouillon.id,
      instrument,
      financeur,
      periode,
      resume,
      demande,
      indicateurs,
      destinataires,
    });

    if (!enregistre.ok) {
      setBusy(false);
      setErreur(enregistre.error ?? "Le brouillon n’a pas pu être enregistré.");
      return;
    }

    const res = await publishV2Update({ operationId, id: brouillon.id });

    setBusy(false);
    if (!res.ok) {
      setErreur(
        res.error?.includes("aucun destinataire")
          ? "Choisissez au moins un destinataire avant de publier."
          : (res.error ?? "La mise à jour n’a pas pu être publiée."),
      );
      return;
    }

    router.push(href("updates", { maj: brouillon.id }));
    router.refresh();
  }

  return (
    <div className="v2-update-wizard">
      <div className="v2-wizard-heading">
        <span>Lever · Mises à jour /</span>
        <strong>
          {brouillon ? `${periode} — brouillon` : "Créer une mise à jour"}
        </strong>
        <Link href={href("updates")}>×</Link>
      </div>

      <ol className="v2-update-steps">
        {ETAPES.map(([cle, label], i) => (
          <li
            className={
              i < index ? "is-done" : i === index ? "is-current" : ""
            }
            key={cle}
          >
            {i > 0 && <i />}
            <span>{i < index ? "✓" : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {erreur && (
        <p className="v2-auth-error" role="alert">
          {erreur}
        </p>
      )}

      {step === "indicators" ? (
        <IndicatorStep
          busy={busy}
          financeur={financeur}
          indicateurs={indicateurs}
          instrument={instrument}
          onBack={() => avancer("audience")}
          onNext={() => avancer("comment")}
          periode={periode}
          setIndicateurs={setIndicateurs}
        />
      ) : step === "comment" ? (
        <CommentStep
          busy={busy}
          demande={demande}
          destinataires={brouillon?.destinataires ?? []}
          onBack={() => avancer("indicators")}
          onNext={() => avancer("review")}
          resume={resume}
          setDemande={setDemande}
          setResume={setResume}
        />
      ) : step === "review" ? (
        <ReviewStep
          brouillon={brouillon}
          busy={busy}
          demande={demande}
          financeur={financeur}
          indicateurs={indicateurs}
          instrument={instrument}
          onBack={() => avancer("comment")}
          onPublish={publier}
          periode={periode}
          resume={resume}
        />
      ) : (
        <AudienceStep
          busy={busy}
          destinataires={destinataires}
          financeur={financeur}
          instrument={instrument}
          investisseurs={investisseurs}
          onCancel={() => avancer("updates")}
          onNext={() => avancer("indicators")}
          periode={periode}
          setDestinataires={setDestinataires}
          setFinanceur={setFinanceur}
          setInstrument={setInstrument}
          setPeriode={setPeriode}
        />
      )}
    </div>
  );
}

/** Écran 47 — l'audience, qui décide de tout le reste. */
function AudienceStep({
  busy,
  destinataires,
  financeur,
  instrument,
  investisseurs,
  onCancel,
  onNext,
  periode,
  setDestinataires,
  setFinanceur,
  setInstrument,
  setPeriode,
}: {
  busy: boolean;
  destinataires: string[];
  financeur: Financeur;
  instrument: Instrument;
  investisseurs: readonly InvestisseurPipeline[];
  onCancel: () => void;
  onNext: () => void;
  periode: string;
  setDestinataires: (valeur: string[]) => void;
  setFinanceur: (valeur: Financeur) => void;
  setInstrument: (valeur: Instrument) => void;
  setPeriode: (valeur: string) => void;
}) {
  function basculer(id: string) {
    setDestinataires(
      destinataires.includes(id)
        ? destinataires.filter((autre) => autre !== id)
        : [...destinataires, id],
    );
  }

  return (
    <section className="v2-update-card">
      <header>
        <span className="v2-section-label">Étape 1 sur 4</span>
        <h1>À qui s’adresse cette mise à jour ?</h1>
        <p>
          La sélection d’indicateurs proposée dépend de l’instrument et du type
          de financeur.
        </p>
      </header>

      <div className="v2-update-body">
        <fieldset className="v2-update-choice">
          <legend>Instrument</legend>
          <div>
            {INSTRUMENTS.map((i) => (
              <button
                data-active={instrument === i.cle}
                key={i.cle}
                onClick={() => setInstrument(i.cle)}
                type="button"
              >
                {i.label}
                <small>{i.aide}</small>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="v2-update-choice">
          <legend>Type de financeur</legend>
          <div>
            {FINANCEURS.map((f) => (
              <button
                data-active={financeur === f.cle}
                key={f.cle}
                onClick={() => setFinanceur(f.cle)}
                type="button"
              >
                {f.label}
                <small>{f.aide}</small>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="v2-update-choice v2-recipient-choice">
          <legend>Destinataires</legend>
          {investisseurs.length === 0 ? (
            <p className="v2-field-helper">
              Ajoutez d’abord un investisseur au pipeline : une mise à jour
              s’adresse à quelqu’un que vous suivez.
            </p>
          ) : (
            <div className="v2-recipient-list">
              {investisseurs.map((i) => (
                <label data-active={destinataires.includes(i.id)} key={i.id}>
                  <input
                    checked={destinataires.includes(i.id)}
                    onChange={() => basculer(i.id)}
                    type="checkbox"
                  />
                  <span>
                    <strong>{i.nom}</strong>
                    <small>
                      {i.organisation ?? "—"}
                      {i.email ? ` · ${i.email}` : " · sans adresse"}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          )}
          <small className="v2-field-helper">
            Une audience ne voit jamais les autres destinataires.
          </small>
        </fieldset>

        <label className="v2-field">
          <span>Période</span>
          <span className="v2-control">
            <input
              onChange={(event) => setPeriode(event.target.value)}
              placeholder="T3 2026"
              value={periode}
            />
          </span>
          <small className="v2-field-helper">
            Le trimestre échu est proposé — remplacez-le si votre exercice ne
            tombe pas là.
          </small>
        </label>

        <div className="v2-audience-summary">
          <Icon name="trend" />
          <p>{pourquoiCesIndicateurs(instrument, financeur)}</p>
        </div>
      </div>

      <footer>
        <button disabled={busy} onClick={onCancel} type="button">
          Annuler
        </button>
        <button
          className="v2-btn"
          disabled={busy || destinataires.length === 0}
          onClick={onNext}
          type="button"
        >
          {busy ? "…" : "Continuer → Indicateurs"}
        </button>
      </footer>
    </section>
  );
}

/** Écran 48 — les indicateurs, en trois groupes. */
function IndicatorStep({
  busy,
  financeur,
  indicateurs,
  instrument,
  onBack,
  onNext,
  periode,
  setIndicateurs,
}: {
  busy: boolean;
  financeur: Financeur;
  indicateurs: IndicateurRetenu[];
  instrument: Instrument;
  onBack: () => void;
  onNext: () => void;
  periode: string;
  /**
   * La forme fonctionnelle est obligatoire, pas préférable.
   *
   * Deux bascules dans le même cycle de rendu partagent la MÊME valeur de
   * `indicateurs` : la seconde repart de l'état d'avant la première et l'efface.
   * Mesuré : trois clics rapides n'en gardaient qu'un.
   */
  setIndicateurs: React.Dispatch<React.SetStateAction<IndicateurRetenu[]>>;
}) {
  const suggeres = recommandes(instrument, financeur);
  const autres = disponibles(instrument, financeur);
  const retenus = new Map(indicateurs.map((i) => [i.cle, i]));

  function basculer(d: Definition) {
    setIndicateurs((prec) =>
      prec.some((i) => i.cle === d.cle)
        ? prec.filter((i) => i.cle !== d.cle)
        : [
            ...prec,
            {
              cle: d.cle,
              libelle: d.libelle,
              definition: d.definition,
              periode,
              valeur: "",
              verification: "declare",
            },
          ],
    );
  }

  function modifier(cle: string, champ: Partial<IndicateurRetenu>) {
    setIndicateurs((prec) =>
      prec.map((i) => (i.cle === cle ? { ...i, ...champ } : i)),
    );
  }

  const personnalises = indicateurs.filter(
    (i) => !CATALOGUE.some((d) => d.cle === i.cle),
  );

  function ajouterPersonnalise() {
    setIndicateurs((prec) => [
      ...prec,
      {
        cle: `perso-${prec.length + 1}-${periode.replace(/\s/g, "")}`,
        libelle: "",
        definition: "",
        periode,
        valeur: "",
        verification: "declare",
      },
    ]);
  }

  const vides = indicateurs.filter((i) => !i.valeur.trim()).length;

  return (
    <section className="v2-update-card v2-indicator-card">
      <header>
        <span className="v2-section-label">Étape 2 sur 4</span>
        <h1>
          Indicateurs — {libelleInstrument(instrument)} +{" "}
          {libelleFinanceur(financeur)}
        </h1>
        <p>
          Trois groupes : recommandés pour cette audience, autres disponibles,
          personnalisés. Rien n’est publié sans confirmation.
        </p>
      </header>

      <div className="v2-update-body">
        <IndicatorGroup
          definitions={suggeres}
          modifier={modifier}
          onToggle={basculer}
          retenus={retenus}
          titre="Recommandés pour cette audience"
        />
        <IndicatorGroup
          definitions={autres}
          modifier={modifier}
          onToggle={basculer}
          retenus={retenus}
          titre="Autres indicateurs disponibles"
        />

        {personnalises.length > 0 && (
          <section className="v2-indicator-group">
            <header>
              <h2>Indicateurs personnalisés</h2>
              <span>{personnalises.length} ajoutés</span>
            </header>
            {personnalises.map((i) => (
              <div className="v2-indicator-row" data-shared="true" key={i.cle}>
                <button
                  aria-label="Retirer"
                  className="v2-switch"
                  data-active="true"
                  onClick={() =>
                    setIndicateurs((prec) =>
                      prec.filter((a) => a.cle !== i.cle),
                    )
                  }
                  type="button"
                >
                  <span />
                </button>
                <div className="v2-indicator-copy">
                  <input
                    onChange={(event) =>
                      modifier(i.cle, { libelle: event.target.value })
                    }
                    placeholder="Nom de l’indicateur"
                    value={i.libelle}
                  />
                  <input
                    onChange={(event) =>
                      modifier(i.cle, { definition: event.target.value })
                    }
                    placeholder="Ce qu’il mesure exactement"
                    value={i.definition}
                  />
                </div>
                <label>
                  <span>Valeur</span>
                  <input
                    onChange={(event) =>
                      modifier(i.cle, { valeur: event.target.value })
                    }
                    value={i.valeur}
                  />
                </label>
                <label>
                  <span>Statut</span>
                  <select
                    onChange={(event) =>
                      modifier(i.cle, {
                        verification: event.target
                          .value as IndicateurRetenu["verification"],
                      })
                    }
                    value={i.verification}
                  >
                    {VERIFICATIONS.map((v) => (
                      <option key={v.cle} value={v.cle}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </section>
        )}

        <button
          className="v2-custom-indicator"
          onClick={ajouterPersonnalise}
          type="button"
        >
          <Icon name="plus" />
          <span>
            <strong>Créer un indicateur personnalisé</strong>
            <small>
              Ce que Sanza ne propose pas : un chiffre propre à votre activité.
            </small>
          </span>
        </button>

        <p className="v2-indicator-disclaimer">
          <Icon name="shield" />
          Un indicateur n’est jamais présenté comme audité parce qu’il est
          publié dans Sanza — le statut est déclaré par vous.
        </p>
      </div>

      <footer>
        <button disabled={busy} onClick={onBack} type="button">
          ← Audience
        </button>
        <div>
          {vides > 0 && (
            <small className="v2-field-helper">
              {vides} indicateur{vides > 1 ? "s" : ""} sans valeur — il
              {vides > 1 ? "s" : ""} ne ser{vides > 1 ? "ont" : "a"} pas
              publié{vides > 1 ? "s" : ""}.
            </small>
          )}
          <button
            className="v2-btn"
            disabled={busy}
            onClick={onNext}
            type="button"
          >
            {busy ? "…" : "Continuer → Commentaire"}
          </button>
        </div>
      </footer>
    </section>
  );
}

function IndicatorGroup({
  definitions,
  modifier,
  onToggle,
  retenus,
  titre,
}: {
  definitions: readonly Definition[];
  modifier: (cle: string, champ: Partial<IndicateurRetenu>) => void;
  onToggle: (d: Definition) => void;
  retenus: Map<string, IndicateurRetenu>;
  titre: string;
}) {
  if (definitions.length === 0) return null;

  const partages = definitions.filter((d) => retenus.has(d.cle)).length;

  return (
    <section className="v2-indicator-group">
      <header>
        <h2>{titre}</h2>
        <span>{partages} partagés</span>
      </header>
      {definitions.map((d) => {
        const retenu = retenus.get(d.cle);
        return (
          <div
            className="v2-indicator-row"
            data-shared={retenu !== undefined}
            key={d.cle}
          >
            <button
              aria-label={`Partager ${d.libelle}`}
              aria-pressed={retenu !== undefined}
              className="v2-switch"
              data-active={retenu !== undefined}
              onClick={() => onToggle(d)}
              type="button"
            >
              <span />
            </button>
            <div className="v2-indicator-copy">
              <div>
                <strong>{d.libelle}</strong>
                {["Impact", "ESG", "Gouvernance"].includes(d.famille) && (
                  <span className="v2-tag">{d.famille}</span>
                )}
              </div>
              <small>
                {d.definition} · {d.unite}
              </small>
            </div>
            <label>
              <span>Valeur</span>
              <input
                disabled={!retenu}
                onChange={(event) =>
                  modifier(d.cle, { valeur: event.target.value })
                }
                placeholder={d.unite}
                value={retenu?.valeur ?? ""}
              />
            </label>
            <label>
              <span>Statut</span>
              <select
                disabled={!retenu}
                onChange={(event) =>
                  modifier(d.cle, {
                    verification: event.target
                      .value as IndicateurRetenu["verification"],
                  })
                }
                value={retenu?.verification ?? "declare"}
              >
                {VERIFICATIONS.map((v) => (
                  <option key={v.cle} value={v.cle}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        );
      })}
    </section>
  );
}

/** Étape 3 — le contexte que les chiffres ne portent pas. */
function CommentStep({
  busy,
  demande,
  destinataires,
  onBack,
  onNext,
  resume,
  setDemande,
  setResume,
}: {
  busy: boolean;
  demande: string;
  destinataires: readonly { nom: string; organisation: string | null }[];
  onBack: () => void;
  onNext: () => void;
  resume: string;
  setDemande: (valeur: string) => void;
  setResume: (valeur: string) => void;
}) {
  const noms = destinataires
    .map((d) => (d.organisation ? `${d.nom} (${d.organisation})` : d.nom))
    .join(", ");

  return (
    <section className="v2-update-card">
      <header>
        <span className="v2-section-label">Étape 3 sur 4</span>
        <h1>Donnez le contexte de la période</h1>
        <p>
          Expliquez ce que les chiffres ne racontent pas seuls et formulez une
          demande claire.
        </p>
      </header>

      <div className="v2-update-body">
        <label className="v2-field v2-configure-textarea">
          <span>Résumé du dirigeant</span>
          <textarea
            onChange={(event) => setResume(event.target.value)}
            placeholder="Ce qui s’est passé, ce qui a changé, ce qui vient."
            value={resume}
          />
          <small className="v2-field-helper">
            Visible par tous les destinataires de cette audience.
          </small>
        </label>

        <label className="v2-field v2-configure-textarea">
          <span>
            Demande au financeur <small>— facultative</small>
          </span>
          <textarea
            onChange={(event) => setDemande(event.target.value)}
            placeholder="Une introduction, un avis, un cofinancement…"
            value={demande}
          />
          <small className="v2-field-helper">
            C’est la seule ligne à laquelle on peut vous répondre. Une mise à
            jour sans demande ne provoque rien.
          </small>
        </label>

        {noms && (
          <p className="v2-panel-callout">
            <Icon name="users" />
            Le commentaire ne sera partagé qu’avec {noms}.
          </p>
        )}
      </div>

      <footer>
        <button disabled={busy} onClick={onBack} type="button">
          ← Indicateurs
        </button>
        <button className="v2-btn" disabled={busy} onClick={onNext} type="button">
          {busy ? "…" : "Continuer → Vérification"}
        </button>
      </footer>
    </section>
  );
}

/** Écran 49 — voir exactement ce que le destinataire recevra. */
function ReviewStep({
  brouillon,
  busy,
  demande,
  financeur,
  indicateurs,
  instrument,
  onBack,
  onPublish,
  periode,
  resume,
}: {
  brouillon: MiseAJour | null;
  busy: boolean;
  demande: string;
  financeur: Financeur;
  indicateurs: readonly IndicateurRetenu[];
  instrument: Instrument;
  onBack: () => void;
  onPublish: () => void;
  periode: string;
  resume: string;
}) {
  // Ce qui n'a pas de valeur ne part pas : un indicateur vide dans une mise à
  // jour se lit comme un chiffre qu'on cache, pas comme un champ oublié.
  const publiables = indicateurs.filter((i) => i.valeur.trim() && i.libelle.trim());
  const retires = indicateurs.length - publiables.length;
  const destinataires = brouillon?.destinataires ?? [];
  const injoignables = destinataires.filter((d) => !d.joignable);

  return (
    <section className="v2-update-card v2-review-update-card">
      <header>
        <span className="v2-section-label">Étape 4 sur 4</span>
        <h1>Vérifiez avant de publier</h1>
        <p>
          Voici exactement la mise à jour que recevront vos destinataires — rien
          de plus.
        </p>
      </header>

      <div className="v2-update-body">
        <div className="v2-recipient-preview">
          <header>
            <div>
              <span>Aperçu destinataire</span>
              <strong>
                {destinataires
                  .map((d) => d.organisation ?? d.nom)
                  .join(", ") || "Aucun destinataire"}
              </strong>
            </div>
            <span className="v2-status" data-tone="blue">
              {libelleInstrument(instrument)} + {libelleFinanceur(financeur)} ·{" "}
              {periode}
            </span>
          </header>

          {resume.trim() && (
            <section>
              <span className="v2-section-label">Résumé du dirigeant</span>
              <p>{resume}</p>
            </section>
          )}

          <section>
            <div className="v2-preview-section-title">
              <span className="v2-section-label">Indicateurs</span>
              <strong>{publiables.length} partagés</strong>
            </div>
            {publiables.length === 0 ? (
              <p className="v2-field-helper">
                Aucun indicateur ne porte de valeur — la mise à jour ne
                contiendra que votre commentaire.
              </p>
            ) : (
              <div className="v2-preview-metrics">
                {publiables.map((i) => (
                  <div key={i.cle}>
                    <span>{i.libelle}</span>
                    <strong>{i.valeur}</strong>
                    <small>{i.precision ?? "—"}</small>
                    <em>{libelleVerification(i.verification)}</em>
                  </div>
                ))}
              </div>
            )}
          </section>

          {demande.trim() && (
            <section className="v2-preview-request">
              <strong>Demande :</strong> {demande}
            </section>
          )}
        </div>

        <div className="v2-publication-grid">
          <div>
            <span>Destinataires</span>
            <strong>{destinataires.length}</strong>
            <small>accès en lecture, journalisé</small>
          </div>
          <div>
            <span>Publication</span>
            <strong>
              Immédiate · instantané versionné V{brouillon?.version ?? 1}
            </strong>
          </div>
          <div>
            <span>Contenu</span>
            <strong>{publiables.length} indicateurs confirmés</strong>
            {retires > 0 && (
              <small>
                {retires} sans valeur, non publié{retires > 1 ? "s" : ""}
              </small>
            )}
          </div>
          <div>
            <span>Pièce jointe</span>
            <strong>{brouillon?.documentNom ?? "aucune"}</strong>
          </div>
        </div>

        {injoignables.length > 0 && (
          <p className="v2-panel-callout">
            <Icon name="shield" />
            {injoignables.map((d) => d.nom).join(", ")} n’
            {injoignables.length > 1 ? "ont" : "a"} pas encore de compte Sanza :
            la mise à jour sera enregistrée mais ne sera pas lisible par{" "}
            {injoignables.length > 1 ? "eux" : "cette personne"} tant qu’
            {injoignables.length > 1 ? "ils n’en créent" : "elle n’en crée"} pas
            un.
          </p>
        )}
      </div>

      <footer>
        <button disabled={busy} onClick={onBack} type="button">
          ← Commentaire
        </button>
        <button
          className="v2-btn"
          disabled={busy || !brouillon}
          onClick={onPublish}
          type="button"
        >
          {busy ? "Publication…" : "Publier la mise à jour"}
        </button>
      </footer>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Écran 50 — la mise à jour publiée
// ---------------------------------------------------------------------------

function UpdatePublished({
  maj,
  operationId,
}: {
  maj: MiseAJour;
  operationId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function corriger() {
    setBusy(true);
    const res = await correctV2Update({ operationId, id: maj.id });
    setBusy(false);
    if (res.ok && res.id) {
      router.push(href("updates", { maj: res.id, step: "indicators" }));
      router.refresh();
    }
  }

  return (
    <article className="v2-published-update">
      <div className="v2-lever-actions">
        <button
          className="v2-btn"
          data-variant="secondary"
          disabled={busy}
          onClick={corriger}
          type="button"
        >
          {busy ? "…" : `Créer une correction (V${maj.version + 1})`}
        </button>
        <Link className="v2-btn" href={href("updates", { step: "nouvelle" })}>
          Créer la mise à jour suivante
        </Link>
      </div>

      <header>
        <div>
          <span className="v2-section-label">Mise à jour financeur</span>
          <h1>
            {maj.periode} — {libelleFinanceur(maj.financeur)}
          </h1>
        </div>
        <div>
          <span className="v2-status" data-tone="green">
            Publiée
          </span>
          <small>V{maj.version} · figée</small>
        </div>
      </header>

      {maj.resume && <p>{maj.resume}</p>}

      {maj.indicateurs.length > 0 && (
        <div className="v2-published-metrics">
          {maj.indicateurs
            .filter((i) => i.valeur.trim())
            .map((i) => (
              <div key={i.cle}>
                <span>{i.libelle}</span>
                <strong>{i.valeur}</strong>
                <small>{libelleVerification(i.verification)}</small>
              </div>
            ))}
        </div>
      )}

      {maj.demande && (
        <p className="v2-preview-request">
          <strong>Demande :</strong> {maj.demande}
        </p>
      )}

      <p className="v2-frozen-note">
        <Icon name="lock" />
        Contenu figé au {maj.publieeLe ? dateJournal(maj.publieeLe) : "—"} ·
        toute correction crée une V{maj.version + 1}, l’historique reste
        consultable.
      </p>

      <section>
        <h2>Publication</h2>
        <div className="v2-publication-grid">
          <div>
            <span>Publiée le</span>
            <strong>{maj.publieeLe ? dateJournal(maj.publieeLe) : "—"}</strong>
          </div>
          <div>
            <span>Par</span>
            <strong>{maj.publieePar ?? "—"}</strong>
          </div>
          <div>
            <span>Audience</span>
            <strong>
              {libelleInstrument(maj.instrument)} ·{" "}
              {libelleFinanceur(maj.financeur)}
            </strong>
          </div>
          <div>
            <span>Pièce jointe</span>
            <strong>{maj.documentNom ?? "aucune"}</strong>
          </div>
        </div>
      </section>

      <section>
        <h2>Destinataires et consultations</h2>
        {maj.destinataires.map((d) => (
          <div className="v2-update-recipient" key={d.investorId}>
            <span>
              {d.nom
                .split(/\s+/)
                .slice(0, 2)
                .map((mot) => mot[0]?.toUpperCase() ?? "")
                .join("")}
            </span>
            <div>
              <strong>{d.nom}</strong>
              <small>{d.organisation ?? d.email ?? "—"}</small>
            </div>
            <strong>
              {d.joignable
                ? `${d.vues} consultation${d.vues > 1 ? "s" : ""}${
                    d.derniereVue ? ` · dern. ${dateJournal(d.derniereVue)}` : ""
                  }`
                : "sans compte Sanza"}
            </strong>
          </div>
        ))}
        <p className="v2-rule-note">
          <Icon name="eye" />
          Les consultations sont des signaux de lecture — ni une approbation du
          contenu, ni une intention de financement.
        </p>
      </section>
    </article>
  );
}
