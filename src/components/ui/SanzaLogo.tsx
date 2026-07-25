/**
 * Logo « vibration » Sanza : le dernier « a » de « sanza » vibre — deux échos
 * orange décalés à droite, DERRIÈRE la lettre. Toujours en bas de casse,
 * Instrument Sans 700, letter-spacing -0.015em.
 *
 * Règles (cf. brand handoff) : jamais d'écho sur une autre lettre, jamais sur
 * fond orange. `animate` uniquement sur l'écran de connexion / splash.
 */
/**
 * Un écho du « a », décalé et estompé, DERRIÈRE la lettre.
 *
 * Défini au niveau du module et non dans `SanzaLogo` : un composant recréé à
 * chaque rendu casse la réconciliation de React (règle `static-components`), et
 * couleur/animation lui suffisent en props.
 */
function Echo({
  off,
  op,
  color,
  animate,
}: {
  off: string;
  op: number;
  color: string;
  animate: boolean;
}) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: off,
        top: 0,
        color,
        opacity: op,
        animation: animate ? "sz-vib 2.4s ease-in-out infinite" : "none",
      }}
    >
      a
    </span>
  );
}

export function SanzaLogo({
  size = 22,
  dark = false,
  animate = false,
  markOnly = false,
}: {
  size?: number;
  dark?: boolean;
  animate?: boolean;
  /**
   * Le « a » vibrant SEUL, sans « sanz » devant — la signature réduite, pour
   * l'écran de chargement. C'est bien le même dessin : les décalages d'écho
   * ne sont définis qu'ici, et ne doivent jamais être recopiés ailleurs.
   */
  markOnly?: boolean;
}) {
  const main = dark ? "#ffffff" : "#171a2c";
  const echo = dark ? "#f08a5e" : "#e85c2b";

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
      {!markOnly && "sanz"}
      <span style={{ position: "relative", display: "inline-block" }}>
        <Echo off="0.52em" op={0.3} color={echo} animate={animate} />
        <Echo off="0.26em" op={0.55} color={echo} animate={animate} />
        <span style={{ position: "relative" }}>a</span>
      </span>
    </span>
  );
}
