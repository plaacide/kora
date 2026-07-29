import type { InternalRoleV2 } from "./access";

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
