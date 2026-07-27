"use client";

import { useState } from "react";
import { VitrineGrid, type FicheCarte, type Instrument } from "./VitrineGrid";

/**
 * Porte l'instrument choisi, qui doit survivre au passage sur une fiche.
 *
 * Il vit ici plutôt que dans la grille parce qu'il ne sert pas qu'à filtrer :
 * il décide de la LECTURE de la fiche et de l'instrument que portera la
 * demande d'accès. Le perdre au clic ferait arriver un investisseur venu pour
 * de la dette sur une lecture equity — et sa demande partirait avec le mauvais
 * instrument, que la startup lirait comme une erreur.
 */
export function VitrineClient({ fiches }: { fiches: FicheCarte[] }) {
  const [instrument, setInstrument] = useState<Instrument>("equity");
  return (
    <VitrineGrid fiches={fiches} instrument={instrument} onInstrument={setInstrument} />
  );
}
