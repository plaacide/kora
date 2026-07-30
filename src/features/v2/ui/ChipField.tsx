"use client";

import { useState } from "react";

/**
 * Un choix à plusieurs réponses, en pastilles cliquables.
 *
 * Là où une liste déroulante n'en retient qu'une, ces champs en portent
 * plusieurs à la fois — « VC · Fonds à impact · DFI » est une réponse, pas
 * trois champs. Les convertir en `<select>` les aurait amputés.
 */
export function ChipField({
  label,
  options,
  defaultSelected = [],
  name,
}: {
  label: string;
  options: readonly string[];
  defaultSelected?: readonly string[];
  /** Rend les valeurs choisies au formulaire, une entrée par pastille active. */
  name?: string;
}) {
  const [selected, setSelected] = useState<readonly string[]>(defaultSelected);

  function toggle(value: string) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  return (
    <fieldset className="v2-chip-field">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button
            aria-pressed={selected.includes(option)}
            data-selected={selected.includes(option)}
            key={option}
            onClick={() => toggle(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      {name &&
        selected.map((value) => (
          <input key={value} name={name} type="hidden" value={value} />
        ))}
    </fieldset>
  );
}
