/**
 * Une destination portée par l'URL (`?suivant=`, `?next=`) ne doit jamais
 * quitter le site.
 *
 * `//evil.com` et `https://evil.com` sont des redirections ouvertes : après
 * connexion, l'utilisateur atterrit sur une page qui imite la nôtre et lui
 * redemande son mot de passe. Le paramètre vient de l'extérieur — d'un lien
 * d'e-mail, du presse-papiers, d'une page tierce — donc on ne le suit que s'il
 * commence par une seule barre oblique.
 *
 * ⚠️ Le double `//` est le piège : `"//evil.com".startsWith("/")` est vrai, et
 * le navigateur lit `//evil.com` comme `https://evil.com`. Les deux conditions
 * sont donc nécessaires, et c'est pour ne pas avoir à s'en souvenir à chaque
 * fois que la règle vit ici.
 *
 * Module NEUTRE (cf. AGENTS.md) : ni "use client" ni "use server". Exporté
 * depuis un module directive, Next remplacerait la fonction par une référence
 * et l'appel casserait à l'exécution — sans que le build le voie.
 */
export function cheminInterne(
  valeur: string | null | undefined,
  defaut: string,
): string {
  return valeur && valeur.startsWith("/") && !valeur.startsWith("//")
    ? valeur
    : defaut;
}
