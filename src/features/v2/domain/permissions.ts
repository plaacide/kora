/**
 * Les rôles internes des maquettes — quatre, quand la base n'en connaît que
 * `owner | admin | member | guest`. Aucun écran ne consomme encore ce tableau
 * de capacités : le jour où l'écran Équipe se branchera, il faudra soit
 * projeter ces quatre rôles sur les quatre de la base, soit migrer l'énumération.
 */
export const INTERNAL_ROLES_V2 = [
  "owner",
  "administrator",
  "contributor",
  "internal_viewer",
] as const;

export type InternalRoleV2 = (typeof INTERNAL_ROLES_V2)[number];

export const V2_CAPABILITIES = [
  "operation.read",
  "operation.manage",
  "preparation.manage",
  "document.read",
  "document.contribute",
  "document.manage",
  "access.read",
  "access.manage",
  "investor.read",
  "investor.manage",
  "activity.read",
  "team.manage",
  "security.manage",
] as const;

export type V2Capability = (typeof V2_CAPABILITIES)[number];

export const CAPABILITIES_BY_INTERNAL_ROLE: Record<
  InternalRoleV2,
  readonly V2Capability[]
> = {
  owner: V2_CAPABILITIES,
  administrator: V2_CAPABILITIES,
  contributor: [
    "operation.read",
    "preparation.manage",
    "document.read",
    "document.contribute",
    "access.read",
    "investor.read",
    "activity.read",
  ],
  internal_viewer: [
    "operation.read",
    "document.read",
    "access.read",
    "investor.read",
    "activity.read",
  ],
};

export function roleHasCapability(
  role: InternalRoleV2,
  capability: V2Capability,
): boolean {
  return CAPABILITIES_BY_INTERNAL_ROLE[role].includes(capability);
}
