"use client";

import { cn } from "@/lib/cn";

/**
 * Chips sélectionnables (pill). `multi` : plusieurs choix possibles ; sinon
 * choix unique. Actif : bordure orange + fond orange léger + texte brûlé.
 *
 * Chaque option porte une VALEUR et un LIBELLÉ distincts : la valeur part en
 * base et reste en français, le libellé suit la langue de l'utilisateur. Les
 * confondre ferait deux vocabulaires pour une même donnée.
 */
export interface ChipOption {
  value: string;
  label: string;
}

export function SelectChips({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: readonly ChipOption[];
  value: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
}) {
  function toggle(opt: string) {
    if (multi) {
      onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
    } else {
      onChange([opt]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            aria-pressed={active}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border transition-colors cursor-pointer",
              active
                ? "border-primary bg-[rgba(232,92,43,0.08)] text-[#c64b1e]"
                : "border-line text-ink-secondary hover:border-line-strong",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
