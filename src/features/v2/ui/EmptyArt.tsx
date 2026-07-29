import Image from "next/image";

/**
 * Illustrations d'états vides du handoff (`maquettes/screens/assets/`).
 *
 * Les maquettes 08, 14 et 35 affichent une illustration, pas une icône : elle
 * occupe la place et donne le ton d'un écran qui n'a encore rien à montrer.
 * Chaque taille est celle de sa maquette.
 */
const ART = {
  documents: { file: "empty-documents.png", size: 104 },
  files: { file: "empty-file-manager.png", size: 150 },
  search: { file: "empty-search.png", size: 170 },
} as const;

export function EmptyArt({ name }: { name: keyof typeof ART }) {
  const { file, size } = ART[name];

  return (
    <Image
      alt=""
      className="v2-empty-art"
      data-art={name}
      height={size}
      src={`/v2/${file}`}
      width={size}
    />
  );
}
