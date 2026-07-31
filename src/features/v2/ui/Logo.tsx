/**
 * Le logo Sanza, repris des fichiers officiels du handoff
 * (`sanza_handoff/icon.svg` et `logo-wordmark-*.svg`).
 *
 * L'écran affichait jusqu'ici un carré portant la lettre « S », et les pages
 * d'authentification un « a » seul : ni l'un ni l'autre n'est le logo. Le
 * signe de la marque, ce sont les TROIS « a » superposés — un plein, deux en
 * écho orange dégressif — qui évoquent la répétition d'un dossier partagé.
 *
 * Le SVG est écrit ici plutôt que chargé en image parce qu'il est fait de
 * TEXTE : dans un fichier servi à part, la police se résoudrait contre celles
 * du système et le mot s'afficherait dans une autre fonte. Inline, il hérite de
 * `--font-instrument`, la police que le produit charge déjà.
 */

const PILE = "'Instrument Sans', ui-sans-serif, system-ui, sans-serif";

/** La police du produit, avec la pile du fichier officiel en secours. */
const POLICE = `var(--font-instrument), ${PILE}`;

/**
 * L'icône — fond sombre, trois « a ». Pour le rail replié et les favicons.
 */
export function SanzaMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      height={size}
      viewBox="0 0 512 512"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#171A2C" height="512" rx="128" width="512" />
      <g
        fontFamily={POLICE}
        fontSize="300"
        fontWeight="700"
        textAnchor="middle"
      >
        <text fill="#F08A5E" opacity="0.35" x="322" y="360">
          a
        </text>
        <text fill="#F08A5E" opacity="0.6" x="284" y="360">
          a
        </text>
        <text fill="#FFFFFF" x="246" y="360">
          a
        </text>
      </g>
    </svg>
  );
}

/**
 * Le logo complet — « sanza » avec ses trois « a ».
 *
 * `dark` sert les fonds sombres : le mot passe en blanc et les échos en orange
 * clair, exactement comme le fichier `logo-wordmark-dark-bg.svg`.
 */
export function SanzaWordmark({
  dark = false,
  height = 22,
}: {
  dark?: boolean;
  height?: number;
}) {
  const mot = dark ? "#FFFFFF" : "#171A2C";
  const echo = dark ? "#F08A5E" : "#E85C2B";
  const echoFort = dark ? 0.6 : 0.55;
  const echoFaible = dark ? 0.35 : 0.3;

  return (
    <svg
      height={height}
      role="img"
      viewBox="0 10 250 85"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Sanza</title>
      <g
        fontFamily={POLICE}
        fontSize="72"
        fontWeight="700"
        letterSpacing="-1"
      >
        <text fill={mot} x="10" y="80">
          sanz
        </text>
        <text fill={echo} opacity={echoFaible} x="197" y="80">
          a
        </text>
        <text fill={echo} opacity={echoFort} x="178" y="80">
          a
        </text>
        <text fill={mot} x="160" y="80">
          a
        </text>
      </g>
    </svg>
  );
}
