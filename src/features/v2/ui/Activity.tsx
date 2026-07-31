"use client";

import { useState } from "react";

import { initials } from "@/features/v2/domain/activity";
import {
  FAMILLES,
  familleDe,
  grouperParJour,
  heure,
  verbeDe,
  type EntreeJournal,
  type FamilleJournal,
} from "@/features/v2/domain/journal";
import { EmptyMedallion } from "./EmptyArt";
import { Icon } from "./Icon";

/**
 * Écran 30 — le journal d'activité, d'une opération ou de l'organisation.
 *
 * C'est la surface de PREUVE : ce qu'on montre quand un investisseur conteste
 * avoir reçu une pièce. Le filtrage et la recherche portent donc sur ce qui
 * est déjà chargé, sans aller-retour serveur — un journal qui se recharge en
 * changeant d'onglet peut montrer deux réalités à deux secondes d'intervalle.
 */
export function ActivityScreen({
  entrees,
  portee,
}: {
  entrees: readonly EntreeJournal[];
  /** Ce que couvre ce journal : « cette opération », « votre organisation ». */
  portee: string;
}) {
  const [famille, setFamille] = useState<FamilleJournal>("tout");
  const [recherche, setRecherche] = useState("");

  const terme = recherche.trim().toLowerCase();

  const visibles = entrees.filter((entree) => {
    if (famille !== "tout" && familleDe(entree.action) !== famille) return false;
    if (!terme) return true;
    return (
      entree.actor.toLowerCase().includes(terme) ||
      entree.cible.toLowerCase().includes(terme) ||
      verbeDe(entree.action).toLowerCase().includes(terme)
    );
  });

  const journees = grouperParJour(visibles, new Date());

  function exporter() {
    // L'export porte l'horodatage COMPLET, pas l'heure abrégée de l'écran :
    // c'est cette précision qui fait sa valeur de preuve.
    const lignes = [
      ["Date", "Personne", "Rôle", "Action", "Objet"],
      ...visibles.map((entree) => [
        new Date(entree.at).toISOString(),
        entree.actor,
        entree.role,
        verbeDe(entree.action),
        entree.cible,
      ]),
    ];

    const csv = lignes
      .map((ligne) =>
        ligne.map((cellule) => `"${cellule.replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

    // Le BOM garde les accents lisibles dans Excel, qui devine l'encodage.
    const url = URL.createObjectURL(
      new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }),
    );
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `journal-${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="v2-journal-page">
      <div className="v2-filterbar">
        {FAMILLES.map(([valeur, label]) => (
          <button
            data-active={famille === valeur}
            key={valeur}
            onClick={() => setFamille(valeur)}
            type="button"
          >
            {label}
          </button>
        ))}
        <i />
        <input
          aria-label="Rechercher dans le journal"
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Rechercher dans le journal…"
          type="search"
          value={recherche}
        />
        <button
          className="v2-btn"
          data-variant="secondary"
          disabled={visibles.length === 0}
          onClick={exporter}
          type="button"
        >
          Exporter
        </button>
      </div>

      {entrees.length === 0 ? (
        <section className="v2-drop-empty">
          <EmptyMedallion icon="clock" />
          <h2>Le journal est vide</h2>
          <p>
            Rien n’a encore été fait sur {portee}. Chaque dépôt, chaque
            consultation et chaque accès s’y inscrira, avec sa date et son
            auteur.
          </p>
        </section>
      ) : journees.length === 0 ? (
        <p className="v2-panel-note">Rien ne correspond à cette recherche.</p>
      ) : (
        <div className="v2-journal">
          {journees.map((journee) => (
            <section key={journee.titre}>
              <h2>{journee.titre}</h2>
              <ul>
                {journee.entrees.map((entree) => (
                  <li key={entree.id}>
                    <span className="v2-person-avatar">
                      {initials(entree.actor)}
                    </span>
                    <p>
                      <b>{entree.actor}</b>
                      <em>· {entree.role}</em> {verbeDe(entree.action)}
                      {entree.cible && <strong> {entree.cible}</strong>}
                    </p>
                    <time>{heure(entree.at)}</time>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <footer>
            <Icon name="shield-check" />
            {entrees.length} entrée{entrees.length > 1 ? "s" : ""} conservée
            {entrees.length > 1 ? "s" : ""} pour {portee}. Le journal est
            chaîné : une ligne ne peut être ni modifiée ni retirée sans rompre
            la chaîne.
          </footer>
        </div>
      )}
    </div>
  );
}
