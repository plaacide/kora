"use client";

import { cn } from "@/lib/cn";

/**
 * Chips sélectionnables (pill). `multi` : plusieurs choix possibles ; sinon
 * choix unique. Actif : bordure orange + fond orange léger + texte brûlé.
 */
export function SelectChips({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: string[];
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
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            aria-pressed={active}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border transition-colors cursor-pointer",
              active
                ? "border-primary bg-[rgba(232,92,43,0.08)] text-[#c64b1e]"
                : "border-line text-ink-secondary hover:border-line-strong",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
