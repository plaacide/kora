import Link from "next/link";

import type { OperationCard, OperationType } from "../domain/operation";
import { v2Routes } from "../navigation/routes";
import { Icon } from "./Icon";
import { Standalone } from "./Shell";

const typeLabels: Record<OperationType, string> = {
  equity: "Levée en capital",
  bank_debt: "Financement bancaire",
  dfi_or_grant: "Institution ou bailleur",
  due_diligence: "Diligence",
  undecided: "Objectif à préciser",
};

function plural(count: number, singular: string, plural: string): string {
  return `${count} ${count > 1 ? plural : singular}`;
}

function lastActivityLabel(iso: string | null): string {
  if (!iso) return "Aucune activité";

  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000),
  );

  if (days <= 0) return "Activité aujourd’hui";
  if (days === 1) return "Activité hier";
  if (days < 31) return `Activité il y a ${days} jours`;
  if (days < 62) return "Activité il y a un mois";
  return `Activité il y a ${Math.floor(days / 31)} mois`;
}

function OperationTile({ operation }: { operation: OperationCard }) {
  const archived = operation.lifecycle === "archived";
  const shared = operation.sharingState === "shared";

  return (
    <Link
      className="v2-operation-card"
      data-archived={archived}
      href={v2Routes.operations.overview(operation.id)}
    >
      <header>
        <strong>{operation.name}</strong>
        <span className="v2-status" data-tone={shared ? "blue" : undefined}>
          {shared ? `Partagée — ${plural(operation.guestCount, "invité", "invités")}` : "Privée"}
        </span>
      </header>
      <p>
        {typeLabels[operation.type]}
        {archived && <span className="v2-badge">Archivée</span>}
      </p>
      <div className="v2-progress">
        <span style={{ width: `${operation.preparation}%` }} />
      </div>
      <small>{operation.preparation} % préparé</small>
      <footer>
        <span>
          <Icon name="file" />
          {plural(operation.documentCount, "pièce", "pièces")}
        </span>
        <span>
          <Icon name="users" />
          {plural(operation.guestCount, "invité", "invités")}
        </span>
        <span>
          <Icon name="clock" />
          {lastActivityLabel(operation.lastActivityAt)}
        </span>
      </footer>
    </Link>
  );
}

export function OperationsList({
  operations,
}: {
  operations: readonly OperationCard[];
}) {
  return (
    <Standalone title="Opérations">
      {operations.length === 0 ? (
        <section className="v2-empty-inline">
          <span className="v2-empty-illustration">
            <Icon name="briefcase" />
          </span>
          <div>
            <strong>Aucune opération</strong>
            <p>
              Une data room réunit les documents d’une opération. Vous en créerez
              une par levée, ou une seule si vous n’en menez qu’une.
            </p>
          </div>
        </section>
      ) : (
        <div className="v2-operation-list">
          {operations.map((operation) => (
            <OperationTile key={operation.id} operation={operation} />
          ))}
        </div>
      )}
    </Standalone>
  );
}
