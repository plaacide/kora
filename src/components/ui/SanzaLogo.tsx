/**
 * Logo « vibration » Sanza : le dernier « a » de « sanza » vibre — deux échos
 * orange décalés à droite, DERRIÈRE la lettre. Toujours en bas de casse,
 * Instrument Sans 700, letter-spacing -0.015em.
 *
 * Règles (cf. brand handoff) : jamais d'écho sur une autre lettre, jamais sur
 * fond orange. `animate` uniquement sur l'écran de connexion / splash.
 */
export function SanzaLogo({
  size = 22,
  dark = false,
  animate = false,
}: {
  size?: number;
  dark?: boolean;
  animate?: boolean;
}) {
  const main = dark ? "#ffffff" : "#171a2c";
  const echo = dark ? "#f08a5e" : "#e85c2b";

  const Echo = ({ off, op }: { off: string; op: number }) => (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: off,
        top: 0,
        color: echo,
        opacity: op,
        animation: animate ? "sz-vib 2.4s ease-in-out infinite" : "none",
      }}
    >
      a
    </span>
  );

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily: "var(--font-instrument), 'Instrument Sans', sans-serif",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.015em",
        color: main,
        lineHeight: 1,
      }}
    >
      sanz
      <span style={{ position: "relative", display: "inline-block" }}>
        <Echo off="0.16em" op={0.3} />
        <Echo off="0.08em" op={0.55} />
        <span style={{ position: "relative" }}>a</span>
      </span>
    </span>
  );
}
