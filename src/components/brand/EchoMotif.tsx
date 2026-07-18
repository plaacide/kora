/**
 * Motif « écho » : groupes de 3 barres verticales (2 orange + 1 pleine) de
 * hauteurs variées. Décor pour bannières, en-têtes vides, onboarding,
 * /bienvenue. Jamais en fond entier.
 */
export function EchoMotif({
  dark = false,
  groups = 2,
}: {
  dark?: boolean;
  groups?: number;
}) {
  const solid = dark ? "#ffffff" : "#171a2c";
  // Hauteurs variées par barre (px) — la 3e (pleine) domine.
  const bars = [
    { h: 14, c: "#e85c2b", o: 0.3 },
    { h: 22, c: "#e85c2b", o: 0.55 },
    { h: 30, c: solid, o: 1 },
  ];
  return (
    <div className="flex items-end gap-2" aria-hidden>
      {Array.from({ length: groups }).map((_, g) => (
        <div key={g} className="flex items-end gap-[3px]">
          {bars.map((b, i) => (
            <span
              key={i}
              style={{
                width: 4,
                height: b.h,
                background: b.c,
                opacity: b.o,
                borderRadius: 999,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
