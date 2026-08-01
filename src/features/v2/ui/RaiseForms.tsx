"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DEVISES,
  INSTRUMENTS_LEVEE,
  STADES,
} from "@/features/v2/domain/levee";

import {
  closeV2Raise,
  createV2Raise,
  saveV2Raise,
} from "@/app/v2/(workspace)/operations/[operationId]/lever/actions";
import { messageDErreur } from "@/features/v2/domain/erreurs";
import type { Raise } from "@/features/v2/server/raise";
import { Icon } from "./Icon";

/**
 * Les gestes de la levée — écrans 36 et 45.
 *
 * Les listes déroulantes portent le VOCABULAIRE DE LA BASE en valeur et le
 * français à l'écran. Envoyer « Série A » là où la colonne attend `serie_a`
 * ferait une levée dont le stade ne se relit nulle part.
 */

// Les listes vivent dans le domaine : la vue de levée les relit pour afficher
// « Série A » là où la base porte « serie_a ». Les garder ici obligeait cet
// écran-là à les réécrire, et il les avait écrites en dur.
const INSTRUMENTS = INSTRUMENTS_LEVEE;

/** Les trois seules audiences que `save_raise` accepte — elle filtre le reste. */
const AUDIENCES: Array<[string, string]> = [
  ["vc", "VC et fonds"],
  ["dfi", "DFI et fonds à impact"],
  ["banque", "Banques et prêteurs"],
];

/** Un montant saisi avec des espaces reste un montant. */
function enNombre(valeur: string): number | null {
  const propre = valeur.replace(/[\s ]/g, "");
  if (!propre) return null;
  const nombre = Number(propre);
  return Number.isFinite(nombre) ? nombre : null;
}

export function RaiseConfigure({
  operationId,
  raise,
  retour,
}: {
  operationId: string;
  raise: Raise | null;
  retour: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [name, setName] = useState(raise?.name ?? "");
  const [stage, setStage] = useState(raise?.stage ?? "serie_a");
  const [target, setTarget] = useState(
    raise?.target ? String(raise.target) : "",
  );
  const [currency, setCurrency] = useState(raise?.currency ?? "XOF");
  const [instrument, setInstrument] = useState(raise?.instrument ?? "equity");
  const [preMoney, setPreMoney] = useState(
    raise?.preMoney ? String(raise.preMoney) : "",
  );
  const [deadline, setDeadline] = useState(raise?.deadline ?? "");
  const [audience, setAudience] = useState<string[]>(raise?.audience ?? []);
  const [description, setDescription] = useState(raise?.description ?? "");
  const [ticketMin, setTicketMin] = useState(
    raise?.ticketMin ? String(raise.ticketMin) : "",
  );
  const [ticketMax, setTicketMax] = useState(
    raise?.ticketMax ? String(raise.ticketMax) : "",
  );
  const [leadStatut, setLeadStatut] = useState(raise?.leadStatut ?? "");
  const [partCapital, setPartCapital] = useState(
    raise?.partCapital ? String(raise.partCapital) : "",
  );

  // Se calcule à la saisie, pas à l'enregistrement : découvrir une fourchette
  // inversée après avoir rempli tout le formulaire est une punition.
  const ticketInverse =
    enNombre(ticketMin) !== null &&
    enNombre(ticketMax) !== null &&
    (enNombre(ticketMin) as number) > (enNombre(ticketMax) as number);

  async function enregistrer() {
    setBusy(true);
    setErreur(null);

    const res = await saveV2Raise({
      operationId,
      name,
      stage,
      target: enNombre(target),
      currency,
      instrument,
      preMoney: enNombre(preMoney),
      deadline: deadline || null,
      audience,
      description,
      ticketMin: enNombre(ticketMin),
      ticketMax: enNombre(ticketMax),
      leadStatut: leadStatut || null,
      partCapital: enNombre(partCapital),
    });

    setBusy(false);
    if (!res.ok) {
      // PAS DE MISE AU POINT SUR LE CHAMP FAUTIF ici, bien que l'action rende
      // désormais `res.champ` : cet écran n'a ni `<form>` ni attributs `name`,
      // ses champs sont contrôlés un par un. Un `querySelector` ne trouverait
      // rien et ferait semblant. Les messages nomment le champ en toutes
      // lettres — « la part de capital se saisit entre 0 et 100 » —, ce qui
      // suffit sur un écran d'une douzaine de champs.
      setErreur(messageDErreur(res.code));
      return;
    }

    router.push(`${retour}?view=overview&configured=1`);
    router.refresh();
  }

  function basculerAudience(valeur: string) {
    setAudience((liste) =>
      liste.includes(valeur)
        ? liste.filter((autre) => autre !== valeur)
        : [...liste, valeur],
    );
  }

  return (
    <div className="v2-lever-focus">
      <div className="v2-wizard-heading">
        <span>Lever /</span>
        <strong>Configurer la levée</strong>
        <Link href={`${retour}?view=overview`}>×</Link>
      </div>

      <section className="v2-configure-card">
        <header>
          <h1>Configurer la levée</h1>
          <p>
            Les informations restent modifiables tant que la levée n’est pas
            clôturée.
          </p>
        </header>

        {erreur && (
          <p className="v2-auth-error" role="alert">
            {erreur}
          </p>
        )}

        <div className="v2-configure-section">
          <span className="v2-configure-number">1</span>
          <div>
            <h2>Objectif</h2>
            <div className="v2-wizard-grid">
              <label className="v2-field">
                <span>Nom de la levée</span>
                <span className="v2-control">
                  <input
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Série A 2026"
                    value={name}
                  />
                </span>
              </label>

              <label className="v2-field">
                <span>Stade</span>
                <span className="v2-control">
                  <select
                    onChange={(event) => setStage(event.target.value)}
                    value={stage}
                  >
                    {STADES.map(([valeur, label]) => (
                      <option key={valeur} value={valeur}>{label}</option>
                    ))}
                  </select>
                </span>
              </label>

              <label className="v2-field">
                <span>Montant recherché</span>
                <span className="v2-control">
                  <input
                    inputMode="numeric"
                    onChange={(event) => setTarget(event.target.value)}
                    placeholder="500 000 000"
                    value={target}
                  />
                </span>
              </label>

              <label className="v2-field">
                <span>Devise</span>
                <span className="v2-control">
                  <select
                    onChange={(event) => setCurrency(event.target.value)}
                    value={currency}
                  >
                    {DEVISES.map(([valeur, label]) => (
                      <option key={valeur} value={valeur}>{label}</option>
                    ))}
                  </select>
                </span>
              </label>

              <label className="v2-field">
                <span>Instrument envisagé</span>
                <span className="v2-control">
                  <select
                    onChange={(event) => setInstrument(event.target.value)}
                    value={instrument}
                  >
                    {INSTRUMENTS.map(([valeur, label]) => (
                      <option key={valeur} value={valeur}>{label}</option>
                    ))}
                  </select>
                </span>
              </label>

              <label className="v2-field">
                <span>
                  Clôture visée <small>— facultatif</small>
                </span>
                <span className="v2-control">
                  <input
                    onChange={(event) => setDeadline(event.target.value)}
                    type="date"
                    value={deadline}
                  />
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="v2-configure-section">
          <span className="v2-configure-number">2</span>
          <div>
            <h2>Conditions déclarées</h2>
            <div className="v2-wizard-grid">
              <label className="v2-field">
                <span>
                  Valorisation pré-money <small>— facultatif</small>
                </span>
                <span className="v2-control">
                  <input
                    inputMode="numeric"
                    onChange={(event) => setPreMoney(event.target.value)}
                    placeholder="2 000 000 000"
                    value={preMoney}
                  />
                </span>
              </label>

              <label className="v2-field">
                <span>
                  Part de capital envisagée <small>— facultatif</small>
                </span>
                <span className="v2-control">
                  <input
                    inputMode="decimal"
                    onChange={(event) => setPartCapital(event.target.value)}
                    placeholder="15"
                    value={partCapital}
                  />
                  <span className="v2-control-suffixe">%</span>
                </span>
              </label>

              <label className="v2-field">
                <span>
                  Ticket minimum <small>— facultatif</small>
                </span>
                <span className="v2-control">
                  <input
                    inputMode="numeric"
                    onChange={(event) => setTicketMin(event.target.value)}
                    placeholder="25 000 000"
                    value={ticketMin}
                  />
                </span>
              </label>

              <label className="v2-field">
                <span>
                  Ticket maximum <small>— facultatif</small>
                </span>
                <span className="v2-control">
                  <input
                    inputMode="numeric"
                    onChange={(event) => setTicketMax(event.target.value)}
                    placeholder="150 000 000"
                    value={ticketMax}
                  />
                </span>
              </label>

              <label className="v2-field">
                <span>
                  Investisseur principal <small>— facultatif</small>
                </span>
                <span className="v2-control">
                  <select
                    onChange={(event) => setLeadStatut(event.target.value)}
                    value={leadStatut}
                  >
                    <option value="">Non renseigné</option>
                    <option value="recherche">Recherché</option>
                    <option value="trouve">Trouvé</option>
                    <option value="sans_lead">Ce tour s’en passe</option>
                  </select>
                </span>
              </label>
            </div>
            {/* La cohérence se dit AVANT l'enregistrement : l'apprendre par un
                message après avoir rempli tout le formulaire serait une
                punition. Le serveur la vérifie aussi — ce commentaire affirmait
                que la base refusait une fourchette inversée, ce qui était faux :
                `save_raise` l'acceptait, et l'écran affichait ensuite
                « 25 M – 5 M XOF ». */}
            {ticketInverse && (
              <p className="v2-panel-note">
                Le ticket minimum dépasse le maximum — vérifiez les deux
                montants avant d’enregistrer.
              </p>
            )}
          </div>
        </div>

        <div className="v2-configure-section">
          <span className="v2-configure-number">3</span>
          <div>
            <h2>Cibles</h2>
            <div className="v2-chip-row">
              {AUDIENCES.map(([valeur, label]) => (
                <button
                  data-active={audience.includes(valeur)}
                  key={valeur}
                  onClick={() => basculerAudience(valeur)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="v2-field">
              <span>
                Thèse ou contexte <small>— facultatif</small>
              </span>
              <span className="v2-control">
                <textarea
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ce qu’un investisseur doit comprendre avant d’ouvrir les documents."
                  rows={3}
                  value={description}
                />
              </span>
            </label>
          </div>
        </div>

        <footer>
          <Link href={`${retour}?view=overview`}>Annuler</Link>
          <button
            className="v2-btn"
            disabled={busy}
            onClick={enregistrer}
            type="button"
          >
            {busy ? "Enregistrement…" : "Enregistrer la levée"}
          </button>
        </footer>
      </section>
    </div>
  );
}

/**
 * Écran 35 — aucune levée sur cette opération.
 *
 * Le bouton dit « Configurer », il doit donc MENER à la configuration. Une
 * première version se contentait de créer la levée puis de rafraîchir : le
 * paramètre `view` de l'URL restait celui d'avant, et un fondateur arrivé
 * depuis l'onglet Pipeline se retrouvait sur le pipeline. Croyant qu'il ne
 * s'était rien passé, il recliquait — et la base garde la trace de trois
 * « Nouvelle levée » vides créées ainsi.
 */
export function RaiseEmpty({
  operationId,
  retour,
}: {
  operationId: string;
  retour: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function ouvrir() {
    setBusy(true);
    setErreur(null);

    const res = await createV2Raise({ operationId });
    setBusy(false);

    if (!res.ok) {
      // Un échec silencieux fait recliquer. C'est exactement ce qui a produit
      // les levées vides : la RPC refusait, et l'écran ne disait rien.
      setErreur(messageDErreur(res.code));
      return;
    }

    router.push(`${retour}?view=configure`);
    router.refresh();
  }

  return (
    <div>
      <button className="v2-btn" disabled={busy} onClick={ouvrir} type="button">
        {busy ? "Ouverture…" : "Configurer ma levée"}
      </button>
      {erreur && (
        <p className="v2-auth-error" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

/** Écran 45 — clôturer la levée. */
export function RaiseClose({
  operationId,
  raise,
  retour,
}: {
  operationId: string;
  raise: Raise;
  retour: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [montant, setMontant] = useState(
    raise.secured ? String(raise.secured) : "",
  );
  const [note, setNote] = useState("");

  async function cloturer() {
    setBusy(true);
    setErreur(null);

    const res = await closeV2Raise({
      operationId,
      finalAmount: enNombre(montant),
      note,
    });

    setBusy(false);
    if (!res.ok) {
      setErreur(messageDErreur(res.code));
      return;
    }

    router.push(`${retour}?view=overview`);
    router.refresh();
  }

  return (
    <div className="v2-lever-focus">
      <div className="v2-wizard-heading">
        <span>Lever /</span>
        <strong>Clôturer la levée</strong>
        <Link href={`${retour}?view=overview`}>×</Link>
      </div>

      <section className="v2-close-card">
        <header>
          <h1>Clôturer {raise.name ?? "la levée"}</h1>
          <p>
            La levée rejoint l’historique de financement. Rien n’est supprimé :
            les pièces, les accès et le journal restent consultables.
          </p>
        </header>

        {erreur && (
          <p className="v2-auth-error" role="alert">
            {erreur}
          </p>
        )}

        <label className="v2-field">
          <span>Montant finalement levé</span>
          <span className="v2-control">
            <input
              inputMode="numeric"
              onChange={(event) => setMontant(event.target.value)}
              placeholder={raise.target ? String(raise.target) : "450 000 000"}
              value={montant}
            />
          </span>
        </label>
        {raise.target != null && (
          <small className="v2-close-hint">
            sur {raise.target.toLocaleString("fr-FR")} {raise.currency} recherchés
          </small>
        )}

        <label className="v2-field">
          <span>
            Note de clôture <small>— facultative</small>
          </span>
          <span className="v2-control">
            <textarea
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ce qu’il faudra se rappeler de ce tour."
              rows={3}
              value={note}
            />
          </span>
        </label>

        <p className="v2-panel-note">
          <Icon name="shield" />
          Les accès externes ne sont pas touchés : ils gardent leurs échéances.
          Pour les fermer, révoquez-les depuis Partage et accès — un accès qu’on
          croit clos parce qu’un tour est fini reste un accès ouvert.
        </p>

        <footer>
          <Link href={`${retour}?view=overview`}>Annuler</Link>
          <button
            className="v2-btn"
            disabled={busy}
            onClick={cloturer}
            type="button"
          >
            {busy ? "Clôture…" : "Clôturer la levée"}
          </button>
        </footer>
      </section>
    </div>
  );
}
