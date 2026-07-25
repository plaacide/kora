"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Champ mot de passe avec œil de révélation.
 *
 * Séparé de `Input` (composant serveur) : l'affichage/masquage demande un état
 * client, et faire basculer `Input` en « use client » entraînerait tous les
 * formulaires qui l'utilisent.
 *
 * Le bouton est `tabIndex={-1}` : au clavier, la tabulation doit aller du mot
 * de passe au bouton d'envoi, pas s'arrêter sur une commande d'affichage. Il
 * reste actionnable à la souris et annoncé aux lecteurs d'écran.
 */
export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: string;
  /** Libellés accessibles du bouton (i18n). */
  showLabel?: string;
  hideLabel?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { className, label, hint, id, showLabel = "Afficher le mot de passe", hideLabel = "Masquer le mot de passe", ...props },
    ref,
  ) {
    const [visible, setVisible] = React.useState(false);
    const inputId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[11.5px] font-medium text-ink-secondary">
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={cn(
              "h-8 w-full pl-2.5 pr-9 text-[12.5px] bg-surface text-ink rounded-field",
              "border border-line placeholder:text-ink-placeholder",
              "focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-accent",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? hideLabel : showLabel}
            aria-pressed={visible}
            title={visible ? hideLabel : showLabel}
            className="absolute right-0 top-0 h-8 w-9 grid place-items-center text-ink-muted hover:text-ink cursor-pointer"
          >
            {visible ? (
              // Œil barré : le mot de passe est visible, cliquer le masque.
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.61 6.61A18.6 18.6 0 0 0 2 12s3 8 10 8a9.1 9.1 0 0 0 5.39-1.61" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <path d="m2 2 20 20" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {hint && <span className="text-[11px] text-ink-muted">{hint}</span>}
      </div>
    );
  },
);
