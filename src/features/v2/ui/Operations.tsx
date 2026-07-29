import Link from "next/link";

import type { OperationCard, OperationType } from "../domain/operation";
import { v2Routes } from "../navigation/routes";
import { Icon } from "./Icon";
import { Standalone } from "./Shell";

/**
 * Écrans 52, 53 et 54 — la liste des opérations dans ses trois états.
 * Repris de `52-operations-vide.html`, `53-operations-une.html` et
 * `54-operations-multiples.html`.
 *
 * La liste s'affiche dès la première opération : les maquettes en donnent un
 * état dédié, il n'y a donc rien à sauter.
 */

const TYPE_LABELS: Record<OperationType, string> = {
  equity: "Capital",
  bank_debt: "Dette",
  dfi_or_grant: "Institution",
  due_diligence: "Diligence",
  undecided: "Objectif à préciser",
};

function plural(count: number, one: string, many: string): string {
  return `${count} ${count > 1 ? many : one}`;
}

function lastActivity(iso: string | null): string {
  if (!iso) return "Aucune activité";
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "activité à l’instant";
  if (hours < 24) return `activité il y a ${plural(hours, "heure", "heures")}`;
  const days = Math.floor(hours / 24);
  return `activité il y a ${plural(days, "jour", "jours")}`;
}

function Row({ operation }: { operation: OperationCard }) {
  const archived = operation.lifecycle === "archived";
  const href = v2Routes.operations.overview(operation.id);

  return (
    <article className="v2-op-row">
      <div>
        <div className="v2-op-name">
          <b>{operation.name}</b>
          {archived && <span className="v2-status">Lecture seule</span>}
        </div>
        <div className="v2-op-meta">
          {TYPE_LABELS[operation.type]} ·{" "}
          {archived ? (
            "Clôturée"
          ) : (
            <>
              <span className="v2-status" data-tone="green">
                <i className="v2-dot" />
                Active
              </span>{" "}
              · {operation.preparation} % prête
            </>
          )}
        </div>
        {!archived && (
          <div className="v2-op-sub">
            {operation.guestCount > 0
              ? `${plural(operation.guestCount, "invité", "invités")} · ${lastActivity(operation.lastActivityAt)}`
              : "Aucun accès externe"}
          </div>
        )}
      </div>
      <Link className="v2-btn-mini" href={href}>Ouvrir</Link>
      <button aria-label={`Options — ${operation.name}`} className="v2-icon-button" type="button">
        <Icon name="more" />
      </button>
    </article>
  );
}

export function OperationsList({
  operations,
}: {
  operations: readonly OperationCard[];
}) {
  if (operations.length === 0) {
    return (
      <Standalone search={false} title="Opérations">
        <div className="v2-op-empty">
          <div>
            <h1>Opérations</h1>
            <p>Retrouvez ici vos levées, financements et diligences.</p>
          </div>
          <section>
            <span className="v2-op-empty-mark"><Icon name="briefcase" /></span>
            <div>
              <h2>Aucune opération</h2>
              <p>
                Créez votre première opération pour préparer une levée, un
                financement bancaire ou une diligence.
              </p>
            </div>
            <Link className="v2-btn" href="/v2/operations/nouvelle">
              Créer une opération
            </Link>
            <span className="v2-op-empty-note">
              <Icon name="lock" />
              Votre data room restera privée jusqu’à ce que vous décidiez de la
              partager.
            </span>
          </section>
        </div>
      </Standalone>
    );
  }

  const active = operations.filter((item) => item.lifecycle !== "archived");
  const archived = operations.filter((item) => item.lifecycle === "archived");

  return (
    <Standalone
      action={
        <Link className="v2-btn" href="/v2/operations/nouvelle">
          <Icon name="plus" />
          Nouvelle opération
        </Link>
      }
      search={false}
      title="Opérations"
    >
      <div className="v2-op-list">
        {active.length > 0 && <div className="v2-nav-label">Actives</div>}
        {active.map((operation) => (
          <Row key={operation.id} operation={operation} />
        ))}

        {archived.length > 0 && (
          <div className="v2-nav-label" data-spaced="true">Archivées</div>
        )}
        {archived.map((operation) => (
          <Row key={operation.id} operation={operation} />
        ))}
      </div>
    </Standalone>
  );
}
