export const OPERATION_TYPES = [
  "equity",
  "bank_debt",
  "dfi_or_grant",
  "due_diligence",
  "undecided",
] as const;

export type OperationType = (typeof OPERATION_TYPES)[number];

export const OPERATION_LIFECYCLES = [
  "draft",
  "active",
  "closed",
  "archived",
] as const;

export type OperationLifecycle = (typeof OPERATION_LIFECYCLES)[number];

export const OPERATION_SHARING_STATES = ["private", "shared"] as const;

export type OperationSharingState =
  (typeof OPERATION_SHARING_STATES)[number];

export interface OperationSummary {
  id: string;
  organizationId: string;
  name: string;
  type: OperationType;
  lifecycle: OperationLifecycle;
  sharingState: OperationSharingState;
  targetDate: string | null;
  tracksMultipleFunders: boolean;
}

export function operationSupportsInvestorTracking(
  operation: Pick<OperationSummary, "type" | "tracksMultipleFunders">,
): boolean {
  return operation.type === "equity" || operation.tracksMultipleFunders;
}
