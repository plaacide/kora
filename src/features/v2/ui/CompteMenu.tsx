"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { logoutV2 } from "@/app/v2/(workspace)/actions";

import { Icon } from "./Icon";

/**
 * Le menu du compte, au pied du rail — et la seule sortie de la V2.
 *
 * L'avatar était un `<span>` décoratif : rien ne permettait de se déconnecter.
 * Il devient un bouton, et porte les deux gestes qui s'y attendent — voir son
 * compte, en sortir.
 *
 * LE MENU S'OUVRE VERS LE HAUT. L'avatar est collé au bas du rail : un menu
 * déroulant vers le bas sortirait de l'écran. Sa position est calculée à
 * l'ouverture, comme celle du menu « ⋯ » des lignes, et il est rendu par un
 * portail — le rail porte une animation dont la transformation retenue casse le
 * `position: fixed` de ses descendants.
 */
export function CompteMenu({ email }: { email: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [position, setPosition] = useState<{ bottom: number; left: number } | null>(
    null,
  );
  const declencheur = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  function basculer() {
    const cadre = declencheur.current?.getBoundingClientRect();
    if (cadre) {
      setPosition({
        bottom: window.innerHeight - cadre.top + 8,
        left: cadre.left,
      });
    }
    setOuvert((o) => !o);
  }

  useEffect(() => {
    if (!ouvert) return;

    const surPointeur = (event: MouseEvent) => {
      const cible = event.target as Node;
      if (menu.current?.contains(cible) || declencheur.current?.contains(cible)) {
        return;
      }
      setOuvert(false);
    };
    const surTouche = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOuvert(false);
        declencheur.current?.focus();
      }
    };
    // Un menu positionné en fixe se désolidarise de son ancre dès qu'on défile.
    const surDefilement = () => setOuvert(false);

    document.addEventListener("mousedown", surPointeur);
    document.addEventListener("keydown", surTouche);
    window.addEventListener("scroll", surDefilement, true);
    window.addEventListener("resize", surDefilement);
    return () => {
      document.removeEventListener("mousedown", surPointeur);
      document.removeEventListener("keydown", surTouche);
      window.removeEventListener("scroll", surDefilement, true);
      window.removeEventListener("resize", surDefilement);
    };
  }, [ouvert]);

  const initiales = email.slice(0, 2).toUpperCase() || "SA";

  return (
    <>
      <button
        aria-expanded={ouvert}
        aria-haspopup="menu"
        aria-label={`Compte — ${email}`}
        className="v2-avatar"
        onClick={basculer}
        ref={declencheur}
        title={email}
        type="button"
      >
        {initiales}
      </button>

      {ouvert && position && typeof document !== "undefined"
        ? createPortal(
            <div
              className="v2-compte-menu"
              ref={menu}
              role="menu"
              style={{ bottom: position.bottom, left: position.left }}
            >
              {/* L'adresse en entier : sur un poste partagé, deux initiales ne
                  disent pas de quel compte on s'apprête à sortir. */}
              <p className="v2-compte-email">{email}</p>

              <Link
                href="/v2/security"
                onClick={() => setOuvert(false)}
                role="menuitem"
              >
                <Icon name="shield" />
                Sécurité
              </Link>

              {/* Un formulaire et non un `onClick` : la déconnexion passe par
                  une Server Action, qui doit poser les cookies effacés dans SA
                  réponse. Un appel depuis le client les perdrait. */}
              <form action={logoutV2}>
                <button data-destructive="true" role="menuitem" type="submit">
                  <Icon name="logout" />
                  Se déconnecter
                </button>
              </form>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
