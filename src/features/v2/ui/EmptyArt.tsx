import Image from "next/image";

import { Icon, type IconName } from "./Icon";

/**
 * Illustrations d'états vides du handoff (`maquettes/screens/assets/`).
 *
 * Le handoff n'en fournit que TROIS, et chacune est attachée à un écran
 * précis — ce n'est pas un décor interchangeable :
 *
 *   · `documents` — vue d'ensemble à l'arrivée (08) et accueil premier jour (74)
 *   · `files`     — data room vide (14) : elle dit « déposez vos pièces »
 *   · `search`    — levée non configurée (35)
 *
 * Poser `files` sur un écran qui ne parle pas de dépôt lui fait raconter autre
 * chose que ce qu'il fait. Pour les états vides que le handoff ne couvre pas,
 * voir `EmptyMedallion` plus bas.
 */
const ART = {
  documents: { file: "empty-documents.png", size: 104 },
  files: { file: "empty-file-manager.png", size: 150 },
  search: { file: "empty-search.png", size: 170 },
} as const;

export function EmptyArt({
  name,
  size,
}: {
  name: keyof typeof ART;
  /**
   * La même illustration n'a pas la même taille partout : 104 px en ligne
   * dans la maquette 08, 120 px centrée dans la 74.
   */
  size?: number;
}) {
  const art = ART[name];
  const cote = size ?? art.size;

  return (
    <Image
      alt=""
      className="v2-empty-art"
      data-art={name}
      height={cote}
      src={`/v2/${art.file}`}
      width={cote}
    />
  );
}

/**
 * L'état vide des écrans que le handoff ne dessine pas.
 *
 * Les maquettes 11 et 24 sont toujours pleines : elles ne montrent jamais une
 * préparation sans exigence ni un partage sans invité. Ces états existent
 * pourtant — au premier jour, ce sont les seuls qu'on voit.
 *
 * Plutôt que d'emprunter une des trois illustrations et de lui faire dire
 * autre chose, on reprend le médaillon déjà utilisé ailleurs dans le produit :
 * même famille visuelle, sans détourner un dessin de son écran.
 */
export function EmptyMedallion({ icon }: { icon: IconName }) {
  return (
    <span className="v2-empty-medallion">
      <Icon name={icon} />
    </span>
  );
}
