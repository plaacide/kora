"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Renommer sur place — le nom lui-même devient le champ.
 *
 * POURQUOI PAS UNE FENÊTRE. Renommer est le geste le plus courant d'une data
 * room, et le seul dont le résultat est déjà sous les yeux : ouvrir une
 * fenêtre pour retaper un mot fait perdre le contexte qu'on avait — les
 * voisins, l'ordre, ce à quoi on comparait.
 *
 * L'ENREGISTREMENT SE FAIT AU CLIC AILLEURS, décision du fondateur. C'est la
 * convention des gestionnaires de fichiers : on tape, on s'en va, c'est écrit.
 * Entrée valide aussi, Échap annule — mais aucun de ces deux raccourcis n'est
 * nécessaire pour que le geste aboutisse.
 *
 * TROIS CAS QUI NE DOIVENT RIEN ÉCRIRE : un nom inchangé, un nom vide, et un
 * second départ pendant que le premier vole. Le troisième est le plus vicieux —
 * `blur` se déclenche aussi quand la page se recharge après l'enregistrement,
 * ce qui relancerait le même appel en boucle.
 */
/**
 * L'événement qui ouvre l'édition depuis ailleurs.
 *
 * POURQUOI UN ÉVÉNEMENT, ET NON UN ÉTAT PARTAGÉ. « Renommer » est proposé à
 * deux endroits : sur le nom, et dans le menu « ⋯ ». Or le menu vit dans un
 * PORTAIL, rattaché à `document.body` — il n'est pas dans l'arbre React de la
 * ligne, et aucun état ne peut descendre de l'un vers l'autre sans remonter le
 * contexte jusqu'à la page entière. Un événement porté par la fenêtre traverse
 * les deux, et laisse chaque composant indépendant.
 */
const OUVRIR_EDITION = "sanza:renommer";

/** Ouvrir l'édition du nom identifié par `cle`, depuis n'importe où. */
export function demanderRenommage(cle: string): void {
  window.dispatchEvent(new CustomEvent(OUVRIR_EDITION, { detail: { cle } }));
}

export function NomEditable({
  cle,
  nom,
  onRenommer,
  titre,
}: {
  /** L'identifiant de la ligne — celui que le menu « ⋯ » rappellera. */
  cle: string;
  nom: string;
  onRenommer: (nom: string) => Promise<{ ok: boolean; error?: string }>;
  /** Ce qu'annonce le bouton d'édition aux lecteurs d'écran. */
  titre: string;
}) {
  const router = useRouter();
  const [edite, setEdite] = useState(false);
  const [valeur, setValeur] = useState(nom);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const enCours = useRef(false);

  // « Renommer » du menu « ⋯ » ouvre exactement la même édition que le clic
  // sur le nom : un seul geste à apprendre, quel que soit le chemin pris.
  useEffect(() => {
    const ouvrir = (event: Event) => {
      const vise = (event as CustomEvent<{ cle: string }>).detail?.cle;
      if (vise !== cle) return;
      setValeur(nom);
      setErreur(null);
      setEdite(true);
    };

    window.addEventListener(OUVRIR_EDITION, ouvrir);
    return () => window.removeEventListener(OUVRIR_EDITION, ouvrir);
  }, [cle, nom]);

  useEffect(() => {
    if (!edite) return;
    champ.current?.focus();
    // Le nom d'un fichier finit par une extension qu'on ne veut presque jamais
    // changer : on sélectionne tout de même l'ensemble, mais le curseur reste
    // manipulable — imposer une sélection partielle surprendrait davantage.
    champ.current?.select();
  }, [edite]);

  async function valider() {
    if (enCours.current) return;

    const propre = valeur.trim();

    // Rien à écrire : ni un nom inchangé, ni un nom vide. Le vide revient au
    // nom d'origine plutôt que d'afficher une erreur — on a manifestement
    // effacé pour retaper, puis renoncé.
    if (!propre || propre === nom) {
      setValeur(nom);
      setEdite(false);
      return;
    }

    enCours.current = true;
    setEnvoi(true);
    setErreur(null);

    const resultat = await onRenommer(propre);

    setEnvoi(false);
    enCours.current = false;

    if (!resultat.ok) {
      setErreur(resultat.error ?? "Le nom n’a pas pu être enregistré.");
      // On NE quitte PAS l'édition sur un échec : la saisie reste là, prête à
      // être corrigée. La perdre obligerait à tout retaper.
      return;
    }

    setEdite(false);
    router.refresh();
  }

  if (!edite) {
    return (
      <button
        aria-label={`Renommer ${titre}`}
        className="v2-nom-editable"
        onClick={(event) => {
          // La ligne entière est souvent un lien : sans cela, cliquer sur le
          // nom pour le corriger ouvrirait le document.
          event.preventDefault();
          event.stopPropagation();
          setValeur(nom);
          setEdite(true);
        }}
        type="button"
      >
        {nom}
      </button>
    );
  }

  return (
    <span className="v2-nom-editable-champ">
      <input
        disabled={envoi}
        onBlur={valider}
        onChange={(event) => setValeur(event.target.value)}
        onClick={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void valider();
          }
          if (event.key === "Escape") {
            setValeur(nom);
            setErreur(null);
            setEdite(false);
          }
        }}
        ref={champ}
        value={valeur}
      />
      {erreur && <small role="alert">{erreur}</small>}
    </span>
  );
}
