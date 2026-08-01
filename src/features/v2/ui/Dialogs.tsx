"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { setV2OperationArchived } from "@/app/v2/(workspace)/operations/actions";
import { messageDErreur } from "@/features/v2/domain/erreurs";

/**
 * L'archivage d'une opération — écran 60.
 *
 * CE QUE CE FICHIER ÉTAIT. Cinq dialogues repris des maquettes 59, 60 et 61,
 * tous décoratifs : deux boutons `type="button"` sans gestionnaire, et un
 * contenu écrit en dur qui annonçait « Série A 2026 » sur n'importe quelle
 * opération. Le menu « ⋯ » de la liste y menait pour de vrai — on confirmait un
 * archivage, la fenêtre se fermait, rien n'était archivé. Une action
 * destructrice qui a l'air de marcher est le pire des états.
 *
 * CE QUI EN RESTE. L'archivage seul, branché sur `set_deal_archived`, et qui
 * nomme l'opération qu'il va vraiment archiver.
 *
 * CE QUI EST PARTI, ET POURQUOI :
 *
 * — « Clôturer une opération » n'a AUCUN support en base. `deal_stage` est une
 *   énumération héritée de la V1 côté investisseur — sourcing, screening, due
 *   diligence, ic, signed, passed — qui décrit l'avancement d'un dossier
 *   d'investissement, pas la fin d'une opération de fondateur. La clôture qui
 *   existe vraiment est celle d'une LEVÉE (`close_raise`), et elle a déjà son
 *   écran. Brancher « Clôturer » sur `set_deal_stage` reviendrait à réutiliser
 *   un concept V1 pour ce qu'il ne dit pas.
 *
 * — Les deux dialogues de limite de plan ne sont atteignables par aucun lien.
 *   Le refus réel passe désormais par le catalogue d'erreurs, qui porte le même
 *   texte et son issue.
 *
 * — Le choix d'opération pour une cohorte attend `cohort_links`, qui n'existe
 *   pas.
 */

export function ArchiveOperationDialog({
  archived,
  name,
  operationId,
}: {
  /** L'état actuel : on désarchive aussi bien qu'on archive. */
  archived: boolean;
  name: string;
  operationId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function fermer() {
    router.push("/v2/operations");
  }

  async function confirmer() {
    setBusy(true);
    setErreur(null);

    const res = await setV2OperationArchived({
      operationId,
      archived: !archived,
    });

    setBusy(false);
    if (!res.ok) {
      // La fenêtre RESTE ouverte : la refermer ferait croire à un succès.
      setErreur(messageDErreur(res.code));
      return;
    }

    router.push("/v2/operations");
    router.refresh();
  }

  return (
    <>
      <div className="v2-scrim" onClick={busy ? undefined : fermer} />
      <div aria-modal="true" className="v2-dialog" role="dialog">
        <h2>
          {archived ? "Remettre" : "Archiver"} « {name} » ?
        </h2>
        <p>
          {archived
            ? "L’opération redeviendra modifiable et comptera de nouveau dans la limite de votre plan."
            : "L’opération passera en lecture seule et ne comptera plus dans votre limite. Aucun document ne sera supprimé, et les accès en cours restent valables."}
        </p>

        {erreur && (
          <p className="v2-dialog-error" role="alert">
            {erreur}
          </p>
        )}

        <footer>
          <button
            className="v2-btn"
            disabled={busy}
            onClick={() => void confirmer()}
            type="button"
          >
            {busy
              ? archived
                ? "Remise en cours…"
                : "Archivage en cours…"
              : archived
                ? "Remettre en activité"
                : "Archiver l’opération"}
          </button>
          <button
            className="v2-btn"
            data-variant="secondary"
            disabled={busy}
            onClick={fermer}
            type="button"
          >
            Annuler
          </button>
        </footer>

        <p className="v2-dialog-note">
          L’archivage est réversible : vous pourrez remettre cette opération en
          activité depuis la liste.
        </p>
      </div>
    </>
  );
}
