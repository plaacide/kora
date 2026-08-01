import { notFound } from "next/navigation";

/**
 * Rejoindre une cohorte — hors périmètre de la bêta.
 *
 * L'écran existait, mais affichait cinq lignes écrites en dur (« Nimba Solar
 * rejoint la cohorte… ») et IGNORAIT le jeton de l'URL. Une invitation réelle
 * y aurait mené à une mise en scène.
 *
 * Le socle est pourtant largement là — `cohorts`, `cohort_links`,
 * `cohort_members`, `cohort_snapshots`, plus `invite_to_cohort`,
 * `accept_cohort_link` et `revoke_cohort_link`. Ce qui manque est la lecture
 * « mes invitations », et le branchement de cet écran sur elle. Voir le lot K
 * du plan de travail.
 *
 * L'écran d'origine reste dans l'historique git.
 */
export default function RejoindreCohortePage() {
  notFound();
}
