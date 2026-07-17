/**
 * Numérotation d'un dossier de data room : « 1. Corporate » à la racine,
 * « 1.2 Statuts » en dessous — la convention des index de data room.
 *
 * Sans le point final, une racine se lisait « 1 Corporate ». Ce helper vit
 * dans un module neutre pour que TOUS les écrans qui affichent un index
 * (data room, matrice de permissions…) rendent la même chose.
 */
export function folderIndex(indexPath: string): string {
  return indexPath.includes(".") ? indexPath : `${indexPath}.`;
}
