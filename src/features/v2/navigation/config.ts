import {
  operationSupportsInvestorTracking,
  type OperationSummary,
} from "../domain/operation";
import { v2Routes } from "./routes";

export interface V2NavigationItem {
  id: string;
  label: string;
  href: string;
}

export const GLOBAL_NAVIGATION: readonly V2NavigationItem[] = [
  { id: "home", label: "Accueil", href: v2Routes.operations.list },
  { id: "operations", label: "Opérations", href: v2Routes.operations.list },
  {
    id: "invitations",
    label: "Invitations et demandes",
    href: v2Routes.invitations,
  },
  { id: "team", label: "Équipe", href: v2Routes.team },
  { id: "security", label: "Sécurité", href: v2Routes.security },
];

export function operationNavigation(
  operation: Pick<
    OperationSummary,
    "id" | "type" | "tracksMultipleFunders"
  >,
): readonly V2NavigationItem[] {
  const items: V2NavigationItem[] = [
    {
      id: "overview",
      label: "Vue d’ensemble",
      href: v2Routes.operations.overview(operation.id),
    },
    {
      id: "preparation",
      label: "Préparation",
      href: v2Routes.operations.preparation(operation.id),
    },
    {
      id: "access",
      label: "Partage et accès",
      href: v2Routes.operations.access(operation.id),
    },
  ];

  if (operationSupportsInvestorTracking(operation)) {
    items.push({
      id: "investors",
      label: "Investisseurs",
      href: v2Routes.operations.investors(operation.id),
    });
  }

  items.push({
    id: "activity",
    label: "Activité",
    href: v2Routes.operations.activity(operation.id),
  });

  return items;
}
