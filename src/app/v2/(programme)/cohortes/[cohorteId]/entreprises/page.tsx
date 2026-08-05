import { RoutePlaceholder } from "@/features/v2/ui/RoutePlaceholder";

/** Écrans 04, 05 et 17 — lot B. */
export default function EntreprisesPage() {
  return (
    <RoutePlaceholder
      contract={[
        "Invitations en attente (écran 04) : envoyée, lien ouvert, à relancer, expirée.",
        "Entreprises actives (écran 05) : segments, opération présentée, préparation.",
        "Aucune donnée documentaire brute n’apparaît.",
      ]}
      purpose="Qui est dans la cohorte, et qui n’a pas encore répondu."
      title="Entreprises"
    />
  );
}
