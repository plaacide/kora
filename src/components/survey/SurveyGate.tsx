"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { lireEtatEnquete, pingUsage } from "@/app/actions/survey";
import { interfaceOccupee } from "@/lib/ui-busy";
import { SurveyFlow } from "./SurveyFlow";
import {
  PING_MS,
  REESSAI_MS,
  eligible,
  routeAutorisee,
} from "@/lib/survey-rules";

/**
 * Décide SI et QUAND l'enquête peut s'afficher (§2 du handoff). Ce composant
 * ne dessine rien — il n'est que la porte ; le carton viendra derrière.
 *
 * Deux familles de conditions, volontairement séparées :
 *
 *  - PERSISTANTES (seuil de 30 min, déjà répondu, refus définitif, relance à
 *    7 jours) : elles vivent en base et se lisent au serveur. Un rechargement
 *    de page ne les remet pas à zéro, c'est tout l'intérêt.
 *  - VOLATILES (modal ouvert, dépôt en cours, onglet masqué, saisie en cours) :
 *    elles n'existent que dans l'instant. Si l'une tombe, on n'abandonne pas —
 *    on réessaie 60 s plus tard, sans jamais empiler deux invitations.
 */

/** Le temps ne compte que si l'utilisateur a fait quelque chose récemment. */
const INACTIVITE_MS = 120_000;

export function SurveyGate() {
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);
  // Initialisé à 0, pas à `Date.now()` : appeler une fonction impure pendant
  // le rendu est interdit par `react-hooks/purity`, et le rendu peut être
  // rejoué. L'horloge démarre au montage, dans l'effet ci-dessous.
  const derniereInteraction = useRef(0);
  const [contexte, setContexte] = useState<{ minutes: number; pays: string | null } | null>(null);

  // Toute interaction repousse l'horloge d'inactivité. `passive` : ces
  // écouteurs sont sur tout le document, ils ne doivent jamais retarder un
  // défilement.
  useEffect(() => {
    const vu = () => {
      derniereInteraction.current = Date.now();
    };
    // Arriver sur un écran EST une interaction : sans cela, le compteur
    // resterait gelé jusqu'au premier clic.
    vu();
    const evenements = ["pointerdown", "keydown", "scroll", "focus"] as const;
    for (const e of evenements) window.addEventListener(e, vu, { passive: true });
    return () => {
      for (const e of evenements) window.removeEventListener(e, vu);
    };
  }, []);

  // Ping d'usage. On n'envoie RIEN si l'onglet est masqué ou si plus de deux
  // minutes se sont écoulées sans geste : sans cela, un onglet oublié une nuit
  // atteindrait le seuil et l'enquête tomberait sur quelqu'un qui n'a rien
  // fait — donc sans avis à donner.
  useEffect(() => {
    const battement = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - derniereInteraction.current > INACTIVITE_MS) return;
      void pingUsage();
    }, PING_MS);
    return () => clearInterval(battement);
  }, []);

  /** Toutes les conditions volatiles de blocage, évaluées à l'instant. */
  const momentPropice = useCallback((): boolean => {
    if (!routeAutorisee(pathname)) return false;
    if (interfaceOccupee()) return false;
    if (document.visibilityState !== "visible") return false;
    if (!document.hasFocus()) return false;
    // Saisie en cours : on ne coupe pas quelqu'un qui écrit. C'est la lecture
    // la plus proche de « formulaire avec modifications non enregistrées » que
    // le dépôt permette aujourd'hui — aucun formulaire ne suit son état sale.
    const actif = document.activeElement;
    if (
      actif instanceof HTMLInputElement ||
      actif instanceof HTMLTextAreaElement ||
      (actif instanceof HTMLElement && actif.isContentEditable)
    ) {
      return false;
    }
    return true;
  }, [pathname]);

  // Tentative périodique. Le même intervalle sert de première évaluation et de
  // réessai : une seule horloge, donc aucune file d'invitations en attente.
  useEffect(() => {
    if (ouvert) return;
    let vivant = true;

    const tenter = async () => {
      if (!vivant || ouvert) return;
      if (!momentPropice()) return;

      const etat = await lireEtatEnquete();
      if (!vivant || !etat) return;
      if (!eligible({ ...etat, maintenantMs: Date.now() })) return;
      // Re-vérifié APRÈS l'aller-retour serveur : un modal a pu s'ouvrir
      // pendant. Sans ce second contrôle, le carton apparaîtrait par-dessus.
      if (!momentPropice()) return;

      setContexte({ minutes: etat.minutes, pays: etat.pays });
      setOuvert(true);
    };

    const horloge = setInterval(tenter, REESSAI_MS);
    return () => {
      vivant = false;
      clearInterval(horloge);
    };
  }, [ouvert, momentPropice]);

  if (!ouvert || !contexte) return null;
  return (
    <SurveyFlow
      minutes={contexte.minutes}
      pays={contexte.pays}
      onFermer={() => setOuvert(false)}
    />
  );
}
