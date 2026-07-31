"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { nomCourt } from "@/features/v2/domain/journal";
import type { OperationFiltre, ResultatRecherche } from "@/features/v2/server/search";
import { EmptyMedallion } from "./EmptyArt";
import { Icon } from "./Icon";

/**
 * Écran 66 — la recherche, à travers les opérations.
 *
 * Hors d'une opération, un nom de fichier ne suffit pas : deux dossiers
 * peuvent porter un « business plan ». Chaque résultat affiche donc son chemin
 * complet, Opération › Dossier, et une archive le dit.
 *
 * La requête vit dans l'URL. C'est ce qui rend une recherche partageable avec
 * un associé, et retrouvable dans l'historique du navigateur — un état local
 * disparaîtrait au premier rechargement.
 */
export function SearchScreen({
  terme,
  operations,
  operationId,
  archivees,
  resultats,
}: {
  terme: string;
  operations: readonly OperationFiltre[];
  operationId: string | null;
  archivees: boolean;
  resultats: readonly ResultatRecherche[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [saisie, setSaisie] = useState(terme);

  // La frappe ne part pas au serveur à chaque touche : on attend une pause.
  // Sans ce délai, taper « business plan » déclencherait treize requêtes dont
  // douze arriveraient dans le désordre.
  useEffect(() => {
    if (saisie === terme) return;

    const minuteur = setTimeout(() => {
      const params = new URLSearchParams();
      if (saisie.trim()) params.set("q", saisie.trim());
      if (operationId) params.set("operation", operationId);
      if (archivees) params.set("archivees", "1");
      router.replace(`${pathname}?${params}`, { scroll: false });
    }, 300);

    return () => clearTimeout(minuteur);
  }, [saisie, terme, operationId, archivees, pathname, router]);

  const lien = (patch: { operation?: string | null; archivees?: boolean }) => {
    const params = new URLSearchParams();
    if (terme) params.set("q", terme);

    const op = patch.operation === undefined ? operationId : patch.operation;
    if (op) params.set("operation", op);

    const arch = patch.archivees === undefined ? archivees : patch.archivees;
    if (arch) params.set("archivees", "1");

    return `${pathname}?${params}`;
  };

  const nbOperations = new Set(resultats.map((r) => r.operationId)).size;
  const actives = operations.filter((op) => !op.archived);

  return (
    <div className="v2-search-page">
      <label className="v2-control v2-search-field">
        <Icon name="search" />
        <input
          autoFocus
          onChange={(event) => setSaisie(event.target.value)}
          placeholder="Rechercher une pièce dans vos data rooms…"
          type="search"
          value={saisie}
        />
      </label>

      <div className="v2-search-scopes">
        <Link data-active={!operationId && !archivees} href={lien({ operation: null, archivees: false })}>
          Toutes les opérations
        </Link>
        {actives.map((operation) => (
          <Link
            data-active={operationId === operation.id}
            href={lien({ operation: operation.id, archivees: false })}
            key={operation.id}
          >
            {operation.name}
          </Link>
        ))}
        {operations.some((op) => op.archived) && (
          <Link data-active={archivees} href={lien({ operation: null, archivees: true })}>
            Archivées
          </Link>
        )}
      </div>

      {terme.trim().length < 2 ? (
        <section className="v2-drop-empty">
          <EmptyMedallion icon="search" />
          <h2>Que cherchez-vous ?</h2>
          <p>
            Tapez au moins deux lettres. La recherche porte sur le nom des
            pièces, dans toutes vos opérations — chaque résultat indique où il
            se trouve.
          </p>
        </section>
      ) : resultats.length === 0 ? (
        <section className="v2-drop-empty">
          <EmptyMedallion icon="search" />
          <h2>Aucune pièce ne porte ce nom</h2>
          <p>
            Rien ne correspond à « {nomCourt(terme, 40)} »
            {operationId ? " dans cette opération" : ""}
            {archivees ? " parmi les opérations archivées" : ""}. Essayez un mot
            plus court, ou élargissez à toutes les opérations.
          </p>
        </section>
      ) : (
        <>
          <p className="v2-search-count">
            {resultats.length} résultat{resultats.length > 1 ? "s" : ""} dans{" "}
            {nbOperations} opération{nbOperations > 1 ? "s" : ""}
          </p>

          <ul className="v2-search-results">
            {resultats.map((resultat) => (
              <li key={resultat.id}>
                <Icon name="file" />
                <Link href={`/v2/documents/${resultat.id}`}>
                  <strong>{resultat.name}</strong>
                  <small>
                    {resultat.operationName}
                    {resultat.archived && " (archivée)"} ›{" "}
                    {resultat.folderPath ?? "Racine"}
                  </small>
                </Link>
                <span>
                  {resultat.versionNo ? `v${resultat.versionNo} · ` : ""}
                  déposé le{" "}
                  {new Date(resultat.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
